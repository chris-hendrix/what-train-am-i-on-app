// Debug configuration constants
export const DEBUG_CONFIG = {
  // Include raw GTFS data in API responses for debugging
  INCLUDE_GTFS_DATA: process.env.INCLUDE_GTFS_DATA === 'true' || process.env.NODE_ENV !== 'production',
} as const;