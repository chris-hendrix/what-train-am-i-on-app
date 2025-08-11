/**
 * Train Finder Service Types
 * 
 * Type definitions for train identification algorithm
 * Used for request/response structures and internal analysis
 */

/**
 * Input request for train identification
 */
export interface TrainFinderRequest {
  /** User's current latitude (WGS84) */
  userLatitude: number;
  
  /** User's current longitude (WGS84) */
  userLongitude: number;
  
  /** NYC subway line code (e.g., '6', 'N', 'Q', 'A', etc.) */
  lineCode: string;
  
  /** Train direction (0 = typically uptown/north, 1 = typically downtown/south) */
  direction: number;
}


/**
 * Train candidate with position information
 */
export interface TrainCandidate {
  /** Vehicle ID from GTFS-RT feed */
  vehicleId: string;
  
  /** Trip ID from GTFS-RT (may be null) */
  tripId: string | null;
  
  /** Route ID (line code) */
  routeId: string;
  
  /** Train label/number (may be null) */
  label: string | null;
  
  /** Current position of the train */
  position: {
    latitude: number;
    longitude: number;
    bearing?: number;
    speed?: number;
  };
  
  /** Current stop ID the train is at/approaching */
  currentStopId: string | null;
  
  /** Current stop sequence number */
  currentStopSequence: number | null;
  
  /** Current status of the train */
  currentStatus: number | null;
  
  /** Direction ID (0 or 1 typically) */
  direction: number | null;
  
  /** Distance from user location to train (meters) */
  distanceToUser: number;
  
  /** Timestamp of the train position data */
  timestamp: number;
}

