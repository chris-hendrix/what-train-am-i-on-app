import { Router } from 'express';
import type { Request, Response } from 'express';
import { 
  Route, 
  SuccessResponse,
  NearestTrainsRequest,
  NearestTrainsResponse,
  TrainData,
  NextStop
} from '@what-train/shared';
import { GTFSService } from '../services/gtfs-service/index.js';
import { TrainFinderService } from '../services/train-finder-service/index.js';
import type { 
  StationWithDistance
} from '../services/gtfs-service/types/index.js';
import { validateNearestTrainsRequest } from '../middleware/validation.js';
import { requestLogger } from '../middleware/logging.js';

const router = Router();
const gtfsService = GTFSService.getInstance();
const trainFinderService = TrainFinderService.getInstance();

// Apply request logging middleware to all routes
router.use(requestLogger);

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

// Nearest trains endpoint
router.post('/nearest-trains', validateNearestTrainsRequest, async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, line_code, direction } = req.body as NearestTrainsRequest;
    
    const trainCandidates = await trainFinderService.findNearestTrains({
      userLatitude: latitude,
      userLongitude: longitude,
      lineCode: line_code,
      direction: direction
    });

    // Get route information
    const routeInfo = gtfsService.getRouteByLineCode(line_code);
    if (!routeInfo) {
      return res.status(404).json({
        success: false,
        error: `Route information not found for line ${line_code}`,
        timestamp: new Date().toISOString()
      });
    }

    // Convert train candidates to response format
    const trains: TrainData[] = trainCandidates.map(train => {
      // Get current station information
      let currentStationName = 'Unknown Station';
      if (train.currentStopId) {
        const station = gtfsService.getStop(train.currentStopId);
        if (station) {
          currentStationName = station.stop_name;
        }
      }

      // TODO: Implement next stops ETA calculation
      // For now, return empty array - this would require additional GTFS-RT trip updates
      const nextStops: NextStop[] = [];

      // Determine service type (express vs local)
      const serviceType = routeInfo.route.route_short_name.includes('Express') ? 'express' : 'local';

      // Extract direction from trip ID pattern (..N.. or .N = 0, ..S.. or .S = 1)  
      let directionName = 'Unknown Direction';
      if (train.tripId) {
        if (train.tripId.includes('..N') || train.tripId.includes('.N')) {
          directionName = 'Uptown & Bronx';
        } else if (train.tripId.includes('..S') || train.tripId.includes('.S')) {
          directionName = 'Downtown & Brooklyn';
        }
      }

      return {
        train_id: train.vehicleId,
        line: {
          code: routeInfo.route.route_short_name,
          name: routeInfo.route.route_long_name,
          color: `#${routeInfo.route.route_color || '808080'}`
        },
        direction: directionName,
        current_station: currentStationName,
        next_stops: nextStops,
        service_type: serviceType,
        distance_meters: Math.round(train.distanceToUser),
        last_updated: train.timestamp 
          ? new Date(train.timestamp * 1000).toISOString() 
          : new Date().toISOString()
      };
    });

    const response: SuccessResponse<NearestTrainsResponse> = {
      success: true,
      data: {
        trains,
        total_found: trains.length
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Train identification error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to identify train: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to check vehicle direction data
router.get('/debug/vehicles/:lineCode', async (req: Request, res: Response) => {
  try {
    const { lineCode } = req.params;
    const gtfsRTService = await import('../services/gtfs-rt-service/index.js').then(m => m.GTFSRTService.getInstance());
    
    const vehicles = await gtfsRTService.getVehiclePositions(lineCode);
    
    const debugData = vehicles.map(v => ({
      id: v.id,
      directionId: v.vehicle.trip?.directionId,
      routeId: v.vehicle.trip?.routeId,
      tripId: v.vehicle.trip?.tripId,
      hasPosition: !!v.vehicle.position,
      stopId: v.vehicle.stopId,
      label: v.vehicle.label
    }));
    
    const directionSummary = {
      total: vehicles.length,
      withDirection: vehicles.filter(v => v.vehicle.trip?.directionId !== undefined).length,
      direction0: vehicles.filter(v => v.vehicle.trip?.directionId === 0).length,
      direction1: vehicles.filter(v => v.vehicle.trip?.directionId === 1).length,
      noDirection: vehicles.filter(v => v.vehicle.trip?.directionId === undefined).length
    };
    
    res.json({
      success: true,
      data: {
        summary: directionSummary,
        vehicles: debugData
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to get debug data: ${error}`,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;