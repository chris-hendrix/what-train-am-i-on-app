/**
 * Common GTFS-RT mock data for testing
 * Provides consistent vehicle positions and trip updates for test suites
 */

export const mockVehiclePositions = {
  N: [
    {
      id: 'TEST_VEHICLE_1',
      vehicle: {
        trip: { tripId: '087700_N..N34R', routeId: 'N' },
        stopId: 'R18N',
        currentStopSequence: 19,
        currentStatus: '1',
        timestamp: { low: 1693843200, high: 0, unsigned: false }
      },
      feedLines: 'N',
      timestamp: { low: 1693843200, high: 0, unsigned: false }
    },
    {
      id: 'TEST_VEHICLE_2', 
      vehicle: {
        trip: { tripId: '089600_N..N34R', routeId: 'N' },
        stopId: 'R31N',
        currentStopSequence: 13,
        currentStatus: '1',
        timestamp: { low: 1693843260, high: 0, unsigned: false }
      },
      feedLines: 'N',
      timestamp: { low: 1693843260, high: 0, unsigned: false }
    }
  ],
  L: [
    {
      id: 'TEST_L_VEHICLE_1',
      vehicle: {
        trip: { tripId: '123456_L..N08R', routeId: 'L' },
        stopId: 'L06N',
        currentStopSequence: 8,
        currentStatus: '1',
        timestamp: { low: 1693843200, high: 0, unsigned: false }
      },
      feedLines: 'L',
      timestamp: { low: 1693843200, high: 0, unsigned: false }
    }
  ]
};

export const mockTripUpdates = {
  N: [
    {
      id: 'TEST_TRIP_1',
      tripUpdate: {
        trip: { tripId: '087700_N..N34R', routeId: 'N' },
        stopTimeUpdate: [
          {
            stopId: 'R18N',
            stopSequence: 32,
            arrival: { time: { low: 1693843200, high: 0, unsigned: false }, delay: 0 },
            departure: { time: { low: 1693843200, high: 0, unsigned: false }, delay: 0 }
          },
          {
            stopId: 'R17N',
            stopSequence: 33,
            arrival: { time: { low: 1693843320, high: 0, unsigned: false }, delay: 0 },
            departure: { time: { low: 1693843320, high: 0, unsigned: false }, delay: 0 }
          },
          {
            stopId: 'R16N',
            stopSequence: 34,
            arrival: { time: { low: 1693843440, high: 0, unsigned: false }, delay: 0 },
            departure: { time: { low: 1693843440, high: 0, unsigned: false }, delay: 0 }
          }
        ]
      },
      feedLines: 'N',
      timestamp: { low: 1693843200, high: 0, unsigned: false }
    },
    {
      id: 'TEST_TRIP_2',
      tripUpdate: {
        trip: { tripId: '089600_N..N34R', routeId: 'N' },
        stopTimeUpdate: [
          {
            stopId: 'R31N',
            stopSequence: 19,
            arrival: { time: { low: 1693843260, high: 0, unsigned: false }, delay: 0 },
            departure: { time: { low: 1693843260, high: 0, unsigned: false }, delay: 0 }
          },
          {
            stopId: 'R17N',
            stopSequence: 33,
            arrival: { time: { low: 1693843800, high: 0, unsigned: false }, delay: 0 },
            departure: { time: { low: 1693843800, high: 0, unsigned: false }, delay: 0 }
          }
        ]
      },
      feedLines: 'N',
      timestamp: { low: 1693843260, high: 0, unsigned: false }
    }
  ],
  L: [
    {
      id: 'TEST_L_TRIP_1',
      tripUpdate: {
        trip: { tripId: '123456_L..N08R', routeId: 'L' },
        stopTimeUpdate: [
          {
            stopId: 'L08N',
            stopSequence: 10,
            arrival: { time: { low: 1693843320, high: 0, unsigned: false }, delay: 0 },
            departure: { time: { low: 1693843320, high: 0, unsigned: false }, delay: 0 }
          }
        ]
      },
      feedLines: 'L',
      timestamp: { low: 1693843200, high: 0, unsigned: false }
    }
  ]
};

/**
 * Creates a mock implementation for GTFSRTService.getVehiclePositions
 */
export const createMockGetVehiclePositions = () => {
  return async (lineCode: string) => {
    return mockVehiclePositions[lineCode as keyof typeof mockVehiclePositions] || [];
  };
};

/**
 * Creates a mock implementation for GTFSRTService.getTripUpdates
 */
export const createMockGetTripUpdates = () => {
  return async (lineCode: string) => {
    return mockTripUpdates[lineCode as keyof typeof mockTripUpdates] || [];
  };
};