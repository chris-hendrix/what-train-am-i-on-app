import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import {
  GTFSRTFeedMessage,
  GTFSRTFeedEntity,
  VehiclePositionWithFeed,
  TripUpdateWithFeed,
  TrainNearStation,
  ArrivalPrediction,
  ServiceAlertWithFeed,
  FeedCacheEntry,
  CacheStats,
  GTFSRTStopTimeUpdate
} from './types/index.js';

/**
 * MTA GTFS-RT Service - Real-time Train Data Client
 * 
 * This service fetches and parses real-time train position and trip update data
 * from MTA GTFS-RT feeds using protocol buffers. It provides functions to:
 * - Get current trains near specific stations
 * - Extract real-time arrival predictions
 * - Parse vehicle positions and trip updates
 * 
 * The service includes rate limiting and error handling for reliable API calls.
 * API keys can be configured via environment variables.
 * 
 * Data Source: MTA GTFS-RT Feeds (https://api-endpoint.mta.info/)
 * Format: Protocol Buffer (GTFS-RT specification)
 * 
 * @example
 * ```typescript
 * const gtfsRTService = GTFSRTService.getInstance();
 * 
 * // Get vehicle positions for all lines
 * const vehicles = await gtfsRTService.getVehiclePositions();
 * 
 * // Get trip updates for specific line
 * const tripUpdates = await gtfsRTService.getTripUpdates(['1', '2', '3']);
 * 
 * // Get trains near a station
 * const nearbyTrains = await gtfsRTService.getTrainsNearStation('R24');
 * ```
 */
export class GTFSRTService {
  private static instance: GTFSRTService;
  
  /** MTA API key for authentication (optional as of 2025) */
  private readonly apiKey: string | undefined;
  
  /** Rate limiting: last request timestamp */
  private lastRequestTime: number = 0;
  
  /** Rate limiting: minimum milliseconds between requests */
  private readonly rateLimitMs: number = 1000; // 1 second (was 30s - reduced for URL-encoded endpoints that don't require auth)
  
  /** Cache for feed data with TTL */
  private readonly feedCache: Map<string, FeedCacheEntry> = new Map();
  
  /** Default cache TTL in milliseconds (30 seconds for real-time data) */
  private readonly defaultCacheTTL: number = 30000;

  /**
   * MTA GTFS-RT Feed URLs grouped by line
   * These feeds provide real-time vehicle positions and trip updates
   * Source: https://api.mta.info/#/subwayRealTimeFeeds (confirmed 2025)
   * Note: URLs use URL-encoded paths (nyct%2Fgtfs instead of nyct/gtfs)
   */
  private readonly feedUrls = {
    '1,2,3,4,5,6,7,S': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs',
    'A,C,E': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace',
    'B,D,F,M': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm', 
    'G': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g',
    'J,Z': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz',
    'L': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l',
    'N,Q,R,W': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw',
    'SI': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si'
  };

  /** Service alerts feed */
  private readonly alertsFeedUrl = 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts';

  private constructor() {
    this.apiKey = process.env.MTA_API_KEY;
  }

  /**
   * Get the singleton instance of GTFSRTService
   * @returns The GTFSRTService instance
   */
  public static getInstance(): GTFSRTService {
    if (!GTFSRTService.instance) {
      GTFSRTService.instance = new GTFSRTService();
    }
    return GTFSRTService.instance;
  }

  /**
   * Fetch and parse a GTFS-RT feed from MTA
   * 
   * @param url - MTA GTFS-RT feed URL
   * @returns Parsed FeedMessage or null on error
   * @private
   */
  private async fetchFeed(url: string): Promise<GTFSRTFeedMessage | null> {
    // Check cache first
    const cached = this.feedCache.get(url);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitMs) {
      const waitTime = this.rateLimitMs - timeSinceLastRequest;
      await new Promise<void>(resolve => setTimeout(resolve, waitTime));
    }

    try {
      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const error = new Error(`${response.url}: ${response.status} ${response.statusText}`);
        throw error;
      }

      const buffer = await response.arrayBuffer();
      const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
      
      this.lastRequestTime = Date.now();

      // Cache the result - cast to our interface for compatibility
      const feedData = feed as GTFSRTFeedMessage;
      this.feedCache.set(url, {
        data: feedData,
        timestamp: now,
        ttl: this.defaultCacheTTL
      });

