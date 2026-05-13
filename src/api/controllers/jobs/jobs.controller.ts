import { Request, Response } from 'express';
import { JobsService } from '../../../services/jobs/jobs.service';
import { UnauthorizedError } from '../../../common/errors/application-error';
import { createJobSchema } from '../../../dtos/jobs/jobs.dto';
import { completeJobSchema, failJobSchema } from '../../../dtos/jobs/jobs-callback.dto';

export class JobsController {
  constructor(private readonly jobsService: JobsService = new JobsService()) {}

  async create(req: Request, res: Response): Promise<Response> {
    if (!req.user?.clienteId) {
      throw new UnauthorizedError('Usuário não autenticado ou sem cliente associado.');
    }

    const dto = createJobSchema.parse(req.body);
    const job = await this.jobsService.create(req.user.clienteId, dto);
    return res.status(201).json(job);
  }

  async list(req: Request, res: Response): Promise<Response> {
    if (!req.user?.clienteId) {
      throw new UnauthorizedError('Usuário não autenticado ou sem cliente associado.');
    }

    const jobs = await this.jobsService.listByCliente(req.user.clienteId);
    return res.status(200).json(jobs);
  }

  async getById(req: Request, res: Response): Promise<Response> {
    if (!req.user?.clienteId) {
      throw new UnauthorizedError('Usuário não autenticado ou sem cliente associado.');
    }

    const job = await this.jobsService.findById(req.params.id, req.user.clienteId);
    return res.status(200).json(job);
  }

  async complete(req: Request, res: Response): Promise<Response> {
    const dto = completeJobSchema.parse(req.body);
    const job = await this.jobsService.complete(req.params.id, dto);
    return res.status(200).json(job);
  }

  async fail(req: Request, res: Response): Promise<Response> {
    const dto = failJobSchema.parse(req.body);
    const job = await this.jobsService.fail(req.params.id, dto);
    return res.status(200).json(job);
  }
}
