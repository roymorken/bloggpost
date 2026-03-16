import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlightSearchResult } from '../../database/entities';

@Injectable()
export class FlightSearchService {
  constructor(
    @InjectRepository(FlightSearchResult)
    private readonly repo: Repository<FlightSearchResult>,
  ) {}

  async findAll(query: {
    supplierId?: string;
    route?: string;
    minPrice?: number;
    maxPrice?: number;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) {
    const qb = this.repo
      .createQueryBuilder('fsr')
      .leftJoinAndSelect('fsr.supplier', 'supplier')
      .leftJoinAndSelect('fsr.blogPost', 'blogPost')
      .orderBy('fsr.capturedAt', 'DESC');

    if (query.supplierId) qb.andWhere('fsr.supplier_id = :sid', { sid: query.supplierId });
    if (query.route) {
      const [origin, dest] = query.route.split('-');
      if (origin) qb.andWhere('fsr.origin = :origin', { origin });
      if (dest) qb.andWhere('fsr.destination = :dest', { dest });
    }
    if (query.minPrice) qb.andWhere('fsr.price_amount >= :min', { min: query.minPrice });
    if (query.maxPrice) qb.andWhere('fsr.price_amount <= :max', { max: query.maxPrice });
    if (query.from) qb.andWhere('fsr.captured_at >= :from', { from: query.from });
    if (query.to) qb.andWhere('fsr.captured_at <= :to', { to: query.to });

    const page = query.page || 1;
    const pageSize = query.pageSize || 50;
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, pageSize };
  }
}
