import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
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
import { asyncHandler, MtaApiError, NoTrainsFoundError, RequestTimeoutError } from '../middleware/error.js';
import { GTFSRTError, GTFSRTTimeoutError, GTFSRTUnavailableError } from '../services/gtfs-rt-service/errors.js';

const router = Router();
const gtfsService = GTFSService.getInstance();
const trainFinderService = TrainFinderService.getInstance();

router.use(requestLogger);

/**
 * Find nearest trains to user location
 * Takes user coordinates, line code, and direction to identify nearby trains
 * Returns train data with current position and next stops
 */
router.post('/trains/nearest', validateNearestTrainsRequest, asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { latitude, longitude, lineCode, direction, headsign, radiusMeters } = req.body as NearestTrainsRequest;
  
  // Get route information first
  const routeInfo = gtfsService.getRouteByLineCode(lineCode);
  if (!routeInfo) {
    throw new Error(`Route information not found for line ${lineCode}`);
  }

  // Resolve direction from headsign if provided, otherwise use direction parameter
  let resolvedDirection: number | undefined = direction;
  if (headsign) {
    const headsignMappings = gtfsService.getHeadsignsForLine(lineCode);
    if (headsignMappings[headsign] !== undefined) {
      resolvedDirection = headsignMappings[headsign];
    } else {
      res.status(400).json({
        success: false,
        error: `Invalid headsign "${headsign}" for line ${lineCode}`,
        timestamp: new Date().toISOString()
      });
      return;
    }
  }

  try {
    const trainCandidates = await trainFinderService.findNearestTrains({
      userLatitude: latitude,
      userLongitude: longitude,
      lineCode: lineCode,
      direction: resolvedDirection,
      radiusMeters: radiusMeters
    });

    // Handle case where no trains are found
    if (trainCandidates.length === 0) {
      throw new NoTrainsFoundError(`No trains found for line ${lineCode} in the specified area. This could be due to service disruptions, trains not currently running, or being outside the service area.`);
    }

    const trains: TrainData[] = trainCandidates.map(train => {
      let currentStationName = 'Unknown Station';
      if (train.currentStopId) {
        const station = gtfsService.getStop(train.currentStopId);
        if (station) {
          currentStationName = station.stopName;
        }
      }

      const nextStops: NextStop[] = [];

      const serviceType = routeInfo.route.routeShortName.includes('Express') ? 'express' : 'local';

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
          code: routeInfo.route.routeShortName,
          name: routeInfo.route.routeLongName,
          color: `#${routeInfo.route.routeColor || '808080'}`
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
    // Handle service-specific errors and convert to appropriate API errors
    if (error instanceof GTFSRTTimeoutError) {
      throw new RequestTimeoutError('MTA real-time data request timed out. Please try again.');
    }
    if (error instanceof GTFSRTUnavailableError || error instanceof GTFSRTError) {
      throw new MtaApiError('MTA real-time data service is temporarily unavailable. Please try again later.');
    }
    if (error instanceof Error && error.message.includes('GTFS data not loaded')) {
      throw new Error('Service temporarily unavailable - data is loading');
    }
    
    // Re-throw to let error middleware handle it
    throw error;
  }
}));

export default router;