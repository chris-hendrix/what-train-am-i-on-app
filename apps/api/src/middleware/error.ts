import type { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '@what-train/shared';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    
    // Capture stack trace (excluding constructor call from stack trace)
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * MTA API unavailable error
 */
export class MtaApiError extends ApiError {
  constructor(message: string = 'MTA real-time data is temporarily unavailable') {
    super(message, 503);
  }
}

/**
 * Invalid location error
 */
export class InvalidLocationError extends ApiError {
  constructor(message: string = 'Location appears to be outside NYC area or invalid') {
    super(message, 400);
  }
}

/**
 * No trains found error
 */
export class NoTrainsFoundError extends ApiError {
  constructor(message: string = 'No trains found for the specified criteria') {
    super(message, 404);
  }
}

/**
 * Request timeout error
 */
export class RequestTimeoutError extends ApiError {
  constructor(message: string = 'Request timed out') {
    super(message, 408);
  }
}

/**
 * Service alert error (line not running)
 */
export class ServiceAlertError extends ApiError {
  constructor(message: string) {
    super(message, 503);
  }
}

/**
 * Global error handling middleware
 * Must be placed after all routes
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Don't handle if response was already sent
  if (res.headersSent) {
    return next(error);
  }

  const timestamp = new Date().toISOString();
  
  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  // Handle known API errors
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
  }
  // Handle validation errors (from express-validator or similar)
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Invalid request data';
    isOperational = true;
  }
  // Handle JSON parsing errors
  else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
    isOperational = true;
  }
  // Handle timeout errors
  else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    statusCode = 408;
    message = 'Request timeout';
    isOperational = true;
  }

  // Log error for debugging
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  const logData = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode,
      isOperational
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.method === 'POST' ? req.body : undefined
    },
    timestamp
  };

  console[logLevel](`[${timestamp}] API Error:`, logData);

  // Send structured error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: message,
    timestamp
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  const error = new ApiError(`Route not found: ${req.method} ${req.url}`, 404);
  next(error);
};

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error middleware
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};