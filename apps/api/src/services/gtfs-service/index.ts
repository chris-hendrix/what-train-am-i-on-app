import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { 
  GTFSStop, 
  GTFSRoute, 
  GTFSStopTime, 
  GTFSTrip,
  StationWithDistance,
  RouteInfo,
  StopSequence,
  GTFSStats
} from './types/index.js';

/**
 * GTFSService - MTA Static GTFS Data Parser and Query Service
 * 
 * This service parses and provides access to MTA subway static GTFS data including:
 * - Station locations and information
 * - Route definitions and line codes
 * - Trip schedules and stop sequences
 * - Stop time data for calculating train directions
 * 
 * Data is loaded from local CSV files and stored in memory using Maps for fast lookups.
 * The service uses a singleton pattern to ensure efficient memory usage.
 * 
 * Data Source: MTA GTFS Static Feed (https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip)
 * Storage: ~60MB in-memory (1,498 stops, 30 routes, 20K trips, 560K stop times)
 * 
 * @example
 * ```typescript
 * const gtfsService = GTFSService.getInstance();
 * await gtfsService.loadData();
 * 
 * // Find nearest stations to Times Square
 * const stations = gtfsService.findNearestStations(40.7589, -73.9851, 5);
 * 
 * // Get route information for the 6 train
 * const route = gtfsService.getRouteByLineCode('6');
 * ```
 */
export class GTFSService {
  private static instance: GTFSService;
  private readonly dataPath: string;
  
  /** Map of stop_id -> GTFSStop for fast station lookups */
  private readonly stops: Map<string, GTFSStop> = new Map();
  
  /** Map of route_id -> GTFSRoute for fast route lookups */
  private readonly routes: Map<string, GTFSRoute> = new Map();
  
  /** Map of trip_id -> GTFSStopTime[] for stop sequences */
  private readonly stopTimes: Map<string, GTFSStopTime[]> = new Map();
  
  /** Map of trip_id -> GTFSTrip for trip information */
  private readonly trips: Map<string, GTFSTrip> = new Map();
  
  /** Flag to track if GTFS data has been loaded */
  private isLoaded = false;

  private constructor() {
    // Get the directory of the current module
    const currentDir = path.dirname(new URL(import.meta.url).pathname);
    this.dataPath = path.join(currentDir, 'data');
  }

  /**
   * Get the singleton instance of GTFSService
   * @returns The GTFSService instance
   */
  public static getInstance(): GTFSService {
    if (!GTFSService.instance) {
      GTFSService.instance = new GTFSService();
    }
    return GTFSService.instance;
  }

