/**
 * Train Identifier Service
 * 
 * Identifies specific trains based on user location, line, direction and next stop.
 * Uses real-time GTFS-RT data to match vehicles with user expectations.
 */

import { GTFSRTService } from '../gtfs-rt-service/index.js';
import { VehiclePositionWithFeed } from '../gtfs-rt-service/types/index.js';
import { GTFSService } from '../gtfs-service/index.js';
import { 
  TrainBuilderService,
  TrainIdentificationRequest,
  TrainIdentificationResponse,
  TrainInfo,
  StopInfo,
  StopWithTiming,
  TrainIdentificationError,
} from '../train-builder-service/index.js';

export class TrainIdentifierService {
  private static instance: TrainIdentifierService;
  private gtfsRTService: GTFSRTService;
  private gtfsService: GTFSService;
  private trainBuilderService: TrainBuilderService;

  private constructor() {
    this.gtfsRTService = GTFSRTService.getInstance();
    this.gtfsService = GTFSService.getInstance();
    this.trainBuilderService = TrainBuilderService.getInstance();
  }

  public static getInstance(): TrainIdentifierService {
    if (!TrainIdentifierService.instance) {
      TrainIdentifierService.instance = new TrainIdentifierService();
    }
    return TrainIdentifierService.instance;
  }

  /**
   * Identify trains matching the user's criteria
   */
  public async identifyTrain(request: TrainIdentificationRequest): Promise<TrainIdentificationResponse> {
    this.validateRequest(request);

    // Ensure GTFS static data is loaded
    await this.gtfsService.loadData();

    const vehicles = await this.gtfsRTService.getVehiclePositions(request.lineCode, request.direction);

    if (!vehicles || vehicles.length === 0) {
      throw new Error(TrainIdentificationError.NO_REAL_TIME_DATA);
    }

    // Get user's stop information
    const userStopInfo = this.getUserStopInfo(request.lineCode, request.direction, request.stopId);

    const limit = request.limit ?? 2;

    // Find all valid vehicles
    const validVehicles = this.findValidVehicles(
      vehicles,
      limit * 2 // Get more vehicles to have options on both sides
    );

    // Map vehicles to trains and calculate stopsAway
    const trainPromises = validVehicles.map(async (vehicleWithFeed) => {
      const train = await this.trainBuilderService.buildTrainFromVehicleId(vehicleWithFeed.id, request.lineCode);
      if (train) {
        // Calculate stopsAway
        train.stopsAway = this.calculateStopsAway(train.staticStops, request.stopId);
      }
      return train;
    });
    
    const trains: TrainInfo[] = (await Promise.all(trainPromises))
      .filter(train => train !== null) as TrainInfo[];

    // Sort by stopsAway (closest approaching trains first, then passed trains)
    trains.sort((a, b) => a.stopsAway - b.stopsAway);

    return {
      trains,
      userStop: userStopInfo,
      request,
      processedAt: new Date().toISOString()
    };
  }




  /**
   * Find and filter valid vehicles
   */
  private findValidVehicles(
    vehicles: VehiclePositionWithFeed[],
    limit: number
  ): VehiclePositionWithFeed[] {
    // Filter vehicles with valid data
    const validVehicles = vehicles.filter(vehicleWithFeed => 
      vehicleWithFeed.vehicle.trip?.tripId && 
      vehicleWithFeed.vehicle.currentStopSequence
    );

    return validVehicles.slice(0, limit);
  }




  /**
   * Calculate stopsAway using stop schedule data
   * 
   * @param stops Array of stops from the train
   * @param userStopId The user's stop ID
   * @returns Number of stops away (negative = approaching, positive = passed)
   */
  private calculateStopsAway(stops: StopWithTiming[], userStopId: string): number {
    if (!stops || stops.length === 0) return 0;
    
    // Find the current stop (marked as 'current' status) 
    const currentStopIndex = stops.findIndex(stop => stop.status === 'current');
    if (currentStopIndex === -1) return 0;
    
    // Find user stop in the schedule
    const userStopIndex = stops.findIndex(stop => stop.stopId === userStopId);
    if (userStopIndex === -1) return 0;
    
    // Simple difference: negative = approaching, positive = passed
    return currentStopIndex - userStopIndex;
  }

  /**
   * Get user's stop information including sequence data
   */
  private getUserStopInfo(lineCode: string, direction: number, stopId: string): StopInfo {
    const stop = this.gtfsService.getStop(stopId);
    const stopSequences = this.gtfsService.getStopSequencesForRoute(lineCode);
    const directionSequence = stopSequences.find(seq => seq.directionId === direction);
    
    const stopInSequence = directionSequence?.stops.find(s => s.stopId === stopId);
    
    return {
      stopId,
      stopName: stop?.stopName || stopId,
      stopSequence: stopInSequence?.stopSequence
    };
  }


  /**
   * Validate the identification request
   */
  private validateRequest(request: TrainIdentificationRequest): void {
    if (!request.lineCode) {
      throw new Error(TrainIdentificationError.INVALID_LINE_CODE);
    }

    if (![0, 1].includes(request.direction)) {
      throw new Error(TrainIdentificationError.INVALID_DIRECTION);
    }

    if (!request.stopId) {
      throw new Error(TrainIdentificationError.INVALID_STOP_ID);
    }
  }
}

export * from '../train-builder-service/types.js';