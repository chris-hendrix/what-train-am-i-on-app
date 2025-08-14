import { Router } from 'express';
import healthRouter from './health.js';
import routesRouter from './routes.js';
import trainsRouter from './trains.js';

const router = Router();

router.use(healthRouter);
router.use(routesRouter);
router.use(trainsRouter);

export default router;