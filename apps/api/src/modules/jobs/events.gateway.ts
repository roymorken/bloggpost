import { Controller, Sse, Param, Get, Query } from '@nestjs/common';
import { Observable, interval, map, switchMap, from } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobsService } from './jobs.service';
import { BlogPostCheck, Job } from '../../database/entities';

interface MessageEvent {
  data: string;
}

function mapCheck(c: BlogPostCheck) {
  return {
    id: c.id,
    url: c.originalUrl,
    finalUrl: c.finalUrl,
    httpStatus: c.httpStatus,
    statusCategory: c.statusCategory,
    responseTimeMs: c.responseTimeMs,
    checkedAt: c.checkedAt,
    errorMessage: c.errorMessage,
    supplierName: c.blogPost?.supplier?.supplierName ?? 'Unknown',
    supplierId: c.blogPost?.supplierId ?? null,
  };
}

@Controller('events')
export class EventsController {
  constructor(
    private readonly jobsService: JobsService,
    @InjectRepository(BlogPostCheck)
    private readonly checkRepo: Repository<BlogPostCheck>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
  ) {}

  @Sse('jobs/:id')
  jobProgress(@Param('id') id: string): Observable<MessageEvent> {
    return interval(2000).pipe(
      switchMap(() => from(this.jobsService.findById(id))),
      map((job) => ({
        data: JSON.stringify(
          job
            ? {
                id: job.id,
                status: job.status,
                totalBlogPosts: job.totalBlogPosts,
                totalLinks: job.totalLinks,
                totalFlightSearches: job.totalFlightSearches,
                startedAt: job.startedAt,
                finishedAt: job.finishedAt,
              }
            : { error: 'Job not found' },
        ),
      })),
    );
  }

  @Sse('live-checks')
  liveChecks(): Observable<MessageEvent> {
    return interval(2000).pipe(
      switchMap(() =>
        from(
          Promise.all([
            this.checkRepo.find({
              relations: ['blogPost', 'blogPost.supplier'],
              order: { checkedAt: 'DESC' },
              take: 50,
            }),
            this.jobRepo.find({ order: { createdAt: 'DESC' }, take: 5 }),
          ]),
        ),
      ),
      map(([checks, jobs]) => ({
        data: JSON.stringify({
          checks: checks.map(mapCheck),
          jobs: jobs.map((j) => ({
            id: j.id,
            status: j.status,
            totalBlogPosts: j.totalBlogPosts,
            startedAt: j.startedAt,
            finishedAt: j.finishedAt,
          })),
        }),
      })),
    );
  }

  @Get('live-checks/snapshot')
  async liveChecksSnapshot(
    @Query('supplierId') supplierId?: string,
    @Query('limit') limit?: string,
  ) {
    const where: Record<string, unknown> = {};
    if (supplierId) {
      where['blogPost'] = { supplierId };
    }

    const checks = await this.checkRepo.find({
      where,
      relations: ['blogPost', 'blogPost.supplier'],
      order: { checkedAt: 'DESC' },
      take: parseInt(limit || '50', 10),
    });

    return checks.map(mapCheck);
  }
}
