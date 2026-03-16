import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Job, BlogPost, BlogPostCheck, ExtractedLink, LandingPageSession, FlightSearchResult } from '../../database/entities';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { UrlCheckProcessor } from './processors/url-check.processor';
import { LinkExtractionProcessor } from './processors/link-extraction.processor';
import { LandingPageProcessor } from './processors/landing-page.processor';
import { FlightSearchProcessor } from './processors/flight-search.processor';
import { BlogPostChecksController } from './processors/blog-post-checks.controller';
import { EventsController } from './events.gateway';
import { PipelineStatusController } from './pipeline-status.controller';
import { BlogPostsModule } from '../blog-posts/blog-posts.module';
import { BrowserModule } from '../browser/browser.module';
import { Report, EmailLog } from '../../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, BlogPost, BlogPostCheck, ExtractedLink, LandingPageSession, FlightSearchResult, Report, EmailLog]),
    BullModule.registerQueue({ name: 'url-check' }),
    BullModule.registerQueue({ name: 'link-extraction' }),
    BullModule.registerQueue({ name: 'landing-page' }),
    BullModule.registerQueue({ name: 'flight-search' }),
    BlogPostsModule,
    BrowserModule,
  ],
  controllers: [JobsController, BlogPostChecksController, EventsController, PipelineStatusController],
  providers: [JobsService, UrlCheckProcessor, LinkExtractionProcessor, LandingPageProcessor, FlightSearchProcessor],
  exports: [JobsService],
})
export class JobsModule {}
