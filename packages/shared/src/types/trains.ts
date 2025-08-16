/**
 * Nearest trains request payload
 */
export interface NearestTrainsRequest {
  latitude: number;
  longitude: number;
  lineCode: string;
  /** Optional direction filter (0 or 1). If not provided, searches all directions */
  direction?: number;
  /** Optional headsign filter. If provided, overrides direction */
  headsign?: string;
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