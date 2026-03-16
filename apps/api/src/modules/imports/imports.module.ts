import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportBatch, BlogPost } from '../../database/entities';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { SuppliersModule } from '../suppliers/suppliers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ImportBatch, BlogPost]),
    SuppliersModule,
  ],
  controllers: [ImportsController],
  providers: [ImportsService],
  exports: [ImportsService],
})
export class ImportsModule {}
