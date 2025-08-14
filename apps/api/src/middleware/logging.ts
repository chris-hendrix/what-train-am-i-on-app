import type { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware for debugging and monitoring
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] ${req.method} ${req.url} - Request received`, {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    body: req.method === 'POST' ? req.body : undefined
  });

  // Override res.json to log response
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    const duration = Date.now() - startTime;
    const responseTimestamp = new Date().toISOString();
    
    console.log(`[${responseTimestamp}] ${req.method} ${req.url} - Response sent`, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: (body as { success?: boolean })?.success ?? 'unknown'
    });
    
    return originalJson(body);
  };

  next();
};