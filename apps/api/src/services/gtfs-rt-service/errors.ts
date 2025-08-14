/**
 * GTFS-RT service specific errors
 */
export class GTFSRTError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'GTFSRTError';
  }
}

export class GTFSRTTimeoutError extends GTFSRTError {
  constructor(message: string = 'GTFS-RT request timed out') {
    super(message);
    this.name = 'GTFSRTTimeoutError';
  }
}

export class GTFSRTUnavailableError extends GTFSRTError {
  constructor(message: string = 'GTFS-RT service is unavailable') {
    super(message);
    this.name = 'GTFSRTUnavailableError';
  }
}