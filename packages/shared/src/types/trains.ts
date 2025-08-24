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

/**
 * Train identification request payload
 */
export interface TrainIdentificationRequest {
  /** Subway line code (e.g., "6", "L", "N") */
  lineCode: string;
  /** Direction of travel (0 = uptown, 1 = downtown) */
  direction: 0 | 1;
  /** Stop ID where the user is located */
  stopId: string;
  /** Number of trains to find in each direction (default: 2) */
  limit?: number;
  /** Reference timestamp for before/after comparison (ISO format, defaults to now) */
  timestamp?: string;
}

/**
 * Stop information with sequence data
 */
export interface StopInfo {
  /** Stop ID from GTFS */
  stopId: string;
  /** Human-readable stop name */
  stopName: string;
  /** Stop sequence number for this route/direction */
  stopSequence?: number;
  /** Vehicle status at this stop (0=incoming, 1=stopped, 2=in_transit) */
  status?: number | string;
  /** Human-readable status name */
  statusName?: string;
}

/**
 * Stop with timing information from trip schedule
 */
export interface StopWithTiming {
  /** Stop ID from GTFS */
  stopId: string;
  /** Human-readable stop name */
  stopName: string;
  /** Stop sequence number */
  stopSequence: number;
  /** Arrival time (actual or estimated) */
  arrivalTime: string;
  /** Departure time (actual or estimated) */
  departureTime?: string;
  /** Delay in seconds (positive = late) */
  delay?: number;
  /** Whether this stop is in the past, current, or future relative to train's position */
  status: 'past' | 'current' | 'future';
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
  /** Human-readable direction name */
  directionName: string;
  /** Estimated arrival time at the stop (ISO format) */
  arrivalTime: string;
  /** Vehicle entity ID from GTFS-RT feed */
  vehicleId: string;
  /** Current delay in seconds (positive = late) */
  delay?: number;
  /** Number of stops away (negative = approaching, positive = passed) */
  stopsAway: number;
  /** Current stop information */
  currentStop?: StopInfo;
  /** Real-time stop updates (limited) */
  realtimeStops: StopWithTiming[];
  /** Complete static schedule (all stops) */
  staticStops: StopWithTiming[];
}

/**
 * Response from train identification service
 */
export interface TrainIdentificationResponse {
  /** All trains with their relative positions (sorted by stopsAway) */
  trains: TrainInfo[];
  /** Information about the user's current stop */
  userStop: StopInfo;
  /** Request parameters that were used */
  request: TrainIdentificationRequest;
  /** Timestamp when identification was performed */
  processedAt: string;
}