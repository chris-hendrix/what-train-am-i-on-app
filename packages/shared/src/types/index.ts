// Generic API response types

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Success response wrapper
 */
export interface SuccessResponse<T = unknown> extends ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Error response wrapper
 */
export interface ErrorResponse extends ApiResponse<never> {
  success: false;
  error: string;
}

// Re-export specific types from other modules
export * from './routes.js';
export * from './trains.js';