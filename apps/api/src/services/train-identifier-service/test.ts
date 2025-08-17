#!/usr/bin/env npx tsx

// npx tsx apps/api/src/services/train-identifier-service/test.ts

import { TrainIdentifierService } from './index.js';

const service = TrainIdentifierService.getInstance();

// Test with future timestamp to see trainsBefore populated
const result = await service.identifyTrain({
  lineCode: 'N',
  direction: 1, 
  stopId: 'R08S',
  limit: 3
});

console.log(JSON.stringify(result, null, 2));