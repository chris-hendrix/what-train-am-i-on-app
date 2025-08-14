import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { 
  Route, 
  SuccessResponse
} from '@what-train/shared';
import { GTFSService } from '../services/gtfs-service/index.js';
import { requestLogger } from '../middleware/logging.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();
const gtfsService = GTFSService.getInstance();

router.use(requestLogger);

/**
 * Get all available MTA subway routes
 * Returns route information including colors and names
 */
router.get('/routes', asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  const gtfsRoutes = gtfsService.getAllRoutes();
  const routes: Route[] = gtfsRoutes.map(gtfsRoute => ({
    id: gtfsRoute.route_id,
    shortName: gtfsRoute.route_short_name,
    longName: gtfsRoute.route_long_name,
    color: gtfsRoute.route_color,
    textColor: gtfsRoute.route_text_color
  }));
  
  const response: SuccessResponse<{ routes: Route[] }> = {
    success: true,
    data: { routes },
    timestamp: new Date().toISOString()
  };
  
  res.json(response);
}));

export default router;