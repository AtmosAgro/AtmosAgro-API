import { Router } from 'express';
import { JobsController } from '../../controllers/jobs/jobs.controller';
import { JobValidator } from '../../validators/jobs/jobs.validator';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { serviceTokenMiddleware } from '../../../middlewares/service-token.middleware';

const router = Router();
const jobsController = new JobsController();

router.post(
  '/',
  authMiddleware,
  (req, res, next) => jobsController.create(req, res).catch(next)
);

router.get(
  '/',
  authMiddleware,
  JobValidator.listJobsQuery,
  (req, res, next) => jobsController.list(req, res).catch(next)
);

router.get(
  '/:id',
  authMiddleware,
  (req, res, next) => jobsController.getById(req, res).catch(next)
);

router.post(
  '/:id/complete',
  serviceTokenMiddleware,
  (req, res, next) => jobsController.complete(req, res).catch(next)
);

router.post(
  '/:id/fail',
  serviceTokenMiddleware,
  (req, res, next) => jobsController.fail(req, res).catch(next)
);

export default router;
