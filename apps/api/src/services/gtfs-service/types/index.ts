/**
 * GTFS Service Types
 * 
 * Type definitions for MTA GTFS static data structures
 * Used exclusively within the GTFS service for data parsing and querying
 */

/**
 * GTFS Stop (station) information
 */
export interface GTFSStop {
  stopId: string;
  stopCode?: string;
  stopName: string;
  stopDesc?: string;
  stopLat: number;
  stopLon: number;
  zoneId?: string;
  stopUrl?: string;
  locationType?: number;
  parentStation?: string;
  stopTimezone?: string;
  wheelchairBoarding?: number;
}

/**
 * GTFS Route information
 */
export interface GTFSRoute {
  routeId: string;
  agencyId?: string;
  routeShortName: string;
  routeLongName: string;
  routeDesc?: string;
  routeType: number;
  routeUrl?: string;
  routeColor?: string;
  routeTextColor?: string;
}

/**
 * GTFS Stop Time information
 */
export interface GTFSStopTime {
  tripId: string;
  arrivalTime: string;
  departureTime: string;
  stopId: string;
  stopSequence: number;
  stopHeadsign?: string;
  pickupType?: number;
  dropOffType?: number;
  shapeDistTraveled?: number;
}

/**
 * GTFS Trip information
 */
export interface GTFSTrip {
  routeId: string;
  serviceId: string;
  tripId: string;
  tripHeadsign?: string;
  tripShortName?: string;
  directionId?: number;
  blockId?: string;
  shapeId?: string;
  wheelchairAccessible?: number;
  bikesAllowed?: number;
}

/**
 * Processed station data with distance information
 */
export interface StationWithDistance extends GTFSStop {
  distance: number;
}

/**
 * Route lookup result
 */
export interface RouteInfo {
  route: GTFSRoute;
  stops: GTFSStop[];
}

/**
 * Stop sequence information for a route
 */
export interface StopSequence {
  routeId: string;
  directionId: number;
  stops: Array<{
    stopId: string;
    stopSequence: number;
    stopName: string;
  }>;
}

/**
 * Service statistics
 */
export interface GTFSStats {
  stops: number;
  routes: number;
  trips: number;
  stopTimes: number;
}