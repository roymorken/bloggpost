import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../../database/entities';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly repo: Repository<Report>,
  ) {}

  findAll(query?: { supplierId?: string; jobId?: string }) {
    const where: Record<string, string> = {};
    if (query?.supplierId) where['supplierId'] = query.supplierId;
    if (query?.jobId) where['jobId'] = query.jobId;
    return this.repo.find({ where, order: { generatedAt: 'DESC' } });
  }

  findById(id: string) {
    return this.repo.findOneBy({ id });
  }

  create(data: Partial<Report>): Promise<Report> {
    return this.repo.save(this.repo.create(data));
  }
}
