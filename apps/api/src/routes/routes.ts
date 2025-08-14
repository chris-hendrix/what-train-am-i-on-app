import { Router } from 'express';
import type { Request, Response } from 'express';
import { 
  Route, 
  SuccessResponse
} from '@what-train/shared';
import { GTFSService } from '../services/gtfs-service/index.js';
import { requestLogger } from '../middleware/logging.js';

const router = Router();
const gtfsService = GTFSService.getInstance();

router.use(requestLogger);

/**
 * Get all available MTA subway routes
 * Returns route information including colors and names
 */
router.get('/routes', (_req: Request, res: Response) => {
  try {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to get routes: ${error}`,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;