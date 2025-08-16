import * as Location from 'expo-location';

export interface GeolocationResult {
  success: boolean;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
  };
  error?: string;
  isLocationData?: 'user' | 'fallback';
}

export interface GeolocationOptions {
  accuracy?: Location.Accuracy;
  minAccuracy?: number;
}

const DEFAULT_OPTIONS: Required<GeolocationOptions> = {
  accuracy: Location.Accuracy.High,
  minAccuracy: 100,
};

// Default NYC location (Times Square) for fallback
const NYC_DEFAULT_LOCATION = {
  latitude: 40.7580,
  longitude: -73.9855,
  accuracy: null,
};

/**
 * Geolocation service for getting user location with permission handling and error management.
 * Provides a singleton instance for consistent location access across the app.
 */
export class GeolocationService {
  private static instance: GeolocationService;
  private mockLocation: { latitude: number; longitude: number } | null = null;

  private constructor() {}

  /**
   * Get the singleton instance of GeolocationService
   */
  static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  /**
   * Set a mock location for development and testing
   */
  setMockLocation(latitude: number, longitude: number): void {
    this.mockLocation = { latitude, longitude };
  }

  /**
   * Clear the mock location
   */
  clearMockLocation(): void {
    this.mockLocation = null;
  }

  /**
   * Request location permissions from the user
   * @returns Promise with permission result and error details
   */
  async requestPermissions(): Promise<{ granted: boolean; error?: string }> {
    try {
      const result = await Location.requestForegroundPermissionsAsync();
      
      if (!result.granted) {
        return {
          granted: false,
          error: result.canAskAgain 
            ? 'Location permission denied. Please allow location access to use this feature.'
            : 'Location permission permanently denied. Please enable location access in your device settings.',
        };
      }

      return { granted: true };
    } catch (error) {
      return {
        granted: false,
        error: `Failed to request location permission: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get the user's current location
   * @param options Configuration options for location accuracy and validation
   * @returns Promise with location result or error
   */
  async getCurrentLocation(options: GeolocationOptions = {}): Promise<GeolocationResult> {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

    // Return mock location if set (for development/testing)
    if (this.mockLocation) {
      return {
        success: true,
        location: {
          ...this.mockLocation,
          accuracy: 5,
        },
        isLocationData: 'user',
      };
    }

    // Request permissions if not already granted
    const permissionResult = await this.requestPermissions();
    if (!permissionResult.granted) {
      // If permission denied, fallback to NYC location
      return {
        success: true,
        location: NYC_DEFAULT_LOCATION,
        error: `${permissionResult.error} Using default NYC location.`,
        isLocationData: 'fallback',
      };
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: mergedOptions.accuracy,
      });

      // Check if location accuracy meets requirements
      if (location.coords.accuracy && location.coords.accuracy > mergedOptions.minAccuracy) {
        // If accuracy is too low, fallback to NYC location
        return {
          success: true,
          location: NYC_DEFAULT_LOCATION,
          error: `Location accuracy too low (${Math.round(location.coords.accuracy)}m). Using default NYC location.`,
          isLocationData: 'fallback',
        };
      }

      return {
        success: true,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
        },
        isLocationData: 'user',
      };
    } catch (error) {
      // If any error occurs, fallback to NYC location
      return {
        success: true,
        location: NYC_DEFAULT_LOCATION,
        error: `Failed to get location: ${error instanceof Error ? error.message : 'Unknown error'}. Using default NYC location.`,
        isLocationData: 'fallback',
      };
    }
  }

  /**
   * Check if location services are enabled on the device
   * @returns Promise resolving to boolean indicating if location services are enabled
   */
  async checkLocationServicesEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch {
      return false;
    }
  }

  /**
   * Get the current location permission status
   * @returns Promise resolving to the current permission status
   */
  async getPermissionStatus(): Promise<Location.PermissionStatus> {
    try {
      const result = await Location.getForegroundPermissionsAsync();
      return result.status;
    } catch {
      return Location.PermissionStatus.UNDETERMINED;
    }
  }
}

export const geolocationService = GeolocationService.getInstance();