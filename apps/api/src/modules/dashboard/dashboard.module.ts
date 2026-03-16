import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier, BlogPost, BlogPostCheck, ExtractedLink, FlightSearchResult, Job } from '../../database/entities';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier, BlogPost, BlogPostCheck, ExtractedLink, FlightSearchResult, Job])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
