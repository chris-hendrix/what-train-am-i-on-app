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
import type { StopSequence } from '../gtfs-service/types/index.js';

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

    // Build complete stop schedule for this trip
    const stops = this.buildStopSchedule(tripUpdate, currentStopSequence, directionSequence);

    const train: TrainInfo = {
      tripId,
      routeId: vehicle.trip?.routeId || lineCode,
      directionId,
      directionName: this.getDirectionName(directionId),
      arrivalTime,
      vehicleId,
      delay: stopUpdate.arrival?.delay || stopUpdate.departure?.delay,
      currentStop: vehicle.stopId ? {
        stopId: vehicle.stopId,
        stopName: this.gtfsService.getStop(vehicle.stopId)?.stopName || vehicle.stopId,
        stopSequence: currentStopSequence,
        status: vehicle.currentStatus,
        statusName: this.getStatusName(vehicle.currentStatus)
      } : undefined,
      stops
    };

    return train;
  }

  /**
   * Build complete stop schedule from trip update data
   */
  private buildStopSchedule(tripUpdate: GTFSRTTripUpdate, currentStopSequence: number, directionSequence?: StopSequence): StopWithTiming[] {
    const stops: StopWithTiming[] = [];
    
    if (!tripUpdate.stopTimeUpdate) return stops;
    
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
      let status: 'past' | 'current' | 'future';
      if (stopSequence < currentStopSequence) {
        status = 'past';
      } else if (stopSequence === currentStopSequence) {
        status = 'current';
      } else {
        status = 'future';
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