import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { GTFSService } from './services/gtfs-service/index.js';
import healthRoutes from './routes/health.js';
import appRoutes from './routes/index.js';

const app = express();
const gtfsService = GTFSService.getInstance();

// Initialize GTFS data on startup
gtfsService.loadData().catch(console.error);

// Simple CORS middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// JSON parsing middleware
app.use(express.json());

// Route handlers
app.use('/', healthRoutes);
app.use('/', appRoutes);

export default app;