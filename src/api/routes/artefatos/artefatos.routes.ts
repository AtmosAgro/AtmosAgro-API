import { Router } from 'express';
import { ArtefatosController } from '../../controllers/artefatos/artefatos.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';

const router = Router();
const artefatosController = new ArtefatosController();

/**
 * @route GET /api/artefatos
 * @desc Lista todos os artefatos vinculados ao cliente autenticado (todas as suas propriedades).
 */
router.get(
  '/',
  authMiddleware,
  (req, res, next) => artefatosController.listAll(req, res).catch(next)
);

/**
 * @route GET /api/artefatos/propriedade/:propriedadeId
 * @desc Lista todos os artefatos (GeoTIFFs, etc) de uma propriedade com URLs assinadas.
 */
router.get(
  '/propriedade/:propriedadeId',
  authMiddleware,
  (req, res, next) => artefatosController.listByPropriedade(req, res).catch(next)
);

/**
 * @route GET /api/artefatos/:id
 * @desc Retorna metadados e URL assinada de um único artefato.
 */
router.get(
  '/:id',
  authMiddleware,
  (req, res, next) => artefatosController.getById(req, res).catch(next)
);

/**
 * @route GET /api/artefatos/:id/signed-url
 * @desc Gera e retorna uma Signed URL temporária (15 min) para o arquivo no GCS.
 *       O frontend usa esta URL para carregar o GeoTIFF diretamente, sem intermediação.
 */
router.get(
  '/:id/signed-url',
  authMiddleware,
  (req, res, next) => artefatosController.getSignedUrl(req, res).catch(next)
);

export default router;
