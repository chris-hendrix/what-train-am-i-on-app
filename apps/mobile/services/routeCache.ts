import AsyncStorage from '@react-native-async-storage/async-storage';
import { Route } from '@what-train/shared';

const CACHE_KEY = '@routes_cache';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface CacheData {
  routes: Route[];
  timestamp: number;
  expires: number;
}

export class RouteCacheService {
  /**
   * Get cached routes if they exist and haven't expired
   * @returns Promise<Route[] | null> - Routes if valid cache exists, null otherwise
   */
  static async getCachedRoutes(): Promise<Route[] | null> {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      
      if (!cachedData) {
        return null;
      }

      const cache: CacheData = JSON.parse(cachedData);
      const now = Date.now();

      // Check if cache has expired
      if (now > cache.expires) {
        // Remove expired cache
        await AsyncStorage.removeItem(CACHE_KEY);
        return null;
      }

      return cache.routes;
    } catch (error) {
      console.warn('Error reading routes cache:', error);
      return null;
    }
  }

  /**
   * Cache routes with 7-day TTL
   * @param routes - Routes to cache
   * @returns Promise<boolean> - Success status
   */
  static async cacheRoutes(routes: Route[]): Promise<boolean> {
    try {
      const now = Date.now();
      const cacheData: CacheData = {
        routes,
        timestamp: now,
        expires: now + SEVEN_DAYS_MS
      };

      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.warn('Error caching routes:', error);
      return false;
    }
  }

  /**
   * Check if cached data is nearing expiration (within 1 day)
   * This can be used to refresh data in the background
   * @returns Promise<boolean> - True if cache should be refreshed soon
   */
  static async shouldRefreshSoon(): Promise<boolean> {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      
      if (!cachedData) {
        return true; // No cache, should refresh
      }

      const cache: CacheData = JSON.parse(cachedData);
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      // Return true if cache expires within 1 day
      return (cache.expires - now) <= oneDayMs;
    } catch (error) {
      console.warn('Error checking cache expiration:', error);
      return true; // On error, assume we should refresh
    }
  }

  /**
   * Get cache metadata for debugging
   * @returns Promise<object | null> - Cache info or null if no cache
   */
  static async getCacheInfo(): Promise<{ timestamp: number; expires: number; age: string } | null> {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      
      if (!cachedData) {
        return null;
      }

      const cache: CacheData = JSON.parse(cachedData);
      const now = Date.now();
      const ageMs = now - cache.timestamp;
      const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));
      const ageHours = Math.floor((ageMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      
      return {
        timestamp: cache.timestamp,
        expires: cache.expires,
        age: `${ageDays}d ${ageHours}h`
      };
    } catch (error) {
      console.warn('Error getting cache info:', error);
      return null;
    }
  }

  /**
   * Clear the routes cache
   * @returns Promise<boolean> - Success status
   */
  static async clearCache(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      return true;
    } catch (error) {
      console.warn('Error clearing routes cache:', error);
      return false;
    }
  }
}