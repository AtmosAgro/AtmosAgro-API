import { Request, Response } from 'express';
import { ScenesService } from '@services/scenes/scenes.service';
import { UnauthorizedError } from '@common/errors/application-error';

export class ScenesController {
  constructor(private readonly scenesService: ScenesService = new ScenesService()) {}

  async listAvailable(req: Request, res: Response): Promise<Response> {
    if (!req.user?.clienteId) {
      throw new UnauthorizedError('Usuário não autenticado ou não associado a um cliente.');
    }
    const { propriedadeId } = req.params;
    const { from, to } = req.query as { from: string; to: string };

    const scenes = await this.scenesService.listAvailable(
      req.user.clienteId,
      propriedadeId,
      new Date(`${from}T00:00:00Z`),
      new Date(`${to}T00:00:00Z`),
    );

    return res.status(200).json({ scenes });
  }
}
