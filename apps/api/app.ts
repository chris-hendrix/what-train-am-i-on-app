import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { 
  Line, 
  SuccessResponse
} from '@what-train/shared';

const app = express();

// Simple CORS middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  const response: SuccessResponse<{
    status: string;
    version: string;
    services: Record<string, string>;
  }> = {
    success: true,
    data: {
      status: 'ok',
      version: '1.0.0',
      services: {
        database: 'ok',
        mta: 'ok'
      }
    },
    timestamp: new Date().toISOString()
  };
  
  res.json(response);
});

app.get('/lines', (_req: Request, res: Response) => {
  // Return sample MTA Line objects with proper typing
  const sampleLines: Line[] = [
    {
      id: '6',
      name: '6 Express',
      code: '6',
      color: '#00933C',
      type: 'subway',
      isActive: true
    },
    {
      id: '4',
      name: '4 Express', 
      code: '4',
      color: '#00933C',
      type: 'subway',
      isActive: true
    }
  ];
  
  const response: SuccessResponse<{ lines: Line[] }> = {
    success: true,
    data: { lines: sampleLines },
    timestamp: new Date().toISOString()
  };
  
  res.json(response);
});

export default app;