      return feedData;
    } catch (error) {
      console.error(`Failed to fetch GTFS-RT feed from ${url}:`, error);
      return null;
    }
  }

  /**
   * Get vehicle positions for all subway lines
   * 
   * Fetches real-time vehicle position data from all MTA subway feeds.
   * Returns an array of vehicle entities with position information.
   * 
   * @returns Array of vehicle position entities
   * @throws {Error} If no feeds could be fetched
   * 
   * @example
   * ```typescript
   * const vehicles = await gtfsRTService.getVehiclePositions();
   * vehicles.forEach(vehicle => {
   *   console.log(`Train ${vehicle.vehicle.label} at stop ${vehicle.vehicle.stopId}`);
   * });
   * ```
   */
  public async getVehiclePositions(): Promise<VehiclePositionWithFeed[]> {
    const vehiclePositions: VehiclePositionWithFeed[] = [];
    
    for (const [lines, url] of Object.entries(this.feedUrls)) {
      try {
        const feed = await this.fetchFeed(url);
        if (feed && feed.entity) {
          feed.entity.forEach((entity: GTFSRTFeedEntity) => {
            if (entity.vehicle) {
              vehiclePositions.push({
                id: entity.id,
                vehicle: entity.vehicle,
                feedLines: lines,
                timestamp: entity.vehicle.timestamp
              });
            }
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch vehicle positions for lines ${lines}:`, error);
      }
    }

    if (vehiclePositions.length === 0) {
      throw new Error('No vehicle position data could be fetched from any feed');
    }

    return vehiclePositions;
  }

  /**
   * Get trip updates for specific subway lines
   * 
   * Fetches real-time trip update data (delays, schedule changes) for the
   * specified subway lines. If no lines are specified, fetches all lines.
   * 
   * @param lineCodes - Array of NYC subway line codes (e.g., ['1', '2', '3'])
   * @returns Array of trip update entities
   * 
   * @example
   * ```typescript
   * const updates = await gtfsRTService.getTripUpdates(['6']);
   * updates.forEach(update => {
   *   console.log(`Trip ${update.tripUpdate.trip.tripId} has ${update.tripUpdate.stopTimeUpdate.length} stops`);
   * });
   * ```
   */
  public async getTripUpdates(lineCodes?: string[]): Promise<TripUpdateWithFeed[]> {
    const tripUpdates: TripUpdateWithFeed[] = [];
    const feedsToFetch = lineCodes ? this.getFeedUrlsForLines(lineCodes) : Object.entries(this.feedUrls);
    
    for (const [lines, url] of feedsToFetch) {
      try {
        const feed = await this.fetchFeed(url);
        if (feed && feed.entity) {
          feed.entity.forEach((entity: GTFSRTFeedEntity) => {
            if (entity.tripUpdate) {
              tripUpdates.push({
                id: entity.id,
                tripUpdate: entity.tripUpdate,
                feedLines: lines,
                timestamp: entity.tripUpdate.timestamp
              });
            }
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch trip updates for lines ${lines}:`, error);
      }
    }

    return tripUpdates;
  }

  /**
   * Get current trains near a specific station
   * 
   * Combines vehicle positions and trip updates to find trains that are
   * currently near or approaching the specified station.
   * 
   * @param stationId - GTFS stop ID for the station
   * @param radiusStops - Number of stops in each direction to consider "near" (default: 2)
   * @returns Array of trains near the station with position and trip info
   * 
   * @example
   * ```typescript
   * const nearbyTrains = await gtfsRTService.getTrainsNearStation('R24', 3);
   * console.log(`Found ${nearbyTrains.length} trains near City Hall`);
   * ```
   */
  public async getTrainsNearStation(stationId: string, radiusStops: number = 2): Promise<TrainNearStation[]> {
    const [vehiclePositions, tripUpdates] = await Promise.all([
      this.getVehiclePositions(),
      this.getTripUpdates()
    ]);

    const nearbyTrains: TrainNearStation[] = [];
    
    // Create a map of trip IDs to trip updates for quick lookup
    const tripUpdateMap = new Map<string, TripUpdateWithFeed>();
    tripUpdates.forEach(update => {
      if (update.tripUpdate && update.tripUpdate.trip && update.tripUpdate.trip.tripId) {
        tripUpdateMap.set(update.tripUpdate.trip.tripId, update);
      }
    });

    vehiclePositions.forEach(vehicle => {
      if (vehicle.vehicle && vehicle.vehicle.trip && vehicle.vehicle.trip.tripId) {
        const tripId = vehicle.vehicle.trip.tripId;
        const tripUpdate = tripUpdateMap.get(tripId);
        
        // Check if the vehicle is near the station
        if (this.isVehicleNearStation(vehicle, stationId, tripUpdate, radiusStops)) {
          nearbyTrains.push({
            vehicle: vehicle.vehicle,
            trip: vehicle.vehicle.trip,
            tripUpdate: tripUpdate?.tripUpdate,
            feedLines: vehicle.feedLines,
            timestamp: vehicle.timestamp || Date.now()
          });
        }
      }
    });

    return nearbyTrains;
  }

  /**
   * Extract real-time arrival predictions for a specific station
   * 
   * Processes trip updates to extract arrival time predictions for trains
   * arriving at the specified station.
   * 
   * @param stationId - GTFS stop ID for the station  
   * @param lineCodes - Optional array of line codes to filter by
   * @returns Array of arrival predictions with train and timing info
   * 
   * @example
   * ```typescript
   * const arrivals = await gtfsRTService.getArrivalPredictions('R24');
   * arrivals.forEach(arrival => {
   *   console.log(`${arrival.routeId} train arriving in ${arrival.minutesUntilArrival} minutes`);
   * });
   * ```
   */
  public async getArrivalPredictions(stationId: string, lineCodes?: string[]): Promise<ArrivalPrediction[]> {
    const tripUpdates = await this.getTripUpdates(lineCodes);
    const predictions: ArrivalPrediction[] = [];
    
    tripUpdates.forEach(update => {
      if (update.tripUpdate && update.tripUpdate.stopTimeUpdate) {
        update.tripUpdate.stopTimeUpdate.forEach((stopTime: GTFSRTStopTimeUpdate) => {
          if (stopTime.stopId === stationId || stopTime.stopId?.startsWith(stationId)) {
            const arrival = stopTime.arrival || stopTime.departure;
            if (arrival && arrival.time) {
              const arrivalTime = new Date(arrival.time * 1000);
              const minutesUntilArrival = Math.round((arrivalTime.getTime() - Date.now()) / 60000);
              
              predictions.push({
                tripId: update.tripUpdate.trip.tripId,
                routeId: update.tripUpdate.trip.routeId,
                direction: update.tripUpdate.trip.directionId,
                stopId: stopTime.stopId,
                arrivalTime,
                minutesUntilArrival,
                delay: arrival.delay || 0,
                feedLines: update.feedLines
              });
            }
          }
        });
      }
    });

    return predictions.sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime());
  }

  /**
   * Get service alerts for subway system
   * 
   * Fetches current service alerts and disruptions from the MTA alerts feed.
   * 
   * @param lineCodes - Optional array of line codes to filter alerts
   * @returns Array of service alert entities
   */
  public async getServiceAlerts(lineCodes?: string[]): Promise<ServiceAlertWithFeed[]> {
    try {
      const feed = await this.fetchFeed(this.alertsFeedUrl);
      if (!feed || !feed.entity) {
        return [];
      }

      const alerts: ServiceAlertWithFeed[] = feed.entity
        .filter((entity: GTFSRTFeedEntity) => entity.alert)
        .map((entity: GTFSRTFeedEntity) => ({
          id: entity.id,
          alert: entity.alert!
        }));

      if (lineCodes) {
        return alerts.filter((alertWithFeed: ServiceAlertWithFeed) => {
          return alertWithFeed.alert.informedEntity?.some((entity) => 
            entity.routeId && lineCodes.includes(entity.routeId)
          );
        });
      }

      return alerts;
    } catch (error) {
      console.error('Failed to fetch service alerts:', error);
      return [];
    }
  }

  /**
   * Get feed URLs for specific line codes
   * @param lineCodes - Array of line codes
   * @returns Array of [lines, url] pairs
   * @private
   */
  private getFeedUrlsForLines(lineCodes: string[]): [string, string][] {
    const feedsToFetch: [string, string][] = [];
    
    for (const [lines, url] of Object.entries(this.feedUrls)) {
      const feedLines = lines.split(',');
      if (lineCodes.some(code => feedLines.includes(code))) {
        feedsToFetch.push([lines, url]);
      }
    }
    
    return feedsToFetch;
  }

  /**
   * Check if a vehicle is near a specific station
   * @param vehicle - Vehicle position entity
   * @param stationId - Target station ID
   * @param tripUpdate - Associated trip update (optional)
   * @param radiusStops - Number of stops to consider "near"
   * @returns true if vehicle is considered near the station
   * @private
   */
  private isVehicleNearStation(
    vehicle: VehiclePositionWithFeed, 
    stationId: string, 
    tripUpdate: TripUpdateWithFeed | undefined, 
    radiusStops: number
  ): boolean {
    // Check if vehicle is currently at the station
    if (vehicle.vehicle.stopId === stationId || vehicle.vehicle.stopId?.startsWith(stationId)) {
      return true;
    }

    // Check trip updates for upcoming stops
    if (tripUpdate && tripUpdate.tripUpdate.stopTimeUpdate) {
      const stopUpdates = tripUpdate.tripUpdate.stopTimeUpdate;
      const currentStopIndex = stopUpdates.findIndex((stop: GTFSRTStopTimeUpdate) => 
        stop.stopId === vehicle.vehicle.stopId || stop.stopId?.startsWith(vehicle.vehicle.stopId || '')
      );
      
      if (currentStopIndex >= 0) {
        // Check if target station is within radius of current position
        for (let i = Math.max(0, currentStopIndex - radiusStops); 
             i <= Math.min(stopUpdates.length - 1, currentStopIndex + radiusStops); 
             i++) {
          if (stopUpdates[i].stopId === stationId || stopUpdates[i].stopId?.startsWith(stationId)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Clear the feed cache
   * Useful for testing or forcing fresh data fetch
   */
  public clearCache(): void {
    this.feedCache.clear();
  }

  /**
   * Get cache statistics
   * @returns Object with cache stats
   */
  public getCacheStats(): CacheStats {
    return {
      size: this.feedCache.size,
      entries: Array.from(this.feedCache.keys())
    };
  }
}