import { useState, useEffect, useMemo } from 'react';
import {
  Route,
  SuccessResponse,
  ErrorResponse
} from '@what-train/shared';
import { RouteCacheService } from '../services/routeCache';
import { API_CONFIG } from '../constants/api';

interface UseRoutesReturn {
  routes: Route[];
  filteredRoutes: Route[];
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refetch: () => Promise<void>;
}

export function useRoutes(): UseRoutesReturn {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sortRoutes = (routes: Route[]): Route[] => {
    return routes.sort((a, b) => {
      // Numbers first, then letters
      const aIsNumber = !isNaN(Number(a.shortName));
      const bIsNumber = !isNaN(Number(b.shortName));
      
      if (aIsNumber && bIsNumber) {
        return Number(a.shortName) - Number(b.shortName);
      }
      if (aIsNumber && !bIsNumber) return -1;
      if (!aIsNumber && bIsNumber) return 1;
      
      return a.shortName.localeCompare(b.shortName);
    });
  };

  const fetchFromAPI = async (): Promise<Route[] | null> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/routes`);
      const data: SuccessResponse<{ routes: Route[] }> | ErrorResponse = await response.json();

      if (data.success && 'data' in data) {
        const sortedRoutes = sortRoutes(data.data.routes);
        // Cache the fresh data
        await RouteCacheService.cacheRoutes(sortedRoutes);
        return sortedRoutes;
      } else {
        throw new Error(data.error || 'Failed to load route data');
      }
    } catch {
      throw new Error('Failed to connect to API');
    }
  };

  const loadRoutes = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      // Try to get cached data first (unless force refresh)
      if (!forceRefresh) {
        const cachedRoutes = await RouteCacheService.getCachedRoutes();
        if (cachedRoutes) {
          setRoutes(cachedRoutes);
          setFromCache(true);
          setLoading(false);

          // Check if we should refresh in background
          const shouldRefresh = await RouteCacheService.shouldRefreshSoon();
          if (shouldRefresh) {
            // Background refresh - don't show loading state
            try {
              const freshRoutes = await fetchFromAPI();
              if (freshRoutes) {
                setRoutes(freshRoutes);
                setFromCache(false);
              }
            } catch {
              // Silently fail background refresh, keep cached data
            }
          }
          return;
        }
      }

      // No cache or force refresh - fetch from API
      const freshRoutes = await fetchFromAPI();
      if (freshRoutes) {
        setRoutes(freshRoutes);
        setFromCache(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load routes';
      setError(errorMessage);
      
      // If API fails, try to fall back to cached data (even if expired)
      if (!fromCache) {
        try {
          const cachedRoutes = await RouteCacheService.getCachedRoutes();
          if (cachedRoutes) {
            setRoutes(cachedRoutes);
            setFromCache(true);
            setError('Using cached data - network unavailable');
          }
        } catch {
          // Cache also failed, keep the API error
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter routes by lineCode (shortName) only
  const filteredRoutes = useMemo(() => {
    if (searchQuery.trim() === '') {
      return routes;
    }
    
    const filtered = routes.filter(route =>
      route.shortName.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
    
    // Ensure filtered results maintain sort order
    return sortRoutes(filtered);
  }, [routes, searchQuery]);

  useEffect(() => {
    loadRoutes();
  }, []);

  return {
    routes,
    filteredRoutes,
    loading,
    error,
    fromCache,
    searchQuery,
    setSearchQuery,
    refetch: () => loadRoutes(true)
  };
}