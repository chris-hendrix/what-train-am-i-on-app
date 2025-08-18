import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import {
  GTFSRTFeedMessage,
  GTFSRTFeedEntity,
  VehiclePositionWithFeed,
  TripUpdateWithFeed,
  FeedCacheEntry,
  CacheStats
} from './types/index.js';
import { GTFSRTError, GTFSRTTimeoutError, GTFSRTUnavailableError } from './errors.js';

/**
 * MTA GTFS-RT Service - Real-time Train Data Client
 * 
 * Simplified service focused on core train identification needs:
 * - Fetch vehicle positions for a specific subway line
 * - Fetch trip updates for schedule/timing data
 * 
 * Optimized for train identification algorithm with:
 * - Direct line-to-URL mapping for O(1) lookups
 * - Caching with 30-second TTL for real-time data
 * - Single-line focused API for minimal data transfer
 * 
 * @example
 * ```typescript
 * const gtfsRTService = GTFSRTService.getInstance();
 * const vehicles = await gtfsRTService.getVehiclePositions('6');
 * const tripUpdates = await gtfsRTService.getTripUpdates('6');
 * ```
 */
export class GTFSRTService {
  private static instance: GTFSRTService;
  
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

  /** Direct mapping from individual line codes to their feed URLs for O(1) lookup */
  private readonly lineToUrlMap: Map<string, string> = new Map();


  private constructor() {
    this.buildLineToUrlMap();
  }

  /**
   * Build the line-to-URL mapping from the grouped feedUrls
   * @private
   */
  private buildLineToUrlMap(): void {
    Object.entries(this.feedUrls).forEach(([lines, url]) => {
      const lineList = lines.split(',');
      lineList.forEach(line => {
        this.lineToUrlMap.set(line.trim(), url);
      });
    });
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
      const response = await fetch(url);
      
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
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new GTFSRTTimeoutError(`GTFS-RT request timed out for ${url}`);
        }
        throw new GTFSRTUnavailableError(`Failed to fetch GTFS-RT data from ${url}: ${error.message}`);
      }
      throw new GTFSRTError(`Unknown error fetching GTFS-RT data from ${url}`);
    }
  }

  /**
   * Get vehicle positions for a specific subway line
   * 
   * Fetches real-time vehicle position data for the specified subway line.
   * Returns an array of vehicle entities with position information.
   * 
   * @param lineCode - NYC subway line code (e.g., '6', 'N', 'Q')
   * @param direction - Optional direction filter (0 = uptown, 1 = downtown)
   * @returns Array of vehicle position entities for the specified line
   * @throws {Error} If line code is invalid or no data could be fetched
   * 
   * @example
   * ```typescript
   * const vehicles = await gtfsRTService.getVehiclePositions('6', 1);
   * vehicles.forEach(vehicle => {
   *   console.log(`Train ${vehicle.vehicle.label} at stop ${vehicle.vehicle.stopId}`);
   * });
   * ```
   */
  public async getVehiclePositions(lineCode: string, direction?: number): Promise<VehiclePositionWithFeed[]> {
    const vehiclePositions: VehiclePositionWithFeed[] = [];
    
    // Get the feed URL for this specific line
    const url = this.lineToUrlMap.get(lineCode);
    if (!url) {
      throw new Error(`Unknown line code: ${lineCode}`);
    }

    try {
      const feed = await this.fetchFeed(url);
      if (feed && feed.entity) {
        feed.entity.forEach((entity: GTFSRTFeedEntity) => {
          if (entity.vehicle && entity.vehicle.trip?.routeId === lineCode) {
            // If direction filter is specified, check it
            if (direction !== undefined) {
              const vehicleDirection = this.getDirectionFromTripId(entity.vehicle.trip?.tripId);
              if (vehicleDirection !== direction) return;
            }
            
            vehiclePositions.push({
              id: entity.id,
              vehicle: entity.vehicle,
              feedLines: lineCode,
              timestamp: entity.vehicle.timestamp
            });
          }
        });
      }
    } catch (error) {
      throw new Error(`Failed to fetch vehicle positions for line ${lineCode}: ${error}`);
    }

    if (vehiclePositions.length === 0) {
      throw new Error(`No vehicle position data found for line ${lineCode}`);
    }

    return vehiclePositions;
  }

  /**
   * Extract direction from trip ID
   */
  private getDirectionFromTripId(tripId: string | undefined): number {
    if (!tripId) return -1;
    
    if (tripId.includes('..N') || tripId.includes('.N')) return 0;
    if (tripId.includes('..S') || tripId.includes('.S')) return 1;
    
    return -1;
  }

  /**
   * Get trip updates for a specific subway line
   * 
   * Fetches real-time trip update data (delays, schedule changes) for the
   * specified subway line.
   * 
   * @param lineCode - NYC subway line code (e.g., '6', 'N', 'Q')
   * @returns Array of trip update entities for the specified line
   * 
   * @example
   * ```typescript
   * const updates = await gtfsRTService.getTripUpdates('6');
   * updates.forEach(update => {
   *   console.log(`Trip ${update.tripUpdate.trip.tripId} has ${update.tripUpdate.stopTimeUpdate.length} stops`);
   * });
   * ```
   */
  public async getTripUpdates(lineCode: string): Promise<TripUpdateWithFeed[]> {
    const tripUpdates: TripUpdateWithFeed[] = [];
    
    // Get the feed URL for this specific line
    const url = this.lineToUrlMap.get(lineCode);
    if (!url) {
      throw new Error(`Unknown line code: ${lineCode}`);
    }

    try {
      const feed = await this.fetchFeed(url);
      if (feed && feed.entity) {
        feed.entity.forEach((entity: GTFSRTFeedEntity) => {
          if (entity.tripUpdate) {
            tripUpdates.push({
              id: entity.id,
              tripUpdate: entity.tripUpdate,
              feedLines: lineCode, // Just the requested line
              timestamp: entity.tripUpdate.timestamp
            });
          }
        });
      }
    } catch (error) {
      throw new Error(`Failed to fetch trip updates for line ${lineCode}: ${error}`);
    }

    return tripUpdates;
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