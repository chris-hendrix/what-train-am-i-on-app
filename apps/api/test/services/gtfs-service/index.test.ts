/**
 * Unit tests for GTFSService
 * Tests the acceptance criteria for GitHub issue #9
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { GTFSService } from '../../../src/services/gtfs-service/index.js';

describe('GTFSService', () => {
  let gtfsService: GTFSService;

  beforeAll(async () => {
    gtfsService = GTFSService.getInstance();
    await gtfsService.loadData();
  });

  describe('Data Loading', () => {
    it('should load GTFS data successfully', () => {
      const stats = gtfsService.getStats();
      expect(stats.stops).toBeGreaterThan(1000);
      expect(stats.routes).toBeGreaterThan(25);
      expect(stats.trips).toBeGreaterThan(15000);
    });

    it('should have expected data structure', () => {
      const stats = gtfsService.getStats();
      expect(typeof stats.stops).toBe('number');
      expect(typeof stats.routes).toBe('number');
      expect(typeof stats.trips).toBe('number');
      expect(typeof stats.stopTimes).toBe('number');
    });
  });

  describe('findNearestStations', () => {
    it('should find nearest stations to Times Square', () => {
      const stations = gtfsService.findNearestStations(40.7589, -73.9851, 5);
      
      expect(stations).toHaveLength(5);
      expect(stations[0]).toHaveProperty('stopName');
      expect(stations[0]).toHaveProperty('distance');
      expect(stations[0].distance).toBeLessThan(500); // Should be close to a major station
      
      // Results should be sorted by distance
      for (let i = 1; i < stations.length; i++) {
        expect(stations[i].distance).toBeGreaterThanOrEqual(stations[i - 1].distance);
      }
    });

    it('should find nearest stations to Brooklyn Bridge area', () => {
      const stations = gtfsService.findNearestStations(40.7061, -73.9969, 3);
      
      expect(stations).toHaveLength(3);
      expect(stations[0].distance).toBeLessThan(1000); // Should find nearby stations
    });

    it('should return empty array when no limit specified', () => {
      const stations = gtfsService.findNearestStations(40.7589, -73.9851, 0);
      expect(stations).toHaveLength(0);
    });

    it('should handle edge coordinates', () => {
      // Test with coordinates outside NYC (should still return results)
      const stations = gtfsService.findNearestStations(41.0, -74.0, 1);
      expect(stations).toHaveLength(1);
      expect(stations[0].distance).toBeGreaterThan(10000); // Should be far
    });
  });

  describe('getRouteByLineCode', () => {
    const testLineCodes = ['1', '4', '6', 'N', 'Q', 'L', 'B', 'A'];

    testLineCodes.forEach(lineCode => {
      it(`should find route for line ${lineCode}`, () => {
        const routeInfo = gtfsService.getRouteByLineCode(lineCode);
        
        expect(routeInfo).not.toBeNull();
        expect(routeInfo!.route.routeShortName).toBe(lineCode);
        expect(routeInfo!.route.routeLongName).toBeTruthy();
        expect(routeInfo!.stops.length).toBeGreaterThan(10); // Reasonable number of stops
      });
    });

    it('should return null for invalid line code', () => {
      const routeInfo = gtfsService.getRouteByLineCode('INVALID');
      expect(routeInfo).toBeNull();
    });

    it('should return stops for valid routes', () => {
      const routeInfo = gtfsService.getRouteByLineCode('6');
      expect(routeInfo).not.toBeNull();
      expect(routeInfo!.stops.length).toBeGreaterThan(50); // 6 line has many stops
      
      // Verify stops have required properties
      routeInfo!.stops.forEach(stop => {
        expect(stop).toHaveProperty('stopId');
        expect(stop).toHaveProperty('stopName');
        expect(stop).toHaveProperty('stopLat');
        expect(stop).toHaveProperty('stopLon');
      });
    });
  });

  describe('getStopSequencesForRoute', () => {
    it('should return stop sequences for route 6', () => {
      const route6Info = gtfsService.getRouteByLineCode('6');
      expect(route6Info).not.toBeNull();
      
      const sequences = gtfsService.getStopSequencesForRoute(route6Info!.route.routeId);
      
      expect(sequences.length).toBeGreaterThanOrEqual(1); // At least one direction
      expect(sequences.length).toBeLessThanOrEqual(2); // At most two directions
      
      sequences.forEach(sequence => {
        expect(sequence).toHaveProperty('routeId');
        expect(sequence).toHaveProperty('directionId');
        expect(sequence).toHaveProperty('stops');
        expect(sequence.stops.length).toBeGreaterThan(10);
        
        // Verify stops are ordered by sequence
        for (let i = 1; i < sequence.stops.length; i++) {
          expect(sequence.stops[i].stopSequence).toBeGreaterThanOrEqual(
            sequence.stops[i - 1].stopSequence
          );
        }
      });
    });

    it('should return empty array for invalid route', () => {
      const sequences = gtfsService.getStopSequencesForRoute('INVALID_ROUTE');
      expect(sequences).toHaveLength(0);
    });
  });

  describe('getAllRoutes', () => {
    it('should return all routes', () => {
      const routes = gtfsService.getAllRoutes();
      
      expect(routes.length).toBeGreaterThan(25); // NYC has ~30 subway routes
      
      routes.forEach(route => {
        expect(route).toHaveProperty('routeId');
        expect(route).toHaveProperty('routeShortName');
        expect(route).toHaveProperty('routeLongName');
        expect(route).toHaveProperty('routeType');
      });
    });

    it('should include major subway lines', () => {
      const routes = gtfsService.getAllRoutes();
      const routeCodes = routes.map(r => r.routeShortName);
      
      // Test for some major lines
      expect(routeCodes).toContain('1');
      expect(routeCodes).toContain('4');
      expect(routeCodes).toContain('6');
      expect(routeCodes).toContain('N');
      expect(routeCodes).toContain('Q');
      expect(routeCodes).toContain('L');
    });
  });

  describe('Distance Calculations', () => {
    it('should calculate reasonable distances for NYC locations', () => {
      // Union Square coordinates
      const unionStations = gtfsService.findNearestStations(40.7359, -73.9911, 1);
      expect(unionStations[0].distance).toBeLessThan(200); // Should be very close
      
      // Times Square coordinates  
      const timesStations = gtfsService.findNearestStations(40.7589, -73.9851, 1);
      expect(timesStations[0].distance).toBeLessThan(200); // Should be very close
    });

    it('should return consistent results for same coordinates', () => {
      const result1 = gtfsService.findNearestStations(40.7589, -73.9851, 3);
      const result2 = gtfsService.findNearestStations(40.7589, -73.9851, 3);
      
      expect(result1).toEqual(result2);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid coordinates gracefully', () => {
      expect(() => {
        gtfsService.findNearestStations(NaN, -73.9851, 5);
      }).not.toThrow();
      
      expect(() => {
        gtfsService.findNearestStations(40.7589, NaN, 5);
      }).not.toThrow();
    });

    it('should handle extreme coordinates', () => {
      const stations = gtfsService.findNearestStations(90, 180, 1); // North Pole, 180° longitude
      expect(stations).toHaveLength(1);
      expect(stations[0].distance).toBeGreaterThan(1000000); // Very far
    });
  });
});