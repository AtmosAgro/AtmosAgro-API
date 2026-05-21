import { ArtefatosRepository } from '../../repositories/artefatos/artefatos.repository';
import { PropriedadeService } from '../propriedades/propriedades.service';
import { StorageClient, storageClient } from '../../integrations/storage/storage.client';
import { ForbiddenError, NotFoundError } from '../../common/errors/application-error';
import { parseCaminho, gerarIdentificador } from '../../utils/artefatos.utils';

export class ArtefatosService {
  constructor(
    private readonly artefatosRepository: ArtefatosRepository = new ArtefatosRepository(),
    private readonly propriedadeService: PropriedadeService = new PropriedadeService(),
    private readonly storage: StorageClient = storageClient
  ) {}

  /**
   * Formata a resposta do artefato, ocultando o caminho interno do GCS.
   * Expõe o identificador semântico e a URL de download via proxy.
   */
  private formatResponse(art: any) {
    // Tenta usar o identificador já salvo; se não existir, gera a partir do caminho
    const identificador =
      art.identificador ||
      (art.caminho ? ((() => {
        const parsed = parseCaminho(art.caminho);
        return parsed ? gerarIdentificador(parsed.propriedadeId, parsed.data, parsed.indice) : null;
      })()) : null) ||
      art.id;

    // Extrai data e índice do caminho como fallback para campos não preenchidos no banco
    let dataReferencia = art.dataReferencia ?? null;
    let indice = art.indice ?? null;
    if (art.caminho && (!dataReferencia || !indice)) {
      const parsed = parseCaminho(art.caminho);
      if (parsed) {
        if (!dataReferencia) dataReferencia = new Date(parsed.data).toISOString();
        if (!indice) indice = parsed.indice;
      }
    }

    const { caminho: _caminho, ...semCaminho } = art; // remove caminho do response

    return {
      ...semCaminho,
      identificador,
      dataReferencia,
      indice,
      url: `/api/artefatos/${identificador}/signed-url`,
    };
  }

  /**
   * Lista todos os artefatos de uma propriedade (ou seus talhões)
   */
  async listByPropriedade(propriedadeId: string, authClienteId: string) {
    // Valida se a propriedade pertence ao cliente
    await this.propriedadeService.findById(propriedadeId, authClienteId);

    const artefatos = await this.artefatosRepository.findByPropriedadeId(propriedadeId);

    return artefatos.map((art) => this.formatResponse(art));
  }

  /**
   * Lista todos os artefatos vinculados ao cliente
   */
  async listByCliente(authClienteId: string) {
    const artefatos = await this.artefatosRepository.findByClienteId(authClienteId);

    return artefatos.map((art) => this.formatResponse(art));
  }

  /**
   * Retorna metadados de um artefato específico com URL (Proxy).
   */
  async getById(artefatoId: string, authClienteId: string) {
    const artefato = await this.artefatosRepository.findById(artefatoId);

    if (!artefato) {
      throw new NotFoundError('Artefato não encontrado');
    }

    // Tenancy: Verifica tanto no talhão quanto diretamente na propriedade
    const artefatosClienteId = artefato.talhao?.propriedade?.clienteId || artefato.propriedade?.clienteId;
    
    if (artefatosClienteId !== authClienteId) {
      throw new ForbiddenError('Acesso negado a este artefato');
    }
    
    return this.formatResponse(artefato);
  }

  /**
   * Gera uma Signed URL temporária (15 min) para o arquivo no GCS, validando tenancy.
   * O frontend usa esta URL diretamente para carregar o GeoTIFF sem passar pela API.
   */
  async getSignedUrl(artefatoId: string, authClienteId: string): Promise<{ signedUrl: string; expiresAt: string }> {
    const artefato = await this.artefatosRepository.findById(artefatoId);

    if (!artefato) throw new NotFoundError('Artefato não encontrado');

    const artefatosClienteId =
      artefato.talhao?.propriedade?.clienteId || artefato.propriedade?.clienteId;

    if (artefatosClienteId !== authClienteId) {
      throw new ForbiddenError('Acesso negado a este artefato');
    }

    const TTL_SECONDS = 15 * 60; // 15 minutos
    const signedUrl = await this.storage.getSignedUrl(artefato.caminho, TTL_SECONDS);
    const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000).toISOString();

    return { signedUrl, expiresAt };
  }

  /**
   * Baixa o arquivo do GCS como Buffer, após validar tenancy.
   * Usado como fallback quando não dá para assinar URLs (ex: ADC com user creds em dev local).
   */
  async getDownloadBuffer(artefatoId: string, authClienteId: string) {
    const artefato = await this.artefatosRepository.findById(artefatoId);

    if (!artefato) throw new NotFoundError('Artefato não encontrado');

    const artefatosClienteId =
      artefato.talhao?.propriedade?.clienteId || artefato.propriedade?.clienteId;

    if (artefatosClienteId !== authClienteId) {
      throw new ForbiddenError('Acesso negado a este artefato');
    }

    const buffer = await this.storage.downloadBuffer(artefato.caminho);
    const contentType = artefato.caminho.endsWith('.tif') || artefato.caminho.endsWith('.tiff')
      ? 'image/tiff'
      : 'application/octet-stream';

    return { buffer, contentType };
  }

}
