import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost, BlogPostCheck } from '../../database/entities';

@Injectable()
export class BlogPostsService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly repo: Repository<BlogPost>,
    @InjectRepository(BlogPostCheck)
    private readonly checkRepo: Repository<BlogPostCheck>,
  ) {}

  async findAll(query: {
    supplierId?: string;
    status?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }) {
    const qb = this.repo
      .createQueryBuilder('bp')
      .leftJoinAndSelect('bp.supplier', 'supplier')
      .orderBy('bp.createdAt', 'DESC');

    if (query.supplierId) qb.andWhere('bp.supplier_id = :sid', { sid: query.supplierId });
    if (query.q) qb.andWhere('bp.blog_post_url ILIKE :q', { q: `%${query.q}%` });

    const page = query.page || 1;
    const pageSize = query.pageSize || 50;
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, pageSize };
  }

  findById(id: string): Promise<BlogPost | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['supplier', 'checks'],
    });
  }

  findByBatchId(batchId: string): Promise<BlogPost[]> {
    return this.repo.find({ where: { importBatchId: batchId } });
  }
}
