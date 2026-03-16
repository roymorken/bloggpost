import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report, BlogPostCheck, ExtractedLink, FlightSearchResult, Supplier } from '../../database/entities';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PdfService } from './pdf.service';
import { ReportGeneratorService } from './report-generator.service';

@Module({
  imports: [TypeOrmModule.forFeature([Report, BlogPostCheck, ExtractedLink, FlightSearchResult, Supplier])],
  controllers: [ReportsController],
  providers: [ReportsService, PdfService, ReportGeneratorService],
  exports: [ReportsService, ReportGeneratorService],
})
export class ReportsModule {}
