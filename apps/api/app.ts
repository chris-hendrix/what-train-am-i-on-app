import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { ApiResponse, Line } from '@what-train/shared';

const app = express();

// Simple CORS middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/hello', (_req: Request, res: Response) => {
  // Return a sample MTA Line object with proper typing
  const sampleLine: Line = {
    name: '6 Express',
    code: '6',
    color: '#00933C'
  };
  
  const response: ApiResponse<Line> = {
    success: true,
    data: sampleLine,
    timestamp: new Date().toISOString()
  };
  
  res.json(response);
});

export default app;