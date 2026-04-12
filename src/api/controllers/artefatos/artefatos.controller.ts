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
   */
  async getSignedUrl(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (!req.user || !req.user.clienteId) {
      throw new UnauthorizedError('Usuário não autenticado ou sem cliente associado.');
    }
    const result = await this.artefatosService.getSignedUrl(id, req.user.clienteId);
    return res.status(200).json(result);
  }

  /**
   * Fornece os bytes do arquivo diretamente (Proxy/Stream) sem expor URLs externas.
   */
  async download(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!req.user || !req.user.clienteId) {
      throw new UnauthorizedError('Usuário não autenticado ou sem cliente associado.');
    }

    const { stream, fileName, tipo } = await this.artefatosService.downloadStream(id, req.user.clienteId);

    // Configura os headers para o navegador entender que é um download de arquivo
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Mapeia tipos comuns se necessário (ex: geotiff -> image/tiff)
    const contentType = tipo === 'geotiff' ? 'image/tiff' : 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // Conecta o fluxo de dados do Google direto na resposta da nossa API
    stream.on('error', (_err) => {
      res.status(500).end('Erro ao baixar arquivo do storage.');
    });

    stream.pipe(res);
  }
}
