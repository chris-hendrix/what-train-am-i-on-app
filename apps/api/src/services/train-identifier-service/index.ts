/**
 * Train Identifier Service
 * 
 * Identifies specific trains based on user location, line, direction and next stop.
 * Uses real-time GTFS-RT data to match vehicles with user expectations.
 */

import { GTFSRTService } from '../gtfs-rt-service/index.js';
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

    const vehicles = await this.gtfsRTService.getVehiclePositions(request.lineCode);
    const tripUpdates = await this.gtfsRTService.getTripUpdates(request.lineCode);

    if (!vehicles || vehicles.length === 0) {
      throw new Error(TrainIdentificationError.NO_REAL_TIME_DATA);
    }

    // Get surrounding stops (±3 stops from user's stop)
    const surroundingStops = this.getSurroundingStops(request.lineCode, request.direction, request.stopId);
    
    // Get user's stop information
    const userStopInfo = this.getUserStopInfo(request.lineCode, request.direction, request.stopId);

    // Filter vehicles by route and direction using trip ID
    const candidateVehicles = vehicles
      .filter(v => {
        const vehicle = v.vehicle;
        if (vehicle.trip?.routeId !== request.lineCode) return false;
        
        const tripId = vehicle.trip?.tripId;
        if (!tripId) return false;
        
        // Extract direction from trip ID
        const trainDirection = tripId.includes('..N') || tripId.includes('.N') ? 0 : 
                              tripId.includes('..S') || tripId.includes('.S') ? 1 : -1;
        return trainDirection === request.direction;
      });

    // Get user's stop sequence for position comparison
    const stopSequences = this.gtfsService.getStopSequencesForRoute(request.lineCode);
    const directionSequence = stopSequences.find(seq => seq.directionId === request.direction);
    const userStopSequence = directionSequence?.stops.find(s => s.stopId === request.stopId)?.stopSequence;
    
    if (!userStopSequence) {
      throw new Error(`Unable to find stop sequence for ${request.stopId}`);
    }

    // Find trains in the surrounding stops window
    const trainsInWindow: Array<{ train: TrainInfo; currentStopSequence: number }> = [];

    for (const vehicleWithFeed of candidateVehicles) {
      const vehicle = vehicleWithFeed.vehicle;
      const tripId = vehicle.trip?.tripId;
      if (!tripId) continue;

      // Find trip update for this vehicle
      const tripUpdate = tripUpdates.find(tu => tu.tripUpdate?.trip?.tripId === tripId);
      if (!tripUpdate) continue;

      // Find any stop in our surrounding stops window
      const stopUpdate = tripUpdate.tripUpdate.stopTimeUpdate?.find(stu => 
        stu.stopId && surroundingStops.includes(stu.stopId)
      );
      if (!stopUpdate) continue;

      // Use TrainBuilderService to build the train
      const train = this.trainBuilderService.buildTrain({
        vehicle,
        tripUpdate: tripUpdate.tripUpdate,
        vehicleId: vehicleWithFeed.id,
        lineCode: request.lineCode,
        direction: request.direction
      });

      if (!train) continue;

      // Get current stop sequence for sorting
      const currentStopSequence = this.trainBuilderService.getCurrentStopSequence(
        vehicle, 
        request.lineCode, 
        request.direction
      );

      trainsInWindow.push({ train, currentStopSequence });
    }

    const limit = request.limit ?? 2;
    
    // Split trains into before/after based on stop sequence position
    const trainsBefore: TrainInfo[] = [];
    const trainsAfter: TrainInfo[] = [];

    for (const { train, currentStopSequence } of trainsInWindow) {
      if (currentStopSequence <= userStopSequence) {
        trainsBefore.push(train);
      } else {
        trainsAfter.push(train);
      }
    }

    // Sort trainsBefore by sequence (closest to user first = highest sequence)
    trainsBefore.sort((a, b) => {
      const aSeq = trainsInWindow.find(t => t.train.tripId === a.tripId)?.currentStopSequence || 0;
      const bSeq = trainsInWindow.find(t => t.train.tripId === b.tripId)?.currentStopSequence || 0;
      return bSeq - aSeq; // Descending - closest to user first
    });
    
    // Sort trainsAfter by sequence (closest to user first = lowest sequence)
    trainsAfter.sort((a, b) => {
      const aSeq = trainsInWindow.find(t => t.train.tripId === a.tripId)?.currentStopSequence || 0;
      const bSeq = trainsInWindow.find(t => t.train.tripId === b.tripId)?.currentStopSequence || 0;
      return aSeq - bSeq; // Ascending - closest to user first
    });

    // Limit results
    trainsBefore.splice(limit);
    trainsAfter.splice(limit);


    return {
      trainsBefore,
      trainsAfter,
      userStop: userStopInfo,
      request,
      processedAt: new Date().toISOString(),
      vehiclesConsidered: candidateVehicles.length
    };
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
   * Get surrounding stops (±3 stops) from the user's current stop
   */
  private getSurroundingStops(lineCode: string, direction: number, currentStopId: string): string[] {
    const stopSequences = this.gtfsService.getStopSequencesForRoute(lineCode);
    const directionSequence = stopSequences.find(seq => seq.directionId === direction);
    
    if (!directionSequence) {
      return [currentStopId]; // Fallback to just current stop
    }

    // Sort stops by sequence number
    const sortedStops = directionSequence.stops.sort((a, b) => a.stopSequence - b.stopSequence);
    
    // Find current stop index
    const currentIndex = sortedStops.findIndex(stop => stop.stopId === currentStopId);
    
    if (currentIndex === -1) {
      return [currentStopId]; // Fallback if stop not found
    }

    // Get ±3 stops window
    const windowSize = 3;
    const startIndex = Math.max(0, currentIndex - windowSize);
    const endIndex = Math.min(sortedStops.length - 1, currentIndex + windowSize);
    
    const surroundingStops = [];
    for (let i = startIndex; i <= endIndex; i++) {
      surroundingStops.push(sortedStops[i].stopId);
    }
    
    return surroundingStops;
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