import React, { createContext, useContext, useEffect } from 'react';
import { Route } from '@what-train/shared';
import { useRoutes } from '../hooks/useRoutes';
import { useGeolocation, UseGeolocationReturn } from '../hooks/useGeolocation';

interface AppContextType {
  // Routes
  routes: Route[];
  filteredRoutes: Route[];
  routesLoading: boolean;
  routesError: string | null;
  routesFromCache: boolean;
  refreshRoutes: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Location
  location: UseGeolocationReturn['location'];
  locationLoading: boolean;
  locationError: string | null;
  getCurrentLocation: () => Promise<void>;
  clearLocationError: () => void;
  setMockLocation: (latitude: number, longitude: number) => void;
  clearMockLocation: () => void;
  setManualLocation: (latitude: number, longitude: number) => void;
  
  // Helper methods
  getRouteByLineCode: (lineCode: string) => Route | undefined;
  getRouteById: (routeId: string) => Route | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Use existing hooks instead of duplicating logic
  const { 
    routes,
    filteredRoutes,
    loading: routesLoading, 
    error: routesError, 
    fromCache: routesFromCache, 
    refetch: refreshRoutes,
    searchQuery,
    setSearchQuery
  } = useRoutes();
  
  const {
    location,
    loading: locationLoading,
    error: locationError,
    getCurrentLocation,
    clearError: clearLocationError,
    setMockLocation,
    clearMockLocation,
    setManualLocation,
  } = useGeolocation();

  // Helper methods
  const getRouteByLineCode = (lineCode: string): Route | undefined => {
    return routes.find(route => route.shortName === lineCode);
  };

  const getRouteById = (routeId: string): Route | undefined => {
    return routes.find(route => route.id === routeId);
  };

  // Auto-request location on app start
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const contextValue: AppContextType = {
    // Routes
    routes,
    filteredRoutes,
    routesLoading,
    routesError,
    routesFromCache,
    refreshRoutes,
    searchQuery,
    setSearchQuery,
    
    // Location
    location,
    locationLoading,
    locationError,
    getCurrentLocation,
    clearLocationError,
    setMockLocation,
    clearMockLocation,
    setManualLocation,
    
    // Helper methods
    getRouteByLineCode,
    getRouteById,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}