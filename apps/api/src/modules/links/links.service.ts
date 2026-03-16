import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtractedLink } from '../../database/entities';

@Injectable()
export class LinksService {
  constructor(
    @InjectRepository(ExtractedLink)
    private readonly repo: Repository<ExtractedLink>,
  ) {}

  async findAll(query: {
    supplierId?: string;
    statusCategory?: string;
    blogPostId?: string;
    jobId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const qb = this.repo
      .createQueryBuilder('link')
      .leftJoinAndSelect('link.blogPostCheck', 'check')
      .leftJoin('check.blogPost', 'bp')
      .leftJoin('bp.supplier', 'supplier')
      .orderBy('link.checkedAt', 'DESC');

    if (query.supplierId) qb.andWhere('bp.supplier_id = :sid', { sid: query.supplierId });
    if (query.statusCategory) qb.andWhere('link.status_category = :sc', { sc: query.statusCategory });
    if (query.blogPostId) qb.andWhere('check.blog_post_id = :bpid', { bpid: query.blogPostId });
    if (query.jobId) qb.andWhere('check.job_id = :jid', { jid: query.jobId });

    const page = query.page || 1;
    const pageSize = query.pageSize || 50;
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, pageSize };
  }
}
