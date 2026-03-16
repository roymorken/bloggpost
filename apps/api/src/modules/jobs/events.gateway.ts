import { Controller, Sse, Param } from '@nestjs/common';
import { Observable, interval, map, switchMap, from } from 'rxjs';
import { JobsService } from './jobs.service';

interface MessageEvent {
  data: string;
}

@Controller('events')
export class EventsController {
  constructor(private readonly jobsService: JobsService) {}

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
}
