import React, { createContext, useContext, useEffect } from 'react';
import { Route } from '@what-train/shared';
import { useRoutes } from '../hooks/useRoutes';
import { useGeolocation, UseGeolocationReturn } from '../hooks/useGeolocation';

interface AppContextType {
  // Routes
  routes: Route[];
  routesLoading: boolean;
  routesError: string | null;
  routesFromCache: boolean;
  refreshRoutes: () => Promise<void>;
  
  // Location
  location: UseGeolocationReturn['location'];
  locationLoading: boolean;
  locationError: string | null;
  getCurrentLocation: () => Promise<void>;
  clearLocationError: () => void;
  setMockLocation: (latitude: number, longitude: number) => void;
  clearMockLocation: () => void;
  
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
    loading: routesLoading, 
    error: routesError, 
    fromCache: routesFromCache, 
    refetch: refreshRoutes 
  } = useRoutes();
  
  const {
    location,
    loading: locationLoading,
    error: locationError,
    getCurrentLocation,
    clearError: clearLocationError,
    setMockLocation,
    clearMockLocation,
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
    routesLoading,
    routesError,
    routesFromCache,
    refreshRoutes,
    
    // Location
    location,
    locationLoading,
    locationError,
    getCurrentLocation,
    clearLocationError,
    setMockLocation,
    clearMockLocation,
    
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