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

    // Find vehicles around user stop
    const { vehiclesBefore, vehiclesAfter } = this.findVehiclesNearStop(
      vehicles,
      userStopInfo.stopSequence!,
      limit
    );

    // Map vehicles to trains using simplified API
    const trainsBeforePromises = vehiclesBefore.map(vehicleWithFeed => 
      this.trainBuilderService.buildTrainFromVehicleId(vehicleWithFeed.id, request.lineCode)
    );
    const trainsBefore: TrainInfo[] = (await Promise.all(trainsBeforePromises)).filter(train => train !== null) as TrainInfo[];

    const trainsAfterPromises = vehiclesAfter.map(vehicleWithFeed => 
      this.trainBuilderService.buildTrainFromVehicleId(vehicleWithFeed.id, request.lineCode)
    );
    const trainsAfter: TrainInfo[] = (await Promise.all(trainsAfterPromises)).filter(train => train !== null) as TrainInfo[];

    return {
      trainsBefore,
      trainsAfter,
      userStop: userStopInfo,
      request,
      processedAt: new Date().toISOString()
    };
  }




  /**
   * Find vehicles near the user's stop position
   */
  private findVehiclesNearStop(
    vehicles: VehiclePositionWithFeed[],
    userStopSequence: number,
    limit: number
  ): { vehiclesBefore: VehiclePositionWithFeed[], vehiclesAfter: VehiclePositionWithFeed[] } {
    // Filter vehicles with valid data and sort by sequence once
    const validVehicles = vehicles
      .filter(vehicleWithFeed => 
        vehicleWithFeed.vehicle.trip?.tripId && 
        vehicleWithFeed.vehicle.currentStopSequence
      )
      .sort((a, b) => (a.vehicle.currentStopSequence || 0) - (b.vehicle.currentStopSequence || 0));

    // Split into before/after and apply limits
    const vehiclesBefore = validVehicles
      .filter(v => (v.vehicle.currentStopSequence || 0) <= userStopSequence)
      .reverse() // Reverse to get closest first for before
      .slice(0, limit);

    const vehiclesAfter = validVehicles
      .filter(v => (v.vehicle.currentStopSequence || 0) > userStopSequence)
      .slice(0, limit);

    return { vehiclesBefore, vehiclesAfter };
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