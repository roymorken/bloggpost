import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly service: JobsService) {}

  @Post()
  create(@Body() body: { importBatchId: string; autoGenerateReports?: boolean; autoSendEmails?: boolean }) {
    return this.service.create(body.importBatchId, body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
}
