import type { Request, Response, NextFunction } from 'express';
import { NearestTrainsRequest } from '@what-train/shared';

/**
 * Validates nearest trains request payload
 */
export const validateNearestTrainsRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { latitude, longitude, lineCode, direction } = req.body as Partial<NearestTrainsRequest>;

  // Check required fields
  if (latitude === undefined || longitude === undefined || lineCode === undefined || direction === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: latitude, longitude, lineCode, and direction are required',
      timestamp: new Date().toISOString()
    });
  }

  // Validate latitude
  if (typeof latitude !== 'number' || isNaN(latitude)) {
    return res.status(400).json({
      success: false,
      error: 'latitude must be a valid number',
      timestamp: new Date().toISOString()
    });
  }

  if (latitude < -90 || latitude > 90) {
    return res.status(400).json({
      success: false,
      error: 'latitude must be between -90 and 90',
      timestamp: new Date().toISOString()
    });
  }

  // Validate longitude
  if (typeof longitude !== 'number' || isNaN(longitude)) {
    return res.status(400).json({
      success: false,
      error: 'longitude must be a valid number',
      timestamp: new Date().toISOString()
    });
  }

  if (longitude < -180 || longitude > 180) {
    return res.status(400).json({
      success: false,
      error: 'longitude must be between -180 and 180',
      timestamp: new Date().toISOString()
    });
  }

  // Validate NYC area bounds (rough check)
  if (latitude < 40.4 || latitude > 41.0 || longitude < -74.5 || longitude > -73.5) {
    return res.status(400).json({
      success: false,
      error: 'Location appears to be outside NYC area',
      timestamp: new Date().toISOString()
    });
  }

  // Validate lineCode
  if (typeof lineCode !== 'string' || lineCode.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'lineCode must be a non-empty string',
      timestamp: new Date().toISOString()
    });
  }

  // Validate direction
  if (typeof direction !== 'number' || isNaN(direction)) {
    return res.status(400).json({
      success: false,
      error: 'direction must be a valid number',
      timestamp: new Date().toISOString()
    });
  }

  if (direction !== 0 && direction !== 1) {
    return res.status(400).json({
      success: false,
      error: 'direction must be 0 (uptown/north) or 1 (downtown/south)',
      timestamp: new Date().toISOString()
    });
  }

  // Sanitize lineCode (trim whitespace and convert to uppercase)
  req.body.lineCode = lineCode.trim().toUpperCase();

  next();
};