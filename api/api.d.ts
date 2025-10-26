/**
 * Type definitions for api.js module
 * This file provides TypeScript definitions for the Express app exported from api.js
 */

import { Request, Response, NextFunction } from 'express';

declare module './api.js' {
  const app: (req: Request, res: Response, next?: NextFunction) => void;
  export default app;
}
