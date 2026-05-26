import { Router } from 'express';
import { PropriedadeController } from '../../controllers/propriedades/propriedades.controller';
import { PropriedadeValidator } from '../../validators/propriedades/propriedades.validator';
import { TalhaoController } from '../../controllers/talhoes/talhoes.controller';
import { ScenesController } from '../../controllers/scenes/scenes.controller';
import { ScenesValidator } from '../../validators/scenes/scenes.validator';
import { authMiddleware } from '../../../middlewares/auth.middleware';

const router = Router();
const propriedadeController = new PropriedadeController();
const talhaoController = new TalhaoController();
const scenesController = new ScenesController();

router.post(
  '/',
  authMiddleware,
  PropriedadeValidator.createPropriedade,
  (req, res, next) => propriedadeController.create(req, res).catch(next)
);

router.get(
  '/',
  authMiddleware,
  (req, res, next) => propriedadeController.findAll(req, res).catch(next)
);

router.get(
  '/:id',
  authMiddleware,
  PropriedadeValidator.validateId,
  (req, res, next) => propriedadeController.findById(req, res).catch(next)
);

router.put(
  '/:id',
  authMiddleware,
  PropriedadeValidator.validateId,
  PropriedadeValidator.updatePropriedade,
  (req, res, next) => propriedadeController.update(req, res).catch(next)
);

router.delete(
  '/:id',
  authMiddleware,
  PropriedadeValidator.validateId,
  (req, res, next) => propriedadeController.delete(req, res).catch(next)
);

router.get(
  '/:propriedadeId/talhoes',
  authMiddleware,
  PropriedadeValidator.validatePropriedadeId,
  (req, _res, next) => {
    req.query.propriedadeId = req.params.propriedadeId;
    next();
  },
  (req, res, next) => talhaoController.findAll(req, res).catch(next)
);

router.get(
  '/:propriedadeId/scenes/available',
  authMiddleware,
  ScenesValidator.validatePropriedadeId,
  ScenesValidator.validateAvailableQuery,
  (req, res, next) => scenesController.listAvailable(req, res).catch(next)
);

export default router;
