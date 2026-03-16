import { Controller, Get, Query } from '@nestjs/common';
import { FlightSearchService } from './flight-search.service';

@Controller('flight-prices')
export class FlightSearchController {
  constructor(private readonly service: FlightSearchService) {}

  @Get()
  findAll(
    @Query('supplierId') supplierId?: string,
    @Query('route') route?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.findAll({
      supplierId,
      route,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      from,
      to,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }
}
