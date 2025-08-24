#!/usr/bin/env npx tsx

import { GTFSRTService } from '../index';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const line = process.argv[2];
if (!line) process.exit(1);

const service = GTFSRTService.getInstance();
const url = service['lineToUrlMap'].get(line);
if (!url) process.exit(1);

const data = await service['fetchFeed'](url);
if (!data) process.exit(1);

writeFileSync(join(__dirname, `gtfs-rt-feed-data-${line}.json`), JSON.stringify(data, null, 2));