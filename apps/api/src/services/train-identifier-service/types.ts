/**
 * Train Identifier Service Types
 * 
 * Type definitions for train identification inputs and outputs
 */

/**
 * Direction of travel on the subway line
 * 0 = uptown (northbound), 1 = downtown (southbound)
 */
export type Direction = 0 | 1;

/**
 * Input parameters for train identification
 */
export interface TrainIdentificationRequest {
  /** Subway line code (e.g., "6", "L", "N") */
  lineCode: string;
  /** Direction of travel (0 = uptown, 1 = downtown) */
  direction: Direction;
  /** Stop ID where the user is located */
  stopId: string;
  /** Number of trains to find in each direction (default: 2) */
  limit?: number;
  /** Reference timestamp for before/after comparison (ISO format, defaults to now) */
  timestamp?: string;
}

/**
 * Train information for a specific stop
 */
export interface TrainInfo {
  /** Unique trip identifier from GTFS-RT */
  tripId: string;
  /** Route ID (same as lineCode) */
  routeId: string;
  /** Direction ID (0=uptown, 1=downtown) */
  directionId: number;
  /** Estimated arrival time at the stop (ISO format) */
  arrivalTime: string;
  /** Vehicle entity ID from GTFS-RT feed */
  vehicleId: string;
  /** Current status of the vehicle */
  currentStatus?: string;
  /** Current delay in seconds (positive = late) */
  delay?: number;
  /** Stop ID where vehicle is currently located */
  currentStopId?: string;
  /** Current stop sequence number */
  currentStopSequence?: number;
}

/**
 * Response from train identification service
 */
export interface TrainIdentificationResponse {
  /** Trains that have passed or are approaching (chronological order) */
  trainsBefore: TrainInfo[];
  /** Trains that will arrive next (closest first) */
  trainsAfter: TrainInfo[];
  /** Request parameters that were used */
  request: TrainIdentificationRequest;
  /** Reference timestamp used for before/after split (ISO format) */
  referenceTimestamp: string;
  /** Timestamp when identification was performed */
  processedAt: string;
  /** Number of vehicles considered during matching */
  vehiclesConsidered: number;
}

/**
 * Error types for train identification failures
 */
export enum TrainIdentificationError {
  INVALID_LINE_CODE = 'INVALID_LINE_CODE',
  INVALID_DIRECTION = 'INVALID_DIRECTION', 
  INVALID_STOP_ID = 'INVALID_STOP_ID',
  NO_REAL_TIME_DATA = 'NO_REAL_TIME_DATA',
  NO_MATCHING_TRAINS = 'NO_MATCHING_TRAINS',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}