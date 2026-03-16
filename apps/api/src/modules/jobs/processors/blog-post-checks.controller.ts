import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPostCheck } from '../../../database/entities';

@Controller('blog-post-checks')
export class BlogPostChecksController {
  constructor(
    @InjectRepository(BlogPostCheck)
    private readonly repo: Repository<BlogPostCheck>,
  ) {}

  @Get()
  async findAll(
    @Query('supplierId') supplierId?: string,
    @Query('statusCategory') statusCategory?: string,
    @Query('jobId') jobId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const qb = this.repo
      .createQueryBuilder('check')
      .leftJoinAndSelect('check.blogPost', 'bp')
      .leftJoinAndSelect('bp.supplier', 'supplier')
      .orderBy('check.checkedAt', 'DESC');

    if (supplierId) qb.andWhere('bp.supplier_id = :sid', { sid: supplierId });
    if (statusCategory) qb.andWhere('check.status_category = :sc', { sc: statusCategory });
    if (jobId) qb.andWhere('check.job_id = :jid', { jid: jobId });
    if (from) qb.andWhere('check.checked_at >= :from', { from });
    if (to) qb.andWhere('check.checked_at <= :to', { to });

    const p = page ? parseInt(page, 10) : 1;
    const ps = pageSize ? parseInt(pageSize, 10) : 50;
    qb.skip((p - 1) * ps).take(ps);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page: p, pageSize: ps };
  }
}
