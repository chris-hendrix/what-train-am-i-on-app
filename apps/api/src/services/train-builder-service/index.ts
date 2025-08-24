/**
 * Train Builder Service
 * 
 * Builds TrainInfo objects from GTFS-RT data with complete stop schedules,
 * status information, and consistent positioning data.
 */

import { GTFSRTService } from '../gtfs-rt-service/index.js';
import { GTFSService } from '../gtfs-service/index.js';
import { TrainInfo, StopWithTiming } from './types.js';
import type { ProtobufLong, GTFSRTTripUpdate } from '../gtfs-rt-service/types/index.js';
import type { StopSequence, GTFSStopTime } from '../gtfs-service/types/index.js';

export class TrainBuilderService {
  private static instance: TrainBuilderService;
  private gtfsRTService: GTFSRTService;
  private gtfsService: GTFSService;

  private constructor() {
    this.gtfsRTService = GTFSRTService.getInstance();
    this.gtfsService = GTFSService.getInstance();
  }

  public static getInstance(): TrainBuilderService {
    if (!TrainBuilderService.instance) {
      TrainBuilderService.instance = new TrainBuilderService();
    }
    return TrainBuilderService.instance;
  }

  /**
   * Build a complete TrainInfo object from a vehicle ID
   */
  public async buildTrainFromVehicleId(vehicleId: string, lineCode: string): Promise<TrainInfo | null> {
    // Get the vehicle data
    const vehicles = await this.gtfsRTService.getVehiclePositions(lineCode);
    const vehicleWithFeed = vehicles?.find(v => v.id === vehicleId);
    if (!vehicleWithFeed) return null;

    // Get the trip update data
    const tripUpdates = await this.gtfsRTService.getTripUpdates(lineCode);
    const tripUpdateWithFeed = tripUpdates?.find(tu => tu.tripUpdate?.trip?.tripId === vehicleWithFeed.vehicle.trip?.tripId);
    if (!tripUpdateWithFeed) return null;

    // Extract data from the fetched objects
    const vehicle = vehicleWithFeed.vehicle;
    const tripUpdate = tripUpdateWithFeed.tripUpdate;
    const tripId = vehicle.trip?.tripId;
    if (!tripId) return null;

    // Determine direction from trip ID
    const direction = tripId.includes('..N') || tripId.includes('.N') ? 0 : 1;

    // Find any stop in the trip update for arrival time
    const stopUpdate = tripUpdate.stopTimeUpdate?.find(stu => 
      stu.arrival?.time || stu.departure?.time
    );
    if (!stopUpdate) return null;

    const arrivalTime = this.convertTimestamp(stopUpdate.arrival?.time || stopUpdate.departure?.time);
    if (!arrivalTime) return null;

    // Get stop sequences for this route and direction
    const stopSequences = this.gtfsService.getStopSequencesForRoute(lineCode);
    const directionSequence = stopSequences.find(seq => seq.directionId === direction);

    // Get current stop sequence from real-time data
    const currentStopSequence = vehicle.currentStopSequence || 0;

    // Extract direction from trip ID for response
    const directionId = tripId.includes('.N') ? 0 : 1;

    // Build real-time stop schedule from trip updates
    const realtimeStops = this.buildRealtimeStopSchedule(tripUpdate, currentStopSequence, directionSequence, vehicle.stopId);

    // Get complete schedule
    const staticStops = this.buildCompleteStopSchedule(tripId, currentStopSequence, direction);

    const train: TrainInfo = {
      tripId,
      routeId: vehicle.trip?.routeId || lineCode,
      directionId,
      directionName: this.getDirectionName(directionId),
      arrivalTime,
      vehicleId,
      delay: stopUpdate.arrival?.delay || stopUpdate.departure?.delay,
      stopsAway: 0, // Will be set by the train identifier service
      currentStop: vehicle.stopId ? {
        stopId: vehicle.stopId,
        stopName: this.gtfsService.getStop(vehicle.stopId)?.stopName || vehicle.stopId,
        stopSequence: currentStopSequence,
        status: vehicle.currentStatus,
        statusName: this.getStatusName(vehicle.currentStatus)
      } : undefined,
      realtimeStops,
      staticStops
    };

    return train;
  }

