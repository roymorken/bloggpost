import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlightSearchResult } from '../../database/entities';
import { FlightSearchController } from './flight-search.controller';
import { FlightSearchService } from './flight-search.service';

@Module({
  imports: [TypeOrmModule.forFeature([FlightSearchResult])],
  controllers: [FlightSearchController],
  providers: [FlightSearchService],
  exports: [FlightSearchService],
})
export class FlightSearchModule {}
