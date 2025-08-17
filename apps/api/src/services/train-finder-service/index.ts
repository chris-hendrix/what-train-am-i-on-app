import { GTFSRTService } from '../gtfs-rt-service/index.js';
import { GTFSService } from '../gtfs-service/index.js';
import { TrainBuilderService } from '../train-builder-service/index.js';
import { VehiclePositionWithFeed } from '../gtfs-rt-service/types/index.js';
import { 
  TrainFinderRequest,
  TrainCandidate
} from './types/index.js';

/**
 * Train Finder Service
 * 
 * Core algorithm to identify which specific train a user is currently riding
 * based on their location and the selected subway line.
 * 
 * Algorithm Strategy:
 * 1. Get all active trains on the specified line from GTFS-RT
 * 2. Filter trains by user-specified direction
 * 3. Find trains within proximity range (< 500m)
 * 4. Return the nearest matching train
 * 
 * Key Features:
 * - Simple proximity-based matching
 * - Direction and line filtering for accuracy
 * - Fast performance with minimal complexity
 * 
 * @example
 * ```typescript
 * const service = TrainFinderService.getInstance();
 * const trains = await service.findNearestTrains({
 *   userLatitude: 40.7589,
 *   userLongitude: -73.9851,
 *   lineCode: '6',
 *   direction: 0
 * });
 * 
 * if (trains.length > 0) {
 *   console.log(`Nearest train: ${trains[0].label} (${trains[0].distanceToUser}m away)`);
 *   console.log(`Found ${trains.length} trains nearby`);
 * }
 * ```
 */
export class TrainFinderService {
  private static instance: TrainFinderService;
  
  private readonly gtfsRTService: GTFSRTService;
  private readonly gtfsService: GTFSService;
  private readonly trainBuilderService: TrainBuilderService;
  
  /** Default maximum distance from train for consideration (meters) */
  private readonly defaultMaxProximityDistance = 500;

  private constructor() {
    this.gtfsRTService = GTFSRTService.getInstance();
    this.gtfsService = GTFSService.getInstance();
    this.trainBuilderService = TrainBuilderService.getInstance();
  }

  /**
   * Get the singleton instance of TrainFinderService
   * @returns The TrainFinderService instance
   */
  public static getInstance(): TrainFinderService {
    if (!TrainFinderService.instance) {
      TrainFinderService.instance = new TrainFinderService();
    }
    return TrainFinderService.instance;
  }

  /**
   * Find nearby trains matching user criteria, sorted by distance
   * 
   * @param request - User location, line code, and direction
   * @returns Array of trains sorted by distance (nearest first)
   * @throws {Error} If invalid input or service unavailable
   */
  public async findNearestTrains(request: TrainFinderRequest): Promise<TrainCandidate[]> {
    // Validate input
    this.validateRequest(request);
    
    // Get real-time vehicle positions for the line
    const vehicles = await this.gtfsRTService.getVehiclePositions(request.lineCode);
    
    // Find and return all nearby trains sorted by distance
    const nearbyTrains = await this.findNearbyTrains(request, vehicles);
    
    return nearbyTrains;
  }

  /**
   * Validate the train identification request
   * @param request - Request to validate
   * @throws {Error} If request is invalid
   * @private
   */
  private validateRequest(request: TrainFinderRequest): void {
    if (!request.userLatitude || !request.userLongitude || !request.lineCode) {
      throw new Error('userLatitude, userLongitude, and lineCode are required');
    }
    
    if (typeof request.userLatitude !== 'number' || typeof request.userLongitude !== 'number') {
      throw new Error('userLatitude and userLongitude must be numbers');
    }
    
    if (request.direction !== undefined && (typeof request.direction !== 'number' || (request.direction !== 0 && request.direction !== 1))) {
      throw new Error('direction must be 0 or 1 if provided');
    }
    
    // Validate NYC area bounds (rough check)
    if (request.userLatitude < 40.4 || request.userLatitude > 41.0 ||
        request.userLongitude < -74.5 || request.userLongitude > -73.5) {
      throw new Error('Location appears to be outside NYC area');
    }
    
    if (typeof request.lineCode !== 'string' || request.lineCode.trim().length === 0) {
      throw new Error('lineCode must be a non-empty string');
    }
  }

