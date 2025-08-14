import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { GTFSService } from './services/gtfs-service/index.js';
import appRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

const app = express();
const gtfsService = GTFSService.getInstance();

// Initialize GTFS data on startup
gtfsService.loadData().catch(console.error);

// CORS middleware with proper configuration
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (_req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// JSON parsing middleware  
app.use(express.json());

// Route handlers
app.use('/', appRoutes);

// Error handling middleware (must be after routes)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;