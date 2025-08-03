// MTA domain types

/**
 * MTA train line information
 */
export interface Line {
  id: string;
  name: string;
  code: string;
  color: string;
  type: 'subway' | 'bus' | 'lirr' | 'mnr';
  isActive: boolean;
}

/**
 * Basic train information
 */
export interface Train {
  id: string;
  lineId: string;
  direction: 'N' | 'S' | 'E' | 'W';
  route: string;
  timestamp: string;
}