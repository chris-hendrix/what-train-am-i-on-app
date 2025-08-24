/**
 * Train Finder Service Types
 * 
 * Type definitions for train identification algorithm
 * Used for request/response structures and internal analysis
 */

import { TrainInfo } from '../../train-builder-service/index.js';

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
  
  /** Train direction (0 = uptown/north, 1 = downtown/south). Optional - if not provided, searches all directions */
  direction?: 0 | 1;
  
  /** Optional search radius in meters (default: 500) */
  radiusMeters?: number;
}


/**
 * Train candidate with position information
 */
export interface TrainCandidate extends TrainInfo {
  /** Train label/number (may be null) */
  label: string | null;
  
  /** Current position of the train */
  position: {
    latitude: number;
    longitude: number;
    bearing?: number;
    speed?: number;
  };
  
  /** Distance from user location to train (meters) */
  distanceToUser: number;
  
  /** Timestamp of the train position data (ISO format) */
  timestamp: string;
}

