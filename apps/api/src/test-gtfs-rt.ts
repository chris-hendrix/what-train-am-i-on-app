#!/usr/bin/env tsx

/**
 * Test script for GTFS-RT Service
 * Run with: npx tsx src/test-gtfs-rt.ts
 */

import { GTFSRTService } from './services/gtfs-rt-service/index.js';

async function testGTFSRTService() {
  console.log('🚇 Testing MTA GTFS-RT Service...\n');

  const gtfsRTService = GTFSRTService.getInstance();

  try {
    console.log('1. Testing Vehicle Positions...');
    const vehicles = await gtfsRTService.getVehiclePositions();
    console.log(`✅ Found ${vehicles.length} active trains`);
    
    if (vehicles.length > 0) {
      const sample = vehicles[0];
      console.log(`   Sample: Train on ${sample.feedLines} - Trip ID: ${sample.vehicle?.trip?.tripId || 'N/A'}`);
    }
    console.log();

  } catch (error) {
    console.error('❌ Vehicle Positions failed:', error);
  }

  try {
    console.log('2. Testing Trip Updates...');
    const tripUpdates = await gtfsRTService.getTripUpdates(['6']);
    console.log(`✅ Found ${tripUpdates.length} trip updates for line 6`);
    
    if (tripUpdates.length > 0) {
      const sample = tripUpdates[0];
      console.log(`   Sample: Trip ${sample.tripUpdate?.trip?.tripId || 'N/A'} with ${sample.tripUpdate?.stopTimeUpdate?.length || 0} stop updates`);
    }
    console.log();

  } catch (error) {
    console.error('❌ Trip Updates failed:', error);
  }

  try {
    console.log('3. Testing Arrival Predictions for Times Square (R24)...');
    const predictions = await gtfsRTService.getArrivalPredictions('R24');
    console.log(`✅ Found ${predictions.length} arrival predictions`);
    
    predictions.slice(0, 3).forEach(pred => {
      console.log(`   ${pred.routeId} train arriving in ${pred.minutesUntilArrival} minutes`);
    });
    console.log();

  } catch (error) {
    console.error('❌ Arrival Predictions failed:', error);
  }

  try {
    console.log('4. Testing Trains Near Station (Times Square R24)...');
    const nearbyTrains = await gtfsRTService.getTrainsNearStation('R24', 2);
    console.log(`✅ Found ${nearbyTrains.length} trains near Times Square`);
    console.log();

  } catch (error) {
    console.error('❌ Trains Near Station failed:', error);
  }

  try {
    console.log('5. Testing Service Alerts...');
    const alerts = await gtfsRTService.getServiceAlerts(['6', 'N', 'Q', 'R', 'W']);
    console.log(`✅ Found ${alerts.length} service alerts for selected lines`);
    console.log();

  } catch (error) {
    console.error('❌ Service Alerts failed:', error);
  }

  console.log('6. Cache Stats:');
  const cacheStats = gtfsRTService.getCacheStats();
  console.log(`   Cache entries: ${cacheStats.size}`);
  console.log(`   Cached feeds: ${cacheStats.entries.join(', ')}`);

  console.log('\n✅ GTFS-RT Service test completed!');
}

// Run the test
testGTFSRTService().catch(console.error);