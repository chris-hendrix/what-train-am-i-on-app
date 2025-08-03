import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { 
  Route, 
  SuccessResponse
} from '@what-train/shared';
import { GTFSService } from './services/gtfs-service/index.js';
import type { 
  StationWithDistance,
  RouteInfo
} from './services/gtfs-service/types/index.js';

const app = express();
const gtfsService = GTFSService.getInstance();

// Initialize GTFS data on startup
gtfsService.loadData().catch(console.error);

// Simple CORS middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// JSON parsing middleware
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  const response: SuccessResponse<{
    status: string;
    version: string;
    services: Record<string, string>;
  }> = {
    success: true,
    data: {
      status: 'ok',
      version: '1.0.0',
      services: {
        database: 'ok',
        mta: 'ok'
      }
    },
    timestamp: new Date().toISOString()
  };
  
  res.json(response);
});

app.get('/routes', (_req: Request, res: Response) => {
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

// GTFS API Routes

// Get nearest stations by coordinates
app.get('/api/stations/nearest', (req: Request, res: Response) => {
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

// Get route information by line code
app.get('/api/routes/:lineCode', (req: Request, res: Response) => {
  try {
    const { lineCode } = req.params;
    
    const routeInfo = gtfsService.getRouteByLineCode(lineCode);
    
    if (!routeInfo) {
      return res.status(404).json({
        success: false,
        error: `Route not found for line code: ${lineCode}`,
        timestamp: new Date().toISOString()
      });
    }
    
    const response: SuccessResponse<RouteInfo> = {
      success: true,
      data: routeInfo,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to get route information: ${error}`,
      timestamp: new Date().toISOString()
    });
  }
});


// Get GTFS data statistics
app.get('/api/gtfs/stats', (_req: Request, res: Response) => {
  try {
    const stats = gtfsService.getStats();
    
    const response: SuccessResponse<typeof stats> = {
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to get GTFS stats: ${error}`,
      timestamp: new Date().toISOString()
    });
  }
});

export default app;