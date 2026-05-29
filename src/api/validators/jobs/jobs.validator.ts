import { NextFunction, Request, Response } from 'express';
import { validate } from '../../../middlewares/validation.middleware';
import {
  createBatchJobSchema,
  createJobSchema,
  listJobsQuerySchema,
} from '../../../dtos/jobs/jobs.dto';

export class JobValidator {
  static createJob(req: Request, res: Response, next: NextFunction) {
    validate(req, res, createJobSchema, next);
  }

  static createBatchJob(req: Request, res: Response, next: NextFunction) {
    validate(req, res, createBatchJobSchema, next);
  }

  static listJobsQuery(req: Request, res: Response, next: NextFunction) {
    validate(req, res, listJobsQuerySchema, next, 'query');
  }
}
