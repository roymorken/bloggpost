import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../../database/entities';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly repo: Repository<Supplier>,
  ) {}

  findAll(): Promise<Supplier[]> {
    return this.repo.find({ order: { supplierName: 'ASC' } });
  }

  findById(id: string): Promise<Supplier | null> {
    return this.repo.findOneBy({ id });
  }

  findOrCreateByName(name: string): Promise<Supplier> {
    return this.repo.findOneBy({ supplierName: name }).then((existing) => {
      if (existing) return existing;
      return this.repo.save(this.repo.create({ supplierName: name }));
    });
  }

  create(data: Partial<Supplier>): Promise<Supplier> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<Supplier>): Promise<Supplier> {
    await this.repo.update(id, data);
    return this.repo.findOneByOrFail({ id });
  }
}
