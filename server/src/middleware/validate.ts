import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ApiError } from '../lib/api-error.js';

type RequestSource = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, source: RequestSource) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(ApiError.badRequest('Validation failed', result.error.flatten()));
      return;
    }
    // Express 5: req.query is a read-only getter, so use defineProperty.
    // body and params remain regular writable properties.
    Object.defineProperty(req, source, {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    next();
  };
}
