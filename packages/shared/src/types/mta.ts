// MTA API Response Types
// These types are used for API responses and match GTFS naming conventions

/**
 * Route information for API responses
 * Simplified structure for client consumption using camelCase
 */
export interface Route {
  id: string;
  shortName: string;
  longName: string;
  color?: string;
  textColor?: string;
}