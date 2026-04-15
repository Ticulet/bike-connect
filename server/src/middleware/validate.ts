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
    // Replace source data with the parsed (and coerced) result
    req[source] = result.data as typeof req[typeof source];
    next();
  };
}
