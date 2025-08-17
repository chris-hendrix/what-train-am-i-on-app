/**
 * Train Identifier Service
 * 
 * Identifies specific trains based on user location, line, direction and next stop.
 * Uses real-time GTFS-RT data to match vehicles with user expectations.
 */

import { GTFSRTService } from '../gtfs-rt-service/index.js';
import {
  TrainIdentificationRequest,
  TrainIdentificationResponse,
  TrainInfo,
  TrainIdentificationError
} from './types.js';
import { convertTimestamp } from './utils.js';

export class TrainIdentifierService {
  private static instance: TrainIdentifierService;
  private gtfsRTService: GTFSRTService;

  private constructor() {
    this.gtfsRTService = GTFSRTService.getInstance();
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

    const vehicles = await this.gtfsRTService.getVehiclePositions(request.lineCode);
    const tripUpdates = await this.gtfsRTService.getTripUpdates(request.lineCode);

    if (!vehicles || vehicles.length === 0) {
      throw new Error(TrainIdentificationError.NO_REAL_TIME_DATA);
    }

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

    // Find trains before and after the stop
    const trainsAtStop: Array<{ train: TrainInfo; arrivalTime: number }> = [];

    for (const vehicleWithFeed of candidateVehicles) {
      const vehicle = vehicleWithFeed.vehicle;
      const tripId = vehicle.trip?.tripId;
      if (!tripId) continue;

      // Find trip update for this vehicle
      const tripUpdate = tripUpdates.find(tu => tu.tripUpdate?.trip?.tripId === tripId);
      if (!tripUpdate) continue;

      // Find stop in trip schedule
      const stopUpdate = tripUpdate.tripUpdate.stopTimeUpdate?.find(stu => stu.stopId === request.stopId);
      if (!stopUpdate) continue;

      const arrivalTime = convertTimestamp(stopUpdate.arrival?.time || stopUpdate.departure?.time);
      if (!arrivalTime) continue;

      // Extract direction from trip ID for response
      const directionId = tripId.includes('..N') || tripId.includes('.N') ? 0 : 1;

      const train: TrainInfo = {
        tripId,
        routeId: vehicle.trip?.routeId || '',
        directionId,
        arrivalTime,
        vehicleId: vehicleWithFeed.id,
        currentStatus: vehicle.currentStatus,
        delay: stopUpdate.arrival?.delay || stopUpdate.departure?.delay,
        currentStopId: vehicle.stopId,
        currentStopSequence: vehicle.currentStopSequence
      };

      trainsAtStop.push({ train, arrivalTime: new Date(arrivalTime).getTime() });
    }

    // Sort by arrival time
    trainsAtStop.sort((a, b) => a.arrivalTime - b.arrivalTime);

    const referenceTime = request.timestamp ? new Date(request.timestamp).getTime() : Date.now();
    const limit = request.limit ?? 2;
    
    // Split trains into before/after and limit results
    const trainsBefore: TrainInfo[] = [];
    const trainsAfter: TrainInfo[] = [];

    for (const { train, arrivalTime } of trainsAtStop) {
      if (arrivalTime <= referenceTime) {
        trainsBefore.push(train);
      } else {
        trainsAfter.push(train);
      }
    }

    // Limit results
    // trainsBefore: keep chronological order, just limit
    trainsBefore.splice(limit);
    // trainsAfter: already in correct order (earliest first), just limit
    trainsAfter.splice(limit);


    return {
      trainsBefore,
      trainsAfter,
      request,
      referenceTimestamp: new Date(referenceTime).toISOString(),
      processedAt: new Date().toISOString(),
      vehiclesConsidered: candidateVehicles.length
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

export * from './types.js';