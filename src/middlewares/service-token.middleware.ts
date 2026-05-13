import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '@common/errors/application-error';
import { env } from '@config/env';

export function serviceTokenMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers['x-service-token'];

  if (!token || token !== env.CORE_SERVICE_TOKEN) {
    return next(new UnauthorizedError('Token de serviço inválido ou ausente.'));
  }

  return next();
}