  /**
   * Load GTFS data from CSV files into memory
   * 
   * Parses stops.txt, routes.txt, trips.txt, and stop_times.txt files
   * and stores the data in Maps for fast lookup. This method is idempotent
   * and will only load data once.
   * 
   * @throws {Error} If any CSV files are missing or malformed
   * @example
   * ```typescript
   * const gtfsService = GTFSService.getInstance();
   * await gtfsService.loadData();
   * ```
   */
  public async loadData(): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    try {
      await Promise.all([
        this.loadStops(),
        this.loadRoutes(),
        this.loadTrips(),
        this.loadStopTimes()
      ]);
      
      this.isLoaded = true;
      console.log(`GTFS data loaded: ${this.stops.size} stops, ${this.routes.size} routes, ${this.trips.size} trips`);
    } catch (error) {
      throw new Error(`Failed to load GTFS data: ${error}`);
    }
  }

  private async loadStops(): Promise<void> {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.dataPath, 'stops.txt');
      
      if (!fs.existsSync(filePath)) {
        reject(new Error(`stops.txt not found at ${filePath}`));
        return;
      }

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const stop: GTFSStop = {
            stop_id: row.stop_id,
            stop_code: row.stop_code || undefined,
            stop_name: row.stop_name,
            stop_desc: row.stop_desc || undefined,
            stop_lat: parseFloat(row.stop_lat),
            stop_lon: parseFloat(row.stop_lon),
            zone_id: row.zone_id || undefined,
            stop_url: row.stop_url || undefined,
            location_type: row.location_type ? parseInt(row.location_type) : undefined,
            parent_station: row.parent_station || undefined,
            stop_timezone: row.stop_timezone || undefined,
            wheelchair_boarding: row.wheelchair_boarding ? parseInt(row.wheelchair_boarding) : undefined
          };
          
          this.stops.set(stop.stop_id, stop);
        })
        .on('end', resolve)
        .on('error', reject);
    });
  }

  private async loadRoutes(): Promise<void> {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.dataPath, 'routes.txt');
      
      if (!fs.existsSync(filePath)) {
        reject(new Error(`routes.txt not found at ${filePath}`));
        return;
      }

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const route: GTFSRoute = {
            route_id: row.route_id,
            agency_id: row.agency_id || undefined,
            route_short_name: row.route_short_name,
            route_long_name: row.route_long_name,
            route_desc: row.route_desc || undefined,
            route_type: parseInt(row.route_type),
            route_url: row.route_url || undefined,
            route_color: row.route_color || undefined,
            route_text_color: row.route_text_color || undefined
          };
          
          this.routes.set(route.route_id, route);
        })
        .on('end', resolve)
        .on('error', reject);
    });
  }

  private async loadTrips(): Promise<void> {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.dataPath, 'trips.txt');
      
      if (!fs.existsSync(filePath)) {
        reject(new Error(`trips.txt not found at ${filePath}`));
        return;
      }

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const trip: GTFSTrip = {
            route_id: row.route_id,
            service_id: row.service_id,
            trip_id: row.trip_id,
            trip_headsign: row.trip_headsign || undefined,
            trip_short_name: row.trip_short_name || undefined,
            direction_id: row.direction_id ? parseInt(row.direction_id) : undefined,
            block_id: row.block_id || undefined,
            shape_id: row.shape_id || undefined,
            wheelchair_accessible: row.wheelchair_accessible ? parseInt(row.wheelchair_accessible) : undefined,
            bikes_allowed: row.bikes_allowed ? parseInt(row.bikes_allowed) : undefined
          };
          
          this.trips.set(trip.trip_id, trip);
        })
        .on('end', resolve)
        .on('error', reject);
    });
  }

  private async loadStopTimes(): Promise<void> {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.dataPath, 'stop_times.txt');
      
      if (!fs.existsSync(filePath)) {
        reject(new Error(`stop_times.txt not found at ${filePath}`));
        return;
      }

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const stopTime: GTFSStopTime = {
            trip_id: row.trip_id,
            arrival_time: row.arrival_time,
            departure_time: row.departure_time,
            stop_id: row.stop_id,
            stop_sequence: parseInt(row.stop_sequence),
            stop_headsign: row.stop_headsign || undefined,
            pickup_type: row.pickup_type ? parseInt(row.pickup_type) : undefined,
            drop_off_type: row.drop_off_type ? parseInt(row.drop_off_type) : undefined,
            shape_dist_traveled: row.shape_dist_traveled ? parseFloat(row.shape_dist_traveled) : undefined
          };

          const tripStopTimes = this.stopTimes.get(stopTime.trip_id) || [];
          tripStopTimes.push(stopTime);
          this.stopTimes.set(stopTime.trip_id, tripStopTimes);
        })
        .on('end', () => {
          // Sort stop times by sequence for each trip
          this.stopTimes.forEach((stopTimes, tripId) => {
            stopTimes.sort((a, b) => a.stop_sequence - b.stop_sequence);
            this.stopTimes.set(tripId, stopTimes);
          });
          resolve();
        })
        .on('error', reject);
    });
  }

  /**
   * Find the nearest subway stations to a given latitude/longitude coordinate
   * 
   * Uses the Haversine formula to calculate distances from the given coordinate
   * to all subway stations, then returns the closest stations sorted by distance.
   * Filters out non-station stops (entrances, platforms, etc.).
   * 
   * @param lat - Latitude coordinate (WGS84)
   * @param lon - Longitude coordinate (WGS84)
   * @param limit - Maximum number of stations to return (default: 5)
   * @returns Array of stations with distance information, sorted by proximity
   * @throws {Error} If GTFS data has not been loaded
   * 
   * @example
   * ```typescript
   * // Find 3 nearest stations to Times Square
   * const stations = gtfsService.findNearestStations(40.7589, -73.9851, 3);
   * console.log(stations[0].stop_name); // "Times Sq-42 St"
   * console.log(stations[0].distance); // Distance in meters
   * ```
   */
  public findNearestStations(lat: number, lon: number, limit: number = 5): StationWithDistance[] {
    if (!this.isLoaded) {
      throw new Error('GTFS data not loaded. Call loadData() first.');
    }

    const stationsWithDistance: StationWithDistance[] = [];

    this.stops.forEach((stop) => {
      // Filter to only include actual stations (location_type 1) or platforms (location_type 0/undefined)
      if (stop.location_type && stop.location_type > 1) {
        return;
      }

      const distance = this.calculateDistance(lat, lon, stop.stop_lat, stop.stop_lon);
      stationsWithDistance.push({
        ...stop,
        distance
      });
    });

    return stationsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  }

  /**
   * Get route information and associated stops for a given NYC subway line code
   * 
   * Looks up route information by the line code (e.g., "6", "N", "Q") and returns
   * the route details along with all stops served by that line.
   * 
   * @param lineCode - NYC subway line code (1,2,3,4,5,6,7,N,Q,R,W,B,D,F,M,A,C,E,G,J,Z,L)
   * @returns RouteInfo object with route and stops, or null if line code not found
   * @throws {Error} If GTFS data has not been loaded
   * 
   * @example
   * ```typescript
   * const routeInfo = gtfsService.getRouteByLineCode('6');
   * console.log(routeInfo.route.route_long_name); // "Lexington Av Express"
   * console.log(routeInfo.stops.length); // Number of stops on the 6 line
   * ```
   */
  public getRouteByLineCode(lineCode: string): RouteInfo | null {
    if (!this.isLoaded) {
      throw new Error('GTFS data not loaded. Call loadData() first.');
    }

    const route = Array.from(this.routes.values())
      .find(r => r.route_short_name === lineCode);

    if (!route) {
      return null;
    }

    // Get stops for this route
    const routeStops: GTFSStop[] = [];
    const routeTrips = Array.from(this.trips.values())
      .filter(trip => trip.route_id === route.route_id);

    const stopIds = new Set<string>();
    routeTrips.forEach(trip => {
      const tripStopTimes = this.stopTimes.get(trip.trip_id) || [];
      tripStopTimes.forEach(stopTime => {
        stopIds.add(stopTime.stop_id);
      });
    });

    stopIds.forEach(stopId => {
      const stop = this.stops.get(stopId);
      if (stop) {
        routeStops.push(stop);
      }
    });

    return {
      route,
      stops: routeStops
    };
  }

  /**
   * Get stop sequences for a route in both directions
   * 
   * Returns the ordered sequence of stops for each direction of a route,
   * which is essential for determining train direction and calculating
   * which stops come next in the journey.
   * 
   * @param routeId - GTFS route ID (e.g., "6", "N", "Q")
   * @returns Array of StopSequence objects, one for each direction
   * @throws {Error} If GTFS data has not been loaded
   * 
   * @example
   * ```typescript
   * const sequences = gtfsService.getStopSequencesForRoute('6');
   * // sequences[0] = northbound stops in order
   * // sequences[1] = southbound stops in order
   * console.log(sequences[0].stops.map(s => s.stop_name));
   * ```
   */
  public getStopSequencesForRoute(routeId: string): StopSequence[] {
    if (!this.isLoaded) {
      throw new Error('GTFS data not loaded. Call loadData() first.');
    }

    const sequences = new Map<string, StopSequence>();
    const routeTrips = Array.from(this.trips.values())
      .filter(trip => trip.route_id === routeId);

    routeTrips.forEach(trip => {
      const directionId = trip.direction_id || 0;
      const sequenceKey = `${routeId}_${directionId}`;
      
      if (!sequences.has(sequenceKey)) {
        sequences.set(sequenceKey, {
          route_id: routeId,
          direction_id: directionId,
          stops: []
        });
      }

      const sequence = sequences.get(sequenceKey)!;
      const tripStopTimes = this.stopTimes.get(trip.trip_id) || [];
      
      tripStopTimes.forEach(stopTime => {
        const stop = this.stops.get(stopTime.stop_id);
        if (stop && !sequence.stops.some(s => s.stop_id === stop.stop_id)) {
          sequence.stops.push({
            stop_id: stop.stop_id,
            stop_sequence: stopTime.stop_sequence,
            stop_name: stop.stop_name
          });
        }
      });
    });

    sequences.forEach(sequence => {
      sequence.stops.sort((a, b) => a.stop_sequence - b.stop_sequence);
    });

    return Array.from(sequences.values());
  }

  /**
   * Calculate the distance between two coordinates using the Haversine formula
   * 
   * @param lat1 - Latitude of first point (degrees)
   * @param lon1 - Longitude of first point (degrees)  
   * @param lat2 - Latitude of second point (degrees)
   * @param lon2 - Longitude of second point (degrees)
   * @returns Distance in meters
   * @private
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Get all available subway routes
   * 
   * @returns Array of all GTFS route objects
   * @throws {Error} If GTFS data has not been loaded
   * 
   * @example
   * ```typescript
   * const routes = gtfsService.getAllRoutes();
   * console.log(routes.map(r => r.route_short_name)); // ["1", "2", "3", "4", "5", "6", ...]
   * ```
   */
  public getAllRoutes(): GTFSRoute[] {
    if (!this.isLoaded) {
      throw new Error('GTFS data not loaded. Call loadData() first.');
    }
    
    return Array.from(this.routes.values());
  }

  /**
   * Get statistics about the loaded GTFS data
   * 
   * @returns Object containing counts of stops, routes, trips, and stop times
   * 
   * @example
   * ```typescript
   * const stats = gtfsService.getStats();
   * console.log(`Loaded ${stats.stops} stops and ${stats.routes} routes`);
   * ```
   */
  public getStats(): GTFSStats {
    return {
      stops: this.stops.size,
      routes: this.routes.size,
      trips: this.trips.size,
      stopTimes: this.stopTimes.size
    };
  }
}