import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job as BullJob } from 'bullmq';
import { Repository } from 'typeorm';
import { BlogPostCheck, Job } from '../../../database/entities';

interface UrlCheckJobData {
  jobId: string;
  blogPostId: string;
  url: string;
  supplierId: string;
  autoGenerateReports?: boolean;
  autoSendEmails?: boolean;
}

@Processor('url-check', { concurrency: 5 })
export class UrlCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(UrlCheckProcessor.name);

  constructor(
    @InjectRepository(BlogPostCheck)
    private readonly checkRepo: Repository<BlogPostCheck>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectQueue('link-extraction')
    private readonly linkExtractionQueue: Queue,
  ) {
    super();
  }

  async process(job: BullJob<UrlCheckJobData>): Promise<void> {
    const { jobId, blogPostId, url, supplierId } = job.data;
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      clearTimeout(timeout);
      const responseTimeMs = Date.now() - startTime;
      const finalUrl = response.url;
      const httpStatus = response.status;

      let statusCategory: string;
      if (httpStatus >= 200 && httpStatus < 300) {
        statusCategory = 'active';
      } else if (httpStatus === 404) {
        statusCategory = 'not_found';
      } else if (httpStatus >= 300 && httpStatus < 400) {
        statusCategory = 'redirected';
      } else if (httpStatus >= 500) {
        statusCategory = 'server_error';
      } else {
        statusCategory = 'unknown_error';
      }

      const isRedirected = finalUrl !== url && httpStatus >= 200 && httpStatus < 300;
      if (isRedirected) statusCategory = 'redirected';

      const check = await this.checkRepo.save(
        this.checkRepo.create({
          jobId,
          blogPostId,
          originalUrl: url,
          finalUrl,
          httpStatus,
          statusCategory,
          responseTimeMs,
          checkedAt: new Date(),
        }),
      );

      this.logger.log(`URL check: ${url} -> ${statusCategory} (${httpStatus}) in ${responseTimeMs}ms`);

      // If URL is active, queue link extraction
      if (statusCategory === 'active' || statusCategory === 'redirected') {
        await this.linkExtractionQueue.add('extract-links', {
          jobId,
          blogPostCheckId: check.id,
          url: finalUrl || url,
          supplierId,
          blogPostId,
        });
      }
    } catch (error: unknown) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isTimeout = errorMessage.includes('abort');

      await this.checkRepo.save(
        this.checkRepo.create({
          jobId,
          blogPostId,
          originalUrl: url,
          httpStatus: null,
          statusCategory: isTimeout ? 'timeout' : 'unknown_error',
          responseTimeMs,
          checkedAt: new Date(),
          errorMessage,
        }),
      );

      this.logger.warn(`URL check failed: ${url} - ${errorMessage}`);
    }
  }
}
