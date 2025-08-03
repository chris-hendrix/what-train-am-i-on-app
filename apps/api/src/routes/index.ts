import { Router } from 'express';
import type { Request, Response } from 'express';
import { 
  Route, 
  SuccessResponse
} from '@what-train/shared';
import { GTFSService } from '../services/gtfs-service/index.js';
import type { 
  StationWithDistance
} from '../services/gtfs-service/types/index.js';

const router = Router();
const gtfsService = GTFSService.getInstance();

// Get all routes
router.get('/routes', (_req: Request, res: Response) => {
  try {
    // Get all routes from GTFS service and convert to API format
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

// Get nearest stations by coordinates
router.get('/api/stations/nearest', (req: Request, res: Response) => {
  try {
    const { lat, lon, limit } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'lat and lon query parameters are required',
        timestamp: new Date().toISOString()
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);
    const maxResults = limit ? parseInt(limit as string) : 5;

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: 'lat and lon must be valid numbers',
        timestamp: new Date().toISOString()
      });
    }

    const nearestStations = gtfsService.findNearestStations(latitude, longitude, maxResults);
    
    const response: SuccessResponse<{ stations: StationWithDistance[] }> = {
      success: true,
      data: { stations: nearestStations },
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to find nearest stations: ${error}`,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;