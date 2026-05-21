import { Request, Response } from 'express';
import { ArtefatosService } from '../../../services/artefatos/artefatos.service';
import { UnauthorizedError } from '../../../common/errors/application-error';

export class ArtefatosController {
  constructor(private readonly artefatosService: ArtefatosService = new ArtefatosService()) {}

  /**
   * Lista todos os artefatos do cliente (todas as propriedades)
   */
  async listAll(req: Request, res: Response): Promise<Response> {
    if (!req.user || !req.user.clienteId) {
      throw new UnauthorizedError('Usuário não autenticado ou sem cliente associado.');
    }
    const artefatos = await this.artefatosService.listByCliente(req.user.clienteId);
    return res.status(200).json(artefatos);
  }

  async listByPropriedade(req: Request, res: Response): Promise<Response> {
    const { propriedadeId } = req.params;
    if (!req.user || !req.user.clienteId) {
      throw new UnauthorizedError('Usuário não autenticado ou não associado a um cliente.');
    }
    const artefatos = await this.artefatosService.listByPropriedade(propriedadeId.trim(), req.user.clienteId);
    return res.status(200).json(artefatos);
  }

  /**
   * Retorna os metadados e a Signed URL de um artefato específico (JSON)
   */
  async getById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (!req.user || !req.user.clienteId) {
      throw new UnauthorizedError('Usuário não autenticado ou não associado a um cliente.');
    }
    const artefato = await this.artefatosService.getById(id, req.user.clienteId);
    return res.status(200).json(artefato);
  }

  /**
   * Gera e retorna uma Signed URL temporária (15 min) para o arquivo no GCS.
   * Usado pelo frontend para carregar GeoTIFFs diretamente, sem passar pela API.
   * Em ambientes onde a assinatura falha (ADC com user creds), retorna a URL do proxy /download.
   */
  async getSignedUrl(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (!req.user || !req.user.clienteId) {
      throw new UnauthorizedError('Usuário não autenticado ou sem cliente associado.');
    }
    try {
      const result = await this.artefatosService.getSignedUrl(id, req.user.clienteId);
      return res.status(200).json(result);
    } catch (err) {
      const errName = (err as { name?: string })?.name;
      const isFallbackTrigger =
        errName === 'SigningError' ||
        errName === 'StorageUnsupported' ||
        (err as { code?: string | number })?.code === 'ENOENT' ||
        (err as { code?: string | number })?.code === 403;
      if (!isFallbackTrigger) throw err;
      // Fallback: retorna URL do proxy /download (relativa, segue cookie de sessão)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      return res.status(200).json({
        signedUrl: `/api/artefatos/${id}/download`,
        expiresAt,
      });
    }
  }

  /**
   * Baixa o arquivo do GCS pela API (proxy).
   */
  async download(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (!req.user || !req.user.clienteId) {
      throw new UnauthorizedError('Usuário não autenticado ou sem cliente associado.');
    }
    const { buffer, contentType } = await this.artefatosService.getDownloadBuffer(id, req.user.clienteId);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=900');
    res.setHeader('Content-Length', String(buffer.length));
    return res.status(200).send(buffer);
  }

}
