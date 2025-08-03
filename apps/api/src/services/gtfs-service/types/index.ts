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
  stop_id: string;
  stop_code?: string;
  stop_name: string;
  stop_desc?: string;
  stop_lat: number;
  stop_lon: number;
  zone_id?: string;
  stop_url?: string;
  location_type?: number;
  parent_station?: string;
  stop_timezone?: string;
  wheelchair_boarding?: number;
}

/**
 * GTFS Route information
 */
export interface GTFSRoute {
  route_id: string;
  agency_id?: string;
  route_short_name: string;
  route_long_name: string;
  route_desc?: string;
  route_type: number;
  route_url?: string;
  route_color?: string;
  route_text_color?: string;
}

/**
 * GTFS Stop Time information
 */
export interface GTFSStopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: number;
  stop_headsign?: string;
  pickup_type?: number;
  drop_off_type?: number;
  shape_dist_traveled?: number;
}

/**
 * GTFS Trip information
 */
export interface GTFSTrip {
  route_id: string;
  service_id: string;
  trip_id: string;
  trip_headsign?: string;
  trip_short_name?: string;
  direction_id?: number;
  block_id?: string;
  shape_id?: string;
  wheelchair_accessible?: number;
  bikes_allowed?: number;
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
  route_id: string;
  direction_id: number;
  stops: Array<{
    stop_id: string;
    stop_sequence: number;
    stop_name: string;
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