// API configuration constants
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000',
  DEFAULT_SEARCH_RADIUS_METERS: 500,
} as const;

// Helper function to format radius for display
export const formatRadius = (radiusMeters: number): string => {
  if (radiusMeters >= 1000) {
    const km = radiusMeters / 1000;
    return km % 1 === 0 ? `${km}km` : `${km.toFixed(1)}km`;
  }
  return `${radiusMeters}m`;
};