import { useState, useCallback } from 'react';
import { geolocationService, GeolocationResult, GeolocationOptions } from '../services/geolocationService';

export interface UseGeolocationReturn {
  location: GeolocationResult['location'] | null;
  loading: boolean;
  error: string | null;
  getCurrentLocation: (options?: GeolocationOptions) => Promise<void>;
  clearError: () => void;
  setMockLocation: (latitude: number, longitude: number) => void;
  clearMockLocation: () => void;
}

/**
 * React hook for geolocation functionality with loading and error states
 */
export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<GeolocationResult['location'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async (options?: GeolocationOptions) => {
    setLoading(true);
    setError(null);

    try {
      const result = await geolocationService.getCurrentLocation(options);
      
      if (result.success) {
        setLocation(result.location || null);
      } else {
        setError(result.error || 'Failed to get location');
        setLocation(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLocation(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setMockLocation = useCallback((latitude: number, longitude: number) => {
    geolocationService.setMockLocation(latitude, longitude);
  }, []);

  const clearMockLocation = useCallback(() => {
    geolocationService.clearMockLocation();
  }, []);

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    clearError,
    setMockLocation,
    clearMockLocation,
  };
}