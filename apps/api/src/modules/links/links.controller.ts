import { Controller, Get, Query } from '@nestjs/common';
import { LinksService } from './links.service';

@Controller('links')
export class LinksController {
  constructor(private readonly service: LinksService) {}

  @Get()
  findAll(
    @Query('supplierId') supplierId?: string,
    @Query('statusCategory') statusCategory?: string,
    @Query('blogPostId') blogPostId?: string,
    @Query('jobId') jobId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.findAll({
      supplierId,
      statusCategory,
      blogPostId,
      jobId,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }
}
