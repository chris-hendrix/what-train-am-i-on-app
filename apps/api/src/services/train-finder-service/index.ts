import { GTFSRTService } from '../gtfs-rt-service/index.js';
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
  
  /** Maximum distance from train for consideration (meters) */
  private readonly maxProximityDistance = 500;

  private constructor() {
    this.gtfsRTService = GTFSRTService.getInstance();
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
    return this.findNearbyTrains(request, vehicles);
  }

  /**
   * Validate the train identification request
   * @param request - Request to validate
   * @throws {Error} If request is invalid
   * @private
   */
  private validateRequest(request: TrainFinderRequest): void {
    if (!request.userLatitude || !request.userLongitude || !request.lineCode || request.direction === undefined) {
      throw new Error('userLatitude, userLongitude, lineCode, and direction are required');
    }
    
    if (typeof request.userLatitude !== 'number' || typeof request.userLongitude !== 'number') {
      throw new Error('userLatitude and userLongitude must be numbers');
    }
    
    if (typeof request.direction !== 'number' || (request.direction !== 0 && request.direction !== 1)) {
      throw new Error('direction must be 0 or 1');
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
  private findNearbyTrains(
    request: TrainFinderRequest, 
    vehicles: VehiclePositionWithFeed[]
  ): TrainCandidate[] {
    const nearbyTrains: TrainCandidate[] = [];
    
    for (const vehicle of vehicles) {
      // Skip vehicles without position data
      if (!vehicle.vehicle.position?.latitude || !vehicle.vehicle.position?.longitude) {
        continue;
      }
      
      // Skip trains not traveling in the specified direction
      const trainDirection = vehicle.vehicle.trip?.directionId;
      if (trainDirection !== request.direction) {
        continue;
      }
      
      // Calculate distance to user
      const distance = this.calculateDistance(
        request.userLatitude,
        request.userLongitude,
        vehicle.vehicle.position.latitude,
        vehicle.vehicle.position.longitude
      );
      
      // Only consider trains within maximum proximity
      if (distance <= this.maxProximityDistance) {
        nearbyTrains.push({
          vehicleId: vehicle.id,
          tripId: vehicle.vehicle.trip?.tripId || null,
          routeId: vehicle.vehicle.trip?.routeId || request.lineCode,
          label: vehicle.vehicle.label || null,
          position: {
            latitude: vehicle.vehicle.position.latitude,
            longitude: vehicle.vehicle.position.longitude,
            bearing: vehicle.vehicle.position.bearing,
            speed: vehicle.vehicle.position.speed
          },
          currentStopId: vehicle.vehicle.stopId || null,
          currentStopSequence: vehicle.vehicle.currentStopSequence || null,
          currentStatus: vehicle.vehicle.currentStatus || null,
          direction: vehicle.vehicle.trip?.directionId ?? null,
          distanceToUser: distance,
          timestamp: vehicle.vehicle.timestamp || Date.now()
        });
      }
    }
    
    // Sort by distance (nearest first)
    return nearbyTrains.sort((a, b) => a.distanceToUser - b.distanceToUser);
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