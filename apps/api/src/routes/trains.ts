import { Router } from 'express';
import type { Request, Response } from 'express';
import { 
  SuccessResponse,
  NearestTrainsRequest,
  NearestTrainsResponse,
  TrainData,
  NextStop
} from '@what-train/shared';
import { GTFSService } from '../services/gtfs-service/index.js';
import { TrainFinderService } from '../services/train-finder-service/index.js';
import { validateNearestTrainsRequest } from '../middleware/validation.js';
import { requestLogger } from '../middleware/logging.js';

const router = Router();
const gtfsService = GTFSService.getInstance();
const trainFinderService = TrainFinderService.getInstance();

router.use(requestLogger);

/**
 * Find nearest trains to user location
 * Takes user coordinates, line code, and direction to identify nearby trains
 * Returns train data with current position and next stops
 */
router.post('/trains/nearest', validateNearestTrainsRequest, async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, lineCode, direction, radiusMeters } = req.body as NearestTrainsRequest;
    
    const trainCandidates = await trainFinderService.findNearestTrains({
      userLatitude: latitude,
      userLongitude: longitude,
      lineCode: lineCode,
      direction: direction,
      radiusMeters: radiusMeters
    });

    const routeInfo = gtfsService.getRouteByLineCode(lineCode);
    if (!routeInfo) {
      return res.status(404).json({
        success: false,
        error: `Route information not found for line ${lineCode}`,
        timestamp: new Date().toISOString()
      });
    }

    const trains: TrainData[] = trainCandidates.map(train => {
      let currentStationName = 'Unknown Station';
      if (train.currentStopId) {
        const station = gtfsService.getStop(train.currentStopId);
        if (station) {
          currentStationName = station.stop_name;
        }
      }

      const nextStops: NextStop[] = [];

      const serviceType = routeInfo.route.route_short_name.includes('Express') ? 'express' : 'local';

      let directionName = 'Unknown Direction';
      if (train.tripId) {
        if (train.tripId.includes('..N') || train.tripId.includes('.N')) {
          directionName = 'Uptown & Bronx';
        } else if (train.tripId.includes('..S') || train.tripId.includes('.S')) {
          directionName = 'Downtown & Brooklyn';
        }
      }

      return {
        trainId: train.vehicleId,
        line: {
          code: routeInfo.route.route_short_name,
          name: routeInfo.route.route_long_name,
          color: `#${routeInfo.route.route_color || '808080'}`
        },
        direction: directionName,
        currentStation: currentStationName,
        nextStops: nextStops,
        serviceType: serviceType,
        distanceMeters: Math.round(train.distanceToUser),
        lastUpdated: train.timestamp 
          ? new Date(train.timestamp * 1000).toISOString() 
          : new Date().toISOString()
      };
    });

    const response: SuccessResponse<NearestTrainsResponse> = {
      success: true,
      data: {
        trains,
        totalFound: trains.length
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

export default router;