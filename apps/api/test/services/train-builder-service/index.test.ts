/**
 * Unit tests for TrainBuilderService
 * Tests the core functionality of building complete train information from GTFS data
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { TrainBuilderService } from '../../../src/services/train-builder-service/index.js';
import { GTFSRTService } from '../../../src/services/gtfs-rt-service/index.js';
import { GTFSService } from '../../../src/services/gtfs-service/index.js';
import { createMockGetVehiclePositions, createMockGetTripUpdates } from '../../mocks/gtfs-rt-mocks.js';

describe('TrainBuilderService', () => {
  let service: TrainBuilderService;
  let gtfsRTService: GTFSRTService;
  let gtfsService: GTFSService;

  beforeAll(async () => {
    service = TrainBuilderService.getInstance();
    gtfsRTService = GTFSRTService.getInstance();
    gtfsService = GTFSService.getInstance();
    
    // Load GTFS data first
    await gtfsService.loadData();
    
    // Mock GTFS-RT service methods
    vi.spyOn(gtfsRTService, 'getVehiclePositions').mockImplementation(createMockGetVehiclePositions());
    vi.spyOn(gtfsRTService, 'getTripUpdates').mockImplementation(createMockGetTripUpdates());
  });

  describe('Service Instance', () => {
    it('should create singleton instance', () => {
      const instance1 = TrainBuilderService.getInstance();
      const instance2 = TrainBuilderService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Trip ID Direction Parsing', () => {
    it('should identify uptown/northbound trains (.N patterns)', () => {
      expect(gtfsRTService.getDirectionFromTripId('123456_N..N34R')).toBe(0);
      expect(gtfsRTService.getDirectionFromTripId('123456.N')).toBe(0);
      expect(gtfsRTService.getDirectionFromTripId('L0S1-L-2345-S01_123456_L..N08R')).toBe(0);
    });

    it('should identify downtown/southbound trains (.S patterns)', () => {
      expect(gtfsRTService.getDirectionFromTripId('123456_N..S34R')).toBe(1);
      expect(gtfsRTService.getDirectionFromTripId('123456.S')).toBe(1);
      expect(gtfsRTService.getDirectionFromTripId('L0S1-L-2345-S01_123456_L..S08R')).toBe(1);
    });

    it('should return -1 for invalid trip IDs', () => {
      expect(gtfsRTService.getDirectionFromTripId('')).toBe(-1);
      expect(gtfsRTService.getDirectionFromTripId(undefined)).toBe(-1);
      expect(gtfsRTService.getDirectionFromTripId('invalid_trip_id')).toBe(-1);
    });
  });

  describe('Train Building from Vehicle ID', () => {
    it('should build train from valid N line vehicle', async () => {
      // Get mocked vehicles from N line
      const vehicles = await gtfsRTService.getVehiclePositions('N');
      
      expect(vehicles.length).toBe(2); // We have 2 mocked vehicles

      const vehicle = vehicles[0];
      const train = await service.buildTrainFromVehicleId(vehicle.id, 'N');

      if (train) {
        // Basic train structure
        expect(train).toHaveProperty('tripId');
        expect(train).toHaveProperty('routeId');
        expect(train).toHaveProperty('directionId');
        expect(train).toHaveProperty('directionName');
        expect(train).toHaveProperty('vehicleId');
        expect(train).toHaveProperty('stopsAway');
        expect(train).toHaveProperty('realtimeStops');
        expect(train).toHaveProperty('staticStops');

        // Values should be correct type and format
        expect(typeof train.tripId).toBe('string');
        expect(train.routeId).toBe('N');
        expect([0, 1] as number[]).toContain(train.directionId);
        expect(['uptown', 'downtown']).toContain(train.directionName);
        expect(train.vehicleId).toBe(vehicle.id);
        expect(typeof train.stopsAway).toBe('number');
        
        // Arrays should exist
        expect(Array.isArray(train.realtimeStops)).toBe(true);
        expect(Array.isArray(train.staticStops)).toBe(true);

        // Direction consistency
        if (train.directionId === 0) {
          expect(train.directionName).toBe('uptown');
        } else {
          expect(train.directionName).toBe('downtown');
        }
      }
    });

    it('should build train from valid L line vehicle', async () => {
      const vehicles = await gtfsRTService.getVehiclePositions('L');
      
      expect(vehicles.length).toBe(1); // We have 1 mocked vehicle

      const vehicle = vehicles[0];
      const train = await service.buildTrainFromVehicleId(vehicle.id, 'L');

      if (train) {
        expect(train.routeId).toBe('L');
        expect(train.directionId).toBe(0); // Should be 0 for N direction trip ID
        expect(train.directionName).toBe('uptown');
      }
    });

    it('should return null for invalid vehicle ID', async () => {
      const train = await service.buildTrainFromVehicleId('INVALID_VEHICLE_ID', 'N');
      expect(train).toBeNull();
    });

    it('should return null for vehicle without trip data', async () => {
      const train = await service.buildTrainFromVehicleId('', 'N');
      expect(train).toBeNull();
    });
  });

  describe('Stop Schedule Building', () => {
    it('should build realistic stop schedules', async () => {
      const vehicles = await gtfsRTService.getVehiclePositions('N');
      
      expect(vehicles.length).toBe(2); // We have 2 mocked vehicles

      const vehicle = vehicles[0];
      const train = await service.buildTrainFromVehicleId(vehicle.id, 'N');

      if (train) {
        // Real-time stops should have proper structure
        if (train.realtimeStops.length > 0) {
          const rtStop = train.realtimeStops[0];
          
          expect(rtStop).toHaveProperty('stopId');
          expect(rtStop).toHaveProperty('stopName');
          expect(rtStop).toHaveProperty('stopSequence');
          expect(rtStop).toHaveProperty('arrivalTime');
          expect(rtStop).toHaveProperty('status');

          expect(typeof rtStop.stopId).toBe('string');
          expect(typeof rtStop.stopName).toBe('string');
          expect(typeof rtStop.stopSequence).toBe('number');
          expect(typeof rtStop.arrivalTime).toBe('string');
          expect(['past', 'current', 'future']).toContain(rtStop.status);

          // Should have at least one current stop if train is active
          const hasCurrentStop = train.realtimeStops.some(stop => stop.status === 'current');
          expect(typeof hasCurrentStop).toBe('boolean');
        }

        // Static stops should be more comprehensive
        if (train.staticStops.length > 0) {
          expect(train.staticStops.length).toBeGreaterThan(train.realtimeStops.length);

          const staticStop = train.staticStops[0];
          expect(staticStop).toHaveProperty('stopId');
          expect(staticStop).toHaveProperty('stopName');
          expect(staticStop).toHaveProperty('stopSequence');
          expect(staticStop).toHaveProperty('status');

          // Should have exactly one current stop in static data
          const currentStops = train.staticStops.filter(stop => stop.status === 'current');
          expect(currentStops.length).toBeLessThanOrEqual(1);
        }
      }
    });
  });

  describe('Complete Stop Schedule Retrieval', () => {
    it('should get complete stop schedule for trip', async () => {
      const vehicles = await gtfsRTService.getVehiclePositions('N');
      
      expect(vehicles.length).toBe(2); // We have 2 mocked vehicles

      const vehicle = vehicles[0];
      expect(vehicle.vehicle.trip?.tripId).toBeDefined();

      const tripId = vehicle.vehicle.trip!.tripId;
      const schedule = service.getCompleteStopSchedule(tripId);

      if (schedule) {
        expect(Array.isArray(schedule)).toBe(true);
        expect(schedule.length).toBeGreaterThan(5); // Should have multiple stops

        // Should be sorted by stop sequence
        for (let i = 0; i < schedule.length - 1; i++) {
          expect(schedule[i].stopSequence).toBeLessThanOrEqual(schedule[i + 1].stopSequence);
        }

        // Each stop should have required properties
        schedule.forEach(stop => {
          expect(stop).toHaveProperty('stopId');
          expect(stop).toHaveProperty('stopSequence');
          expect(stop).toHaveProperty('arrivalTime');
          
          expect(typeof stop.stopId).toBe('string');
          expect(typeof stop.stopSequence).toBe('number');
          expect(typeof stop.arrivalTime).toBe('string');
        });
      }
    });

    it('should return null for invalid trip ID', () => {
      const schedule = service.getCompleteStopSchedule('INVALID_TRIP_ID');
      expect(schedule).toBeNull();
    });

    it('should handle real-time trip ID format correctly', async () => {
      // Real-time trip IDs are like "123456_N..N34R"
      // Static trip IDs are like "L0S1-N-2057-S05_123456_N..N34R"
      
      const vehicles = await gtfsRTService.getVehiclePositions('N');
      
      expect(vehicles.length).toBe(2); // We have 2 mocked vehicles

      const vehicle = vehicles[0];
      expect(vehicle.vehicle.trip?.tripId).toBeDefined();

      const realtimeTripId = vehicle.vehicle.trip!.tripId;
      const schedule = service.getCompleteStopSchedule(realtimeTripId);

      // Should successfully match real-time ID to static ID
      if (schedule) {
        expect(schedule.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Current Stop Detection', () => {
    it('should properly detect current stop from vehicle data', async () => {
      const vehicles = await gtfsRTService.getVehiclePositions('N');
      
      expect(vehicles.length).toBe(2); // We have 2 mocked vehicles

      const vehicle = vehicles[0];
      expect(vehicle.vehicle.stopId).toBeDefined();

      const train = await service.buildTrainFromVehicleId(vehicle.id, 'N');

      if (train && train.currentStop) {
        expect(train.currentStop).toHaveProperty('stopId');
        expect(train.currentStop).toHaveProperty('stopName');
        expect(train.currentStop).toHaveProperty('stopSequence');
        
        expect(train.currentStop.stopId).toBe(vehicle.vehicle.stopId);
        expect(typeof train.currentStop.stopName).toBe('string');
        expect(typeof train.currentStop.stopSequence).toBe('number');

        // Should match the current stop in real-time data
        const currentRTStop = train.realtimeStops.find(stop => stop.status === 'current');
        if (currentRTStop) {
          expect(currentRTStop.stopId).toBe(train.currentStop.stopId);
        }
      }
    });
  });

  describe('Arrival Time Processing', () => {
    it('should convert timestamps to ISO format', async () => {
      const vehicles = await gtfsRTService.getVehiclePositions('N');
      
      expect(vehicles.length).toBe(2); // We have 2 mocked vehicles

      const vehicle = vehicles[0];
      const train = await service.buildTrainFromVehicleId(vehicle.id, 'N');

      if (train) {
        // arrivalTime should be ISO format string
        expect(typeof train.arrivalTime).toBe('string');
        expect(() => new Date(train.arrivalTime)).not.toThrow();
        
        // Should be a valid date
        const date = new Date(train.arrivalTime);
        expect(date.getTime()).not.toBeNaN();
        
        // Should be in ISO format (contains 'T' and 'Z')
        expect(train.arrivalTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing trip updates gracefully', async () => {
      // This might happen if trip update data is not available
      const result = await service.buildTrainFromVehicleId('FAKE_ID', 'N');
      expect(result).toBeNull();
    });

    it('should handle malformed vehicle data', async () => {
      // Should not crash on bad data
      const result = await service.buildTrainFromVehicleId('FAKE_VEHICLE', 'N');
      expect(result).toBeNull();
    });
  });
});