  /**
   * Build complete stop schedule from trip update data
   */
  private buildRealtimeStopSchedule(tripUpdate: GTFSRTTripUpdate, currentStopSequence: number, directionSequence?: StopSequence, vehicleCurrentStopId?: string): StopWithTiming[] {
    const stops: StopWithTiming[] = [];
    
    if (!tripUpdate.stopTimeUpdate) return stops;
    
    // Extract direction from trip ID
    const tripId = tripUpdate.trip?.tripId;
    const direction = tripId && (tripId.includes('..N') || tripId.includes('.N')) ? 0 : 1;
    
    // Track which stops we've added from trip updates
    const addedStopIds = new Set<string>();
    
    for (const stopTimeUpdate of tripUpdate.stopTimeUpdate) {
      if (!stopTimeUpdate.stopId) continue;
      
      const stop = this.gtfsService.getStop(stopTimeUpdate.stopId);
      const arrivalTime = this.convertTimestamp(stopTimeUpdate.arrival?.time || stopTimeUpdate.departure?.time);
      
      if (!arrivalTime) continue;
      
      // Get stop sequence from GTFS static data
      let stopSequence = stopTimeUpdate.stopSequence || 0;
      if (!stopSequence && directionSequence) {
        const stopInSequence = directionSequence.stops.find(s => s.stopId === stopTimeUpdate.stopId);
        stopSequence = stopInSequence?.stopSequence || 0;
      }
      
      // Determine status based on current train position
      // For real-time data, compare by stopId since sequences may differ between systems
      let status: 'past' | 'current' | 'future';
      
      if (vehicleCurrentStopId && stopTimeUpdate.stopId === vehicleCurrentStopId) {
        status = 'current';
      } else {
        // Direction-aware status logic
        if (direction === 0) { // Uptown - sequences increase
          status = stopSequence < currentStopSequence ? 'past' : 'future';
        } else { // Downtown - sequences decrease  
          status = stopSequence > currentStopSequence ? 'past' : 'future';
        }
      }
      
      stops.push({
        stopId: stopTimeUpdate.stopId,
        stopName: stop?.stopName || stopTimeUpdate.stopId,
        stopSequence,
        arrivalTime,
        departureTime: stopTimeUpdate.departure?.time ? this.convertTimestamp(stopTimeUpdate.departure.time) : undefined,
        delay: stopTimeUpdate.arrival?.delay || stopTimeUpdate.departure?.delay,
        status
      });
      
      addedStopIds.add(stopTimeUpdate.stopId);
    }
    
    // Sort by stop sequence
    return stops.sort((a, b) => a.stopSequence - b.stopSequence);
  }


  /**
   * Convert direction ID to human-readable name
   */
  private getDirectionName(directionId: number): string {
    return directionId === 0 ? 'uptown' : 'downtown';
  }

  /**
   * Convert vehicle status code to human-readable name
   */
  private getStatusName(status: number | string | undefined): string {
    if (status === undefined || status === null) return 'unknown';
    
    const statusCode = typeof status === 'string' ? parseInt(status) : status;
    
    switch (statusCode) {
      case 0: return 'incoming';
      case 1: return 'stopped';
      case 2: return 'in_transit';
      default: return 'unknown';
    }
  }

  /**
   * Build complete stop schedule from GTFS data with status based on current position
   */
  private buildCompleteStopSchedule(realtimeTripId: string, currentStopSequence: number, direction: number): StopWithTiming[] {
    const staticSchedule = this.getCompleteStopSchedule(realtimeTripId);
    if (!staticSchedule) return [];

    return staticSchedule.map(gtfsStop => {
      // Determine status based on current train position and direction
      let status: 'past' | 'current' | 'future';
      if (gtfsStop.stopSequence === currentStopSequence) {
        status = 'current';
      } else {
        // Direction-aware status logic
        if (direction === 0) { // Uptown - sequences increase
          status = gtfsStop.stopSequence < currentStopSequence ? 'past' : 'future';
        } else { // Downtown - sequences decrease  
          status = gtfsStop.stopSequence > currentStopSequence ? 'past' : 'future';
        }
      }

      return {
        stopId: gtfsStop.stopId,
        stopName: this.gtfsService.getStop(gtfsStop.stopId)?.stopName || gtfsStop.stopId,
        stopSequence: gtfsStop.stopSequence,
        arrivalTime: gtfsStop.arrivalTime,
        departureTime: gtfsStop.departureTime,
        delay: 0, // Static schedule has no delay info
        status
      };
    });
  }

  /**
   * Get complete stop schedule for a trip based on real-time trip ID
   * 
   * Real-time trip IDs (e.g., "080500_N..N34R") need to be matched with
   * GTFS static trip IDs which have service prefixes (e.g., "L0S2-N-2057-S05_080500_N..N34R")
   * 
   * @param realtimeTripId - Trip ID from real-time GTFS-RT feed
   * @returns Array of stop times for the trip, sorted by stop sequence, or null if not found
   * 
   * @example
   * ```typescript
   * const schedule = trainBuilderService.getCompleteStopSchedule("080500_N..N34R");
   * if (schedule) {
   *   console.log(`Trip has ${schedule.length} stops`);
   *   schedule.forEach(stop => console.log(`${stop.stopId} at ${stop.arrivalTime}`));
   * }
   * ```
   */
  public getCompleteStopSchedule(realtimeTripId: string): GTFSStopTime[] | null {
    // Find the matching trip ID with prefix
    // Real-time: "080500_N..N34R"  
    // GTFS: "L0S2-N-2057-S05_080500_N..N34R" (or similar prefix)
    let matchingTripId: string | null = null;
    
    for (const tripId of this.gtfsService.getAllTripIds()) {
      if (tripId.endsWith(realtimeTripId)) {
        matchingTripId = tripId;
        break;
      }
    }

    if (!matchingTripId) {
      return null;
    }

    // Get stop times for this trip and sort by stop sequence
    const stopTimes = this.gtfsService.getStopTimesForTrip(matchingTripId);
    return stopTimes.sort((a, b) => a.stopSequence - b.stopSequence);
  }

  /**
   * Convert protobuf Long object to ISO string timestamp
   * Protobuf represents 64-bit integers as {low, high, unsigned} objects
   */
  private convertTimestamp(timestamp: ProtobufLong | undefined): string {
    if (!timestamp) return '';
    
    // Convert protobuf Long to number (assuming high is 0 for typical timestamps)
    const value = timestamp.high === 0 ? timestamp.low : (timestamp.high * 0x100000000) + timestamp.low;
    // Convert Unix timestamp (seconds) to ISO string
    return new Date(value * 1000).toISOString();
  }
}

export * from './types.js';