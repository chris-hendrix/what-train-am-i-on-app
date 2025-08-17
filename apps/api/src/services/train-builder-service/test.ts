#!/usr/bin/env npx tsx

// npx tsx apps/api/src/services/train-builder-service/test.ts

import { TrainBuilderService } from './index.js';
import { GTFSRTService } from '../gtfs-rt-service/index.js';
import { GTFSService } from '../gtfs-service/index.js';

const trainBuilder = TrainBuilderService.getInstance();
const gtfsRT = GTFSRTService.getInstance();
const gtfs = GTFSService.getInstance();

// Load GTFS data
await gtfs.loadData();

// Get some real-time data to get a vehicle ID
const vehicles = await gtfsRT.getVehiclePositions('N');

if (vehicles && vehicles.length > 0) {
  // Find a northbound vehicle for testing
  const northboundVehicle = vehicles.find(v => {
    const tripId = v.vehicle.trip?.tripId;
    return tripId && (tripId.includes('..N') || tripId.includes('.N'));
  }) || vehicles[0];
  
  const vehicleId = northboundVehicle.id;
  
  console.log('Testing TrainBuilderService with vehicle ID:', vehicleId);
  
  // Test the simplified approach - just pass vehicle ID
  const train = await trainBuilder.buildTrainFromVehicleId(vehicleId, 'N');
  
  if (train) {
    console.log('✅ Successfully built train:', {
      tripId: train.tripId,
      vehicleId: train.vehicleId,
      currentStop: train.currentStop?.stopName,
      currentStopSequence: train.currentStop?.stopSequence,
      status: train.currentStop?.status,
      statusName: train.currentStop?.statusName,
      stopsCount: train.stops.length,
      pastStops: train.stops.filter(s => s.status === 'past').length,
      currentStops: train.stops.filter(s => s.status === 'current').length,
      futureStops: train.stops.filter(s => s.status === 'future').length
    });
  } else {
    console.log('❌ Failed to build train');
    
    // Debug: Let's see what vehicles are available
    const vehicles = await gtfsRT.getVehiclePositions('N');
    console.log('Available vehicles:', vehicles?.slice(0, 3).map(v => ({
      id: v.id,
      tripId: v.vehicle.trip?.tripId,
      stopId: v.vehicle.stopId,
      status: v.vehicle.currentStatus
    })));
  }
} else {
  console.log('❌ No vehicles found');
}