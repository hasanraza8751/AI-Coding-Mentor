import type { Express, Request, Response } from 'express';
import type { HealthResponse } from '../types';

/**
 * GET /health — liveness probe used by developers and (later) the extension.
 */
export function registerHealthRoutes(app: Express): void {
  app.get('/health', (_req: Request, res: Response) => {
    const body: HealthResponse = { status: 'ok' };
    res.status(200).json(body);
  });
}
