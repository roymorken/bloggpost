import { Controller, Get, Post, Param, Query, Body, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportGeneratorService } from './report-generator.service';
import * as fs from 'fs';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly service: ReportsService,
    private readonly generator: ReportGeneratorService,
  ) {}

  @Get()
  findAll(@Query('supplierId') supplierId?: string, @Query('jobId') jobId?: string) {
    return this.service.findAll({ supplierId, jobId });
  }

  @Post()
  create(@Body() body: { jobId: string; supplierId?: string; reportType?: string }) {
    return this.generator.generate(body.jobId, body.supplierId, body.reportType);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const report = await this.service.findById(id);
    if (!report?.filePath) throw new NotFoundException('Report file not found');
    if (!fs.existsSync(report.filePath)) throw new NotFoundException('Report file not found on disk');
    res.download(report.filePath);
  }
}
