// API response types

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Success response wrapper
 */
export interface SuccessResponse<T = unknown> extends ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Error response wrapper
 */
export interface ErrorResponse extends ApiResponse<never> {
  success: false;
  error: string;
}

/**
 * Nearest trains request payload
 */
export interface NearestTrainsRequest {
  latitude: number;
  longitude: number;
  lineCode: string;
  direction: number;
  /** Optional search radius in meters (default: 500) */
  radiusMeters?: number;
}

/**
 * Individual train data in the response
 */
export interface TrainData {
  trainId: string;
  line: {
    code: string;
    name: string;
    color: string;
  };
  direction: string;
  currentStation: string;
  nextStops: NextStop[];
  serviceType: string;
  distanceMeters: number;
  lastUpdated: string;
}

/**
 * Nearest trains response data
 */
export interface NearestTrainsResponse {
  trains: TrainData[];
  totalFound: number;
}

/**
 * Next stop information
 */
export interface NextStop {
  stationId: string;
  stationName: string;
  etaMinutes: number;
  etaTimestamp: string;
}