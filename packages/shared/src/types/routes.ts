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
  headsigns?: Record<string, number>; // headsign -> direction_id mapping
}

/**
 * Routes response data
 */
export interface RoutesResponse {
  routes: Route[];
}