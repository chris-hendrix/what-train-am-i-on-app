/**
 * GTFS-RT Service Types
 * 
 * Type definitions for MTA GTFS-RT real-time data structures
 * Used exclusively within the GTFS-RT service for data parsing and querying
 */

/**
 * Raw GTFS-RT Feed Message structure
 */
export interface GTFSRTFeedMessage {
  header: {
    gtfsRealtimeVersion: string;
    incrementality?: number;
    timestamp?: number;
  };
  entity: GTFSRTFeedEntity[];
}

/**
 * GTFS-RT Feed Entity (can contain vehicle or trip update)
 */
export interface GTFSRTFeedEntity {
  id: string;
  isDeleted?: boolean;
  tripUpdate?: GTFSRTTripUpdate;
  vehicle?: GTFSRTVehiclePosition;
}

/**
 * GTFS-RT Vehicle Position information
 */
export interface GTFSRTVehiclePosition {
  trip?: {
    tripId: string;
    routeId: string;
    directionId?: number;
    startTime?: string;
    startDate?: string;
  };
  position?: {
    latitude: number;
    longitude: number;
    bearing?: number;
    speed?: number;
  };
  currentStopSequence?: number;
  currentStatus?: number;
  timestamp?: number;
  stopId?: string;
  label?: string;
}

/**
 * GTFS-RT Trip Update information
 */
export interface GTFSRTTripUpdate {
  trip: {
    tripId: string;
    routeId: string;
    directionId?: number;
    startTime?: string;
    startDate?: string;
  };
  stopTimeUpdate: GTFSRTStopTimeUpdate[];
  timestamp?: number;
  delay?: number;
}

/**
 * GTFS-RT Stop Time Update
 */
export interface GTFSRTStopTimeUpdate {
  stopSequence?: number;
  stopId?: string;
  arrival?: {
    delay?: number;
    time?: number;
    uncertainty?: number;
  };
  departure?: {
    delay?: number;
    time?: number;
    uncertainty?: number;
  };
  scheduleRelationship?: number;
}


/**
 * Processed vehicle position with feed metadata
 */
export interface VehiclePositionWithFeed {
  id: string;
  vehicle: GTFSRTVehiclePosition;
  feedLines: string;
  timestamp?: number;
}

/**
 * Processed trip update with feed metadata
 */
export interface TripUpdateWithFeed {
  id: string;
  tripUpdate: GTFSRTTripUpdate;
  feedLines: string;
  timestamp?: number;
}


/**
 * Feed cache entry
 */
export interface FeedCacheEntry {
  data: GTFSRTFeedMessage;
  timestamp: number;
  ttl: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  size: number;
  entries: string[];
}