  /**
   * Find all nearby trains matching user criteria, sorted by distance
   * @param request - User request with location and direction
   * @param vehicles - Real-time vehicle positions
   * @returns Array of trains sorted by distance (nearest first)
   * @private
   */
  private async findNearbyTrains(
    request: TrainFinderRequest, 
    vehicles: VehiclePositionWithFeed[]
  ): Promise<TrainCandidate[]> {
    const nearbyTrains: TrainCandidate[] = [];
    const maxProximityDistance = request.radiusMeters || this.defaultMaxProximityDistance;
    
    for (const vehicle of vehicles) {
      
      // Extract direction from trip ID pattern (..N.. = 0, ..S.. = 1)
      let trainDirection: number | undefined;
      const tripId = vehicle.vehicle.trip?.tripId;
      
      if (tripId) {
        if (tripId.includes('..N') || tripId.includes('.N')) {
          trainDirection = 0;
        } else if (tripId.includes('..S') || tripId.includes('.S')) {
          trainDirection = 1;
        }
        
        if (trainDirection !== undefined) {
          // Filter by direction using parsed direction (only if direction is specified in request)
          if (request.direction !== undefined && trainDirection !== request.direction) {
            continue;
          }
        } else {
          // If we have a trip ID but can't determine direction, skip this vehicle
          continue;
        }
      } else {
        // If no trip ID at all, skip this vehicle (can't determine direction)
        continue;
      }

      // Try GPS position first (ideal case)
      if (vehicle.vehicle.position?.latitude && vehicle.vehicle.position?.longitude) {
        const distance = this.calculateDistance(
          request.userLatitude,
          request.userLongitude,
          vehicle.vehicle.position.latitude,
          vehicle.vehicle.position.longitude
        );
        
        if (distance <= maxProximityDistance) {
          const candidate = await this.createTrainCandidate(vehicle, request, distance);
          if (candidate) {
            nearbyTrains.push(candidate);
          }
        }
        continue;
      }
      
      // Fallback: Use stop coordinates if vehicle has a stopId
      if (vehicle.vehicle.stopId) {
        const stop = this.gtfsService.getStop(vehicle.vehicle.stopId);
        if (stop) {
          // Calculate distance using stop coordinates
          const distance = this.calculateDistance(
            request.userLatitude,
            request.userLongitude,
            stop.stopLat,
            stop.stopLon
          );
          
          if (distance <= maxProximityDistance) {
            // Create train candidate with stop coordinates
            const trainCandidate = await this.createTrainCandidate(vehicle, request, distance);
            if (trainCandidate) {
              // Override position with stop coordinates
              trainCandidate.position.latitude = stop.stopLat;
              trainCandidate.position.longitude = stop.stopLon;
              
              nearbyTrains.push(trainCandidate);
            }
          }
        }
      }
    }
    
    // Sort by distance (nearest first)
    return nearbyTrains.sort((a, b) => a.distanceToUser - b.distanceToUser);
  }

  /**
   * Create a TrainCandidate from vehicle data
   * @private
   */
  private async createTrainCandidate(vehicle: VehiclePositionWithFeed, request: TrainFinderRequest, distance: number): Promise<TrainCandidate | null> {
    try {
      // Build the train using TrainBuilderService
      const trainInfo = await this.trainBuilderService.buildTrainFromVehicleId(vehicle.id, request.lineCode);
      
      if (!trainInfo) {
        return null;
      }
      
      // Extend TrainInfo with TrainCandidate-specific fields
      return {
        ...trainInfo,
        label: vehicle.vehicle.label || null,
        position: {
          latitude: vehicle.vehicle.position?.latitude || 0,
          longitude: vehicle.vehicle.position?.longitude || 0,
          bearing: vehicle.vehicle.position?.bearing,
          speed: vehicle.vehicle.position?.speed
        },
        distanceToUser: distance,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.warn(`Failed to create train candidate for vehicle ${vehicle.id}:`, error);
      return null;
    }
  }



  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param lat1 - First latitude
   * @param lon1 - First longitude
   * @param lat2 - Second latitude
   * @param lon2 - Second longitude
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

    return R * c;
  }
}