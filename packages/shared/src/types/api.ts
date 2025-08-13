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
  line_code: string;
  direction: number;
}

/**
 * Individual train data in the response
 */
export interface TrainData {
  train_id: string;
  line: {
    code: string;
    name: string;
    color: string;
  };
  direction: string;
  current_station: string;
  next_stops: NextStop[];
  service_type: string;
  distance_meters: number;
  last_updated: string;
}

/**
 * Nearest trains response data
 */
export interface NearestTrainsResponse {
  trains: TrainData[];
  total_found: number;
}

/**
 * Next stop information
 */
export interface NextStop {
  station_id: string;
  station_name: string;
  eta_minutes: number;
  eta_timestamp: string;
}