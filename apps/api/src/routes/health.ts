import { Router } from 'express';
import type { Request, Response } from 'express';
import { SuccessResponse } from '@what-train/shared';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
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

export default router;