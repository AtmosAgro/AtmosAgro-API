import { NextFunction, Request, Response } from 'express';
import { validate } from '../../../middlewares/validation.middleware';
import { scenesAvailableQuerySchema } from '../../../dtos/scenes/scenes.dto';
import { paramsPropriedadeIdSchema } from '../../../dtos/propriedades/propriedades.dto';

export class ScenesValidator {
  static validatePropriedadeId(req: Request, res: Response, next: NextFunction) {
    validate(req, res, paramsPropriedadeIdSchema, next, 'params');
  }

  static validateAvailableQuery(req: Request, res: Response, next: NextFunction) {
    validate(req, res, scenesAvailableQuerySchema, next, 'query');
  }
}
