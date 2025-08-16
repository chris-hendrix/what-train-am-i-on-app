import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { 
  Route, 
  SuccessResponse
} from '@what-train/shared';
import { GTFSService } from '../services/gtfs-service/index.js';
import { requestLogger } from '../middleware/logging.js';
import { asyncHandler } from '../middleware/error.js';
import { DEBUG_CONFIG } from '../config/debug.js';

// Line codes excluded from routes due to no real-time data availability
const EXCLUDED_LINE_CODES = ['SI', 'SIR', 'H', 'FS', 'GS', '5X', '6X', '7X', 'FX'];

const router = Router();
const gtfsService = GTFSService.getInstance();

router.use(requestLogger);

/**
 * Get all available MTA subway routes
 * Returns route information including colors and names
 * Note: Raw GTFS data included automatically in development mode
 */
router.get('/routes', asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  const includeGtfsData = DEBUG_CONFIG.INCLUDE_GTFS_DATA;
  const gtfsRoutes = gtfsService.getAllRoutes();
  
  const routes: Route[] = gtfsRoutes
    .filter(gtfsRoute => !EXCLUDED_LINE_CODES.includes(gtfsRoute.routeShortName))
    .map(gtfsRoute => {
      const headsigns = gtfsService.getHeadsignsForLine(gtfsRoute.routeShortName);

      const route: Route = {
        id: gtfsRoute.routeId,
        shortName: gtfsRoute.routeShortName,
        longName: gtfsRoute.routeLongName,
        color: gtfsRoute.routeColor,
        textColor: gtfsRoute.routeTextColor,
        headsigns
      };

      // Add raw GTFS data for debugging if requested
      if (includeGtfsData) {
        (route as Route & { gtfsData?: typeof gtfsRoute }).gtfsData = gtfsRoute;
      }

      return route;
    });
  
  const response: SuccessResponse<{ routes: Route[] }> = {
    success: true,
    data: { routes },
    timestamp: new Date().toISOString()
  };
  
  res.json(response);
}));

export default router;