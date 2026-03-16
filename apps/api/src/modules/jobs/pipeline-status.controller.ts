import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import {
  Job,
  BlogPostCheck,
  ExtractedLink,
  LandingPageSession,
  FlightSearchResult,
  Report,
  EmailLog,
} from '../../database/entities';

@Controller('pipeline')
export class PipelineStatusController {
  constructor(
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
    @InjectRepository(BlogPostCheck) private readonly checkRepo: Repository<BlogPostCheck>,
    @InjectRepository(ExtractedLink) private readonly linkRepo: Repository<ExtractedLink>,
    @InjectRepository(LandingPageSession) private readonly sessionRepo: Repository<LandingPageSession>,
    @InjectRepository(FlightSearchResult) private readonly flightRepo: Repository<FlightSearchResult>,
    @InjectRepository(Report) private readonly reportRepo: Repository<Report>,
    @InjectRepository(EmailLog) private readonly emailRepo: Repository<EmailLog>,
    @InjectQueue('url-check') private readonly urlCheckQueue: Queue,
    @InjectQueue('link-extraction') private readonly linkExtractionQueue: Queue,
    @InjectQueue('landing-page') private readonly landingPageQueue: Queue,
    @InjectQueue('flight-search') private readonly flightSearchQueue: Queue,
  ) {}

  @Get('status')
  async getStatus(@Query('jobId') jobId?: string) {
    const where = jobId ? { jobId } : {};

    const [
      queues,
      jobs,
      urlChecks,
      links,
      sessions,
      flights,
      reports,
      emails,
    ] = await Promise.all([
      this.getQueueCounts(),
      this.jobRepo.find({ order: { createdAt: 'DESC' }, take: 5 }),
      this.checkRepo.find({
        where,
        relations: ['blogPost', 'blogPost.supplier'],
        order: { checkedAt: 'DESC' },
        take: 20,
      }),
      this.linkRepo.find({
        where: jobId ? { blogPostCheck: { jobId } } : {},
        relations: ['blogPostCheck'],
        order: { checkedAt: 'DESC' },
        take: 20,
      }),
      this.sessionRepo.find({
        order: { startedAt: 'DESC' },
        take: 10,
      }),
      this.flightRepo.find({
        where,
        order: { capturedAt: 'DESC' },
        take: 20,
      }),
      this.reportRepo.find({
        where: jobId ? { jobId } : {},
        relations: ['supplier'],
        order: { generatedAt: 'DESC' },
        take: 10,
      }),
      this.emailRepo.find({
        relations: ['supplier', 'report'],
        order: { sentAt: 'DESC' },
        take: 10,
      }),
    ]);

    return {
      queues,
      jobs: jobs.map((j) => ({
        id: j.id,
        status: j.status,
        totalBlogPosts: j.totalBlogPosts,
        totalLinks: j.totalLinks,
        totalFlightSearches: j.totalFlightSearches,
        startedAt: j.startedAt,
        finishedAt: j.finishedAt,
      })),
      stages: {
        urlChecks: urlChecks.map((c) => ({
          id: c.id,
          url: c.originalUrl,
          status: c.statusCategory,
          httpStatus: c.httpStatus,
          responseTimeMs: c.responseTimeMs,
          checkedAt: c.checkedAt,
          supplierName: c.blogPost?.supplier?.supplierName ?? 'Unknown',
        })),
        linkExtraction: links.map((l) => ({
          id: l.id,
          url: l.linkUrl,
          anchorText: l.anchorText,
          status: l.statusCategory,
          checkedAt: l.checkedAt,
        })),
        landingPages: sessions.map((s) => ({
          id: s.id,
          status: s.status,
          durationSeconds: s.browseDurationSeconds,
          startedAt: s.startedAt,
          finishedAt: s.finishedAt,
          error: s.errorMessage,
        })),
        flightSearches: flights.map((f) => ({
          id: f.id,
          route: `${f.origin} → ${f.destination}`,
          price: f.priceAmount ? `${f.priceAmount} ${f.currency}` : null,
          status: f.status,
          capturedAt: f.capturedAt,
          error: f.errorMessage,
        })),
        reports: reports.map((r) => ({
          id: r.id,
          type: r.reportType,
          scope: r.reportScope,
          supplierName: r.supplier?.supplierName ?? 'All',
          generatedAt: r.generatedAt,
          hasFile: !!r.filePath,
        })),
        emails: emails.map((e) => ({
          id: e.id,
          to: e.recipients,
          subject: e.subject,
          status: e.status,
          supplierName: e.supplier?.supplierName ?? null,
          sentAt: e.sentAt,
          error: e.errorMessage,
        })),
      },
    };
  }

  private async getQueueCounts() {
    const queues = [
      { name: 'url-check', queue: this.urlCheckQueue },
      { name: 'link-extraction', queue: this.linkExtractionQueue },
      { name: 'landing-page', queue: this.landingPageQueue },
      { name: 'flight-search', queue: this.flightSearchQueue },
    ];

    const counts = await Promise.all(
      queues.map(async ({ name, queue }) => {
        const [waiting, active, completed, failed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
        ]);
        return { name, waiting, active, completed, failed };
      }),
    );

    return counts;
  }
}
