#!/usr/bin/env tsx

/**
 * Quick test of a single MTA GTFS-RT feed to verify URL encoding works
 */

import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

async function testSingleFeed() {
  console.log('🚇 Testing single MTA GTFS-RT feed...\n');

  const testUrl = 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace';
  
  try {
    console.log(`Fetching: ${testUrl}`);
    const response = await fetch(testUrl);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
      
      console.log(`✅ Success! Found ${feed.entity.length} entities in feed`);
      
      // Count different entity types
      let vehicles = 0, tripUpdates = 0, alerts = 0;
      feed.entity.forEach(entity => {
        if (entity.vehicle) vehicles++;
        if (entity.tripUpdate) tripUpdates++;
        if (entity.alert) alerts++;
      });
      
      console.log(`   - Vehicle positions: ${vehicles}`);
      console.log(`   - Trip updates: ${tripUpdates}`);
      console.log(`   - Alerts: ${alerts}`);
      
    } else {
      console.log(`❌ Failed: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSingleFeed();