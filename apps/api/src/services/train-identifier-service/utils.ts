/**
 * Utilities for handling GTFS-RT data formats
 */

import { ProtobufLong } from '../gtfs-rt-service/types/index.js';

/**
 * Convert protobuf Long object to ISO string timestamp
 * Protobuf represents 64-bit integers as {low, high, unsigned} objects
 */
export function convertTimestamp(timestamp: ProtobufLong | undefined): string {
  if (!timestamp) return '';
  
  // Convert protobuf Long to number (assuming high is 0 for typical timestamps)
  const value = timestamp.high === 0 ? timestamp.low : (timestamp.high * 0x100000000) + timestamp.low;
  // Convert Unix timestamp (seconds) to ISO string
  return new Date(value * 1000).toISOString();
}