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
  
  /** Map of lineCode -> headsign mappings for fast direction lookups */
  private readonly lineHeadsigns: Map<string, Record<string, number>> = new Map();
  
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
      
      // Build headsign mappings after all data is loaded
      this.buildHeadsignMappings();
      
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
            stopId: row.stop_id,
            stopCode: row.stop_code || undefined,
            stopName: row.stop_name,
            stopDesc: row.stop_desc || undefined,
            stopLat: parseFloat(row.stop_lat),
            stopLon: parseFloat(row.stop_lon),
            zoneId: row.zone_id || undefined,
            stopUrl: row.stop_url || undefined,
            locationType: row.location_type ? parseInt(row.location_type) : undefined,
            parentStation: row.parent_station || undefined,
            stopTimezone: row.stop_timezone || undefined,
            wheelchairBoarding: row.wheelchair_boarding ? parseInt(row.wheelchair_boarding) : undefined
          };
          
          this.stops.set(stop.stopId, stop);
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
            routeId: row.route_id,
            agencyId: row.agency_id || undefined,
            routeShortName: row.route_short_name,
            routeLongName: row.route_long_name,
            routeDesc: row.route_desc || undefined,
            routeType: parseInt(row.route_type),
            routeUrl: row.route_url || undefined,
            routeColor: row.route_color || undefined,
            routeTextColor: row.route_text_color || undefined
          };
          
          this.routes.set(route.routeId, route);
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
            routeId: row.route_id,
            serviceId: row.service_id,
            tripId: row.trip_id,
            tripHeadsign: row.trip_headsign || undefined,
            tripShortName: row.trip_short_name || undefined,
            directionId: row.direction_id ? parseInt(row.direction_id) : undefined,
            blockId: row.block_id || undefined,
            shapeId: row.shape_id || undefined,
            wheelchairAccessible: row.wheelchair_accessible ? parseInt(row.wheelchair_accessible) : undefined,
            bikesAllowed: row.bikes_allowed ? parseInt(row.bikes_allowed) : undefined
          };
          
          this.trips.set(trip.tripId, trip);
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
            tripId: row.trip_id,
            arrivalTime: row.arrival_time,
            departureTime: row.departure_time,
            stopId: row.stop_id,
            stopSequence: parseInt(row.stop_sequence),
            stopHeadsign: row.stop_headsign || undefined,
            pickupType: row.pickup_type ? parseInt(row.pickup_type) : undefined,
            dropOffType: row.drop_off_type ? parseInt(row.drop_off_type) : undefined,
            shapeDistTraveled: row.shape_dist_traveled ? parseFloat(row.shape_dist_traveled) : undefined
          };

          const tripStopTimes = this.stopTimes.get(stopTime.tripId) || [];
          tripStopTimes.push(stopTime);
          this.stopTimes.set(stopTime.tripId, tripStopTimes);
        })
        .on('end', () => {
          // Sort stop times by sequence for each trip
          this.stopTimes.forEach((stopTimes, tripId) => {
            stopTimes.sort((a, b) => a.stopSequence - b.stopSequence);
            this.stopTimes.set(tripId, stopTimes);
          });
          resolve();
        })
        .on('error', reject);
    });
  }

  /**
   * Build headsign mappings for all routes
   * Creates a fast lookup map of lineCode -> headsign:direction mapping
   * @private
   * 
   * @example
   * After processing, lineHeadsigns will contain:
   * ```
   * "A" -> {
   *   "Far Rockaway-Mott Av": 1,
   *   "Euclid Av": 0,
   *   "Ozone Park-Lefferts Blvd": 1,
   *   "Inwood-207 St": 0
   * }
   * ```
   */
  private buildHeadsignMappings(): void {
    const routeHeadsigns = new Map<string, Record<string, number>>();

    // Build headsign -> direction mapping for each route
    this.trips.forEach(trip => {
      const route = this.routes.get(trip.routeId);
      if (!route || !trip.tripHeadsign) return;

      const lineCode = route.routeShortName;
      const directionId = trip.directionId ?? 0;

      if (!routeHeadsigns.has(lineCode)) {
        routeHeadsigns.set(lineCode, {});
      }

      const headsignMap = routeHeadsigns.get(lineCode)!;
      headsignMap[trip.tripHeadsign] = directionId;
    });

    // Store the mappings
    routeHeadsigns.forEach((headsigns, lineCode) => {
      this.lineHeadsigns.set(lineCode, headsigns);
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
      // Filter to only include actual stations (locationType 1) or platforms (locationType 0/undefined)
      if (stop.locationType && stop.locationType > 1) {
        return;
      }

      const distance = this.calculateDistance(lat, lon, stop.stopLat, stop.stopLon);
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
      .find(r => r.routeShortName === lineCode);

    if (!route) {
      return null;
    }

    // Get stops for this route
    const routeStops: GTFSStop[] = [];
    const routeTrips = Array.from(this.trips.values())
      .filter(trip => trip.routeId === route.routeId);

    const stopIds = new Set<string>();
    routeTrips.forEach(trip => {
      const tripStopTimes = this.stopTimes.get(trip.tripId) || [];
      tripStopTimes.forEach(stopTime => {
        stopIds.add(stopTime.stopId);
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
      .filter(trip => trip.routeId === routeId);

    routeTrips.forEach(trip => {
      const directionId = trip.directionId || 0;
      const sequenceKey = `${routeId}_${directionId}`;
      
      if (!sequences.has(sequenceKey)) {
        sequences.set(sequenceKey, {
          routeId: routeId,
          directionId: directionId,
          stops: []
        });
      }

      const sequence = sequences.get(sequenceKey)!;
      const tripStopTimes = this.stopTimes.get(trip.tripId) || [];
      
      tripStopTimes.forEach(stopTime => {
        const stop = this.stops.get(stopTime.stopId);
        if (stop && !sequence.stops.some(s => s.stopId === stop.stopId)) {
          sequence.stops.push({
            stopId: stop.stopId,
            stopSequence: stopTime.stopSequence,
            stopName: stop.stopName
          });
        }
      });
    });

    sequences.forEach(sequence => {
      sequence.stops.sort((a, b) => a.stopSequence - b.stopSequence);
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
   * Get a stop by its ID
   * 
   * @param stopId - GTFS stop ID
   * @returns GTFSStop object or null if not found
   * @throws {Error} If GTFS data has not been loaded
   * 
   * @example
   * ```typescript
   * const stop = gtfsService.getStop('101');
   * if (stop) {
   *   console.log(stop.stop_name); // "Van Cortlandt Park-242 St"
   * }
   * ```
   */
  public getStop(stopId: string): GTFSStop | null {
    if (!this.isLoaded) {
      throw new Error('GTFS data not loaded. Call loadData() first.');
    }
    
    return this.stops.get(stopId) || null;
  }

  /**
   * Get headsign mappings for a subway line
   * 
   * @param lineCode - NYC subway line code (1,2,3,4,5,6,7,N,Q,R,W,B,D,F,M,A,C,E,G,J,Z,L)
   * @returns Object mapping headsign strings to direction IDs
   * @throws {Error} If GTFS data has not been loaded
   * 
   * @example
   * ```typescript
   * const headsigns = gtfsService.getHeadsignsForLine('A');
   * // Returns: {
   * //   "Euclid Av": 0,
   * //   "Inwood-207 St": 0,
   * //   "Far Rockaway-Mott Av": 1,
   * //   "Ozone Park-Lefferts Blvd": 1
   * // }
   * ```
   */
  public getHeadsignsForLine(lineCode: string): Record<string, number> {
    if (!this.isLoaded) {
      throw new Error('GTFS data not loaded. Call loadData() first.');
    }

    return this.lineHeadsigns.get(lineCode) || {};
  }

  /**
   * Get trip information by trip ID
   * 
   * @param tripId - GTFS trip ID
   * @returns Trip object or null if not found
   * @throws {Error} If GTFS data has not been loaded
   */
  public getTrip(tripId: string): GTFSTrip | null {
    if (!this.isLoaded) {
      throw new Error('GTFS data not loaded. Call loadData() first.');
    }

    return this.trips.get(tripId) || null;
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