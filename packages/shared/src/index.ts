// Shared types for What Train Am I On app

/**
 * Generic API response wrapper that both mobile and API can use
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Basic API message response (used by /hello endpoint)
 */
export interface HelloResponse {
  message: string;
}

/**
 * MTA train line information
 */
export interface Line {
  name: string;
  code: string;
  color: string;
}

/**
 * Example usage:
 * - API returns: ApiResponse<HelloResponse>
 * - Mobile expects: ApiResponse<HelloResponse>
 * - API returns: ApiResponse<Line>
 * - Mobile expects: ApiResponse<Line>
 */