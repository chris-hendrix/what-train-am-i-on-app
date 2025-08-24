/**
 * GTFS-RT Service Types
 * 
 * Type definitions for MTA GTFS-RT real-time data structures
 * Used exclusively within the GTFS-RT service for data parsing and querying
 */

/**
 * Protobuf Long integer representation
 * Used by protobuf for 64-bit integers like timestamps
 */
export interface ProtobufLong {
  low: number;
  high: number;
  unsigned: boolean;
}

/**
 * Raw GTFS-RT Feed Message structure
 */
export interface GTFSRTFeedMessage {
  /** Feed header containing metadata */
  header: {
    /** Version of GTFS Realtime spec used */
    gtfsRealtimeVersion: string;
    /** Determines if dataset is FULL_DATASET (0) or DIFFERENTIAL (1) */
    incrementality?: number;
    /** Unix timestamp when feed was created */
    timestamp?: ProtobufLong;
  };
  /** Array of entities containing vehicle or trip update data */
  entity: GTFSRTFeedEntity[];
}

/**
 * GTFS-RT Feed Entity (can contain vehicle or trip update)
 */
export interface GTFSRTFeedEntity {
  /** Unique identifier for this feed entity */
  id: string;
  /** Whether this entity should be deleted from the dataset */
  isDeleted?: boolean;
  /** Trip update information (arrival/departure predictions) */
  tripUpdate?: GTFSRTTripUpdate;
  /** Real-time vehicle position information */
  vehicle?: GTFSRTVehiclePosition;
}

/**
 * GTFS-RT Vehicle Position information
 */
export interface GTFSRTVehiclePosition {
  /** Trip descriptor identifying the trip this vehicle is serving */
  trip?: {
    /** Unique identifier for the trip from GTFS trips.txt */
    tripId: string;
    /** Route identifier from GTFS routes.txt (e.g., "1", "N", "Q") */
    routeId: string;
    /** Direction of travel: 0 or 1 as defined in GTFS trips.txt */
    directionId?: number;
    /** Initially scheduled start time of trip (HH:MM:SS format) */
    startTime?: string;
    /** Service date for this trip (YYYYMMDD format) */
    startDate?: string;
  };
  /** Current geographical position of the vehicle */
  position?: {
    /** WGS-84 latitude coordinate */
    latitude: number;
    /** WGS-84 longitude coordinate */
    longitude: number;
    /** Bearing in degrees clockwise from North (0-360) */
    bearing?: number;
    /** Current speed of vehicle in meters per second */
    speed?: number;
  };
  /** Index of current stop in the stop_times sequence */
  currentStopSequence?: number;
  /** Current status: "INCOMING_AT", "STOPPED_AT", "IN_TRANSIT_TO" */
  currentStatus?: string;
  /** Unix timestamp when vehicle position was measured */
  timestamp?: ProtobufLong;
  /** ID of stop vehicle is currently at or approaching */
  stopId?: string;
  /** User-visible label for the vehicle (train car number, etc.) */
  label?: string;
}

/**
 * GTFS-RT Trip Update information
 */
export interface GTFSRTTripUpdate {
  /** Trip descriptor identifying which trip this update applies to */
  trip: {
    /** Unique identifier for the trip from GTFS trips.txt */
    tripId: string;
    /** Route identifier from GTFS routes.txt (e.g., "1", "N", "Q") */
    routeId: string;
    /** Direction of travel: 0 or 1 as defined in GTFS trips.txt */
    directionId?: number;
    /** Initially scheduled start time of trip (HH:MM:SS format) */
    startTime?: string;
    /** Service date for this trip (YYYYMMDD format) */
    startDate?: string;
  };
  /** Array of stop time updates for this trip */
  stopTimeUpdate: GTFSRTStopTimeUpdate[];
  /** Unix timestamp when this trip update was generated */
  timestamp?: ProtobufLong;
  /** Current delay of the trip in seconds (positive = late, negative = early) */
  delay?: number;
}

/**
 * GTFS-RT Stop Time Update
 */
export interface GTFSRTStopTimeUpdate {
  /** Index in the stop_times sequence for this stop */
  stopSequence?: number;
  /** Stop identifier from GTFS stops.txt */
  stopId?: string;
  /** Arrival time prediction information */
  arrival?: {
    /** Delay in seconds from scheduled arrival (positive = late) */
    delay?: number;
    /** Absolute arrival time as Unix timestamp */
    time?: ProtobufLong;
    /** Uncertainty of prediction in seconds */
    uncertainty?: number;
  };
  /** Departure time prediction information */
  departure?: {
    /** Delay in seconds from scheduled departure (positive = late) */
    delay?: number;
    /** Absolute departure time as Unix timestamp */
    time?: ProtobufLong;
    /** Uncertainty of prediction in seconds */
    uncertainty?: number;
  };
  /** Schedule relationship: 0=SCHEDULED, 1=SKIPPED, 2=NO_DATA */
  scheduleRelationship?: number;
}


/**
 * Processed vehicle position with feed metadata
 */
export interface VehiclePositionWithFeed {
  /** Unique entity identifier from the feed */
  id: string;
  /** Vehicle position data from GTFS-RT feed */
  vehicle: GTFSRTVehiclePosition;
  /** Comma-separated list of train lines this feed covers */
  feedLines: string;
  /** Unix timestamp when this data was processed */
  timestamp?: ProtobufLong;
}

/**
 * Processed trip update with feed metadata
 */
export interface TripUpdateWithFeed {
  /** Unique entity identifier from the feed */
  id: string;
  /** Trip update data from GTFS-RT feed */
  tripUpdate: GTFSRTTripUpdate;
  /** Comma-separated list of train lines this feed covers */
  feedLines: string;
  /** Unix timestamp when this data was processed */
  timestamp?: ProtobufLong;
}


/**
 * Feed cache entry
 */
export interface FeedCacheEntry {
  /** Parsed GTFS-RT feed message data */
  data: GTFSRTFeedMessage;
  /** Unix timestamp when this entry was cached */
  timestamp: number;
  /** Time-to-live in milliseconds for cache invalidation */
  ttl: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total number of entries currently in cache */
  size: number;
  /** Array of cache entry keys/identifiers */
  entries: string[];
}