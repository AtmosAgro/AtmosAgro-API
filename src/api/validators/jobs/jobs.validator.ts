import { NextFunction, Request, Response } from 'express';
import { validate } from '../../../middlewares/validation.middleware';
import { createJobSchema } from '../../../dtos/jobs/jobs.dto';

export class JobValidator {
  static createJob(req: Request, res: Response, next: NextFunction) {
    validate(req, res, createJobSchema, next);
  }
}
