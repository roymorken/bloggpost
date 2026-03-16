import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job as BullJob } from 'bullmq';
import { Repository } from 'typeorm';
import { ExtractedLink, BlogPostCheck, Job } from '../../../database/entities';
import { BrowserService } from '../../browser/browser.service';

interface LinkExtractionJobData {
  jobId: string;
  blogPostCheckId: string;
  url: string;
  supplierId: string;
  blogPostId: string;
}

@Processor('link-extraction', { concurrency: 3 })
export class LinkExtractionProcessor extends WorkerHost {
  private readonly logger = new Logger(LinkExtractionProcessor.name);

  constructor(
    @InjectRepository(ExtractedLink)
    private readonly linkRepo: Repository<ExtractedLink>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectQueue('landing-page')
    private readonly landingPageQueue: Queue,
    private readonly browserService: BrowserService,
  ) {
    super();
  }

  async process(job: BullJob<LinkExtractionJobData>): Promise<void> {
    const { jobId, blogPostCheckId, url, supplierId, blogPostId } = job.data;

    try {
      const { context, sessionId } = await this.browserService.createContext();
      const page = await context.newPage();

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2000);

      const links = await this.browserService.extractLinks(page);
      this.logger.log(`Extracted ${links.length} links from ${url}`);

      for (const link of links) {
        const saved = await this.linkRepo.save(
          this.linkRepo.create({
            blogPostCheckId,
            anchorText: link.anchorText,
            linkUrl: link.href,
            statusCategory: 'pending',
            checkedAt: new Date(),
          }),
        );

        // Queue landing page browsing for each extracted link
        await this.landingPageQueue.add('browse-landing', {
          jobId,
          extractedLinkId: saved.id,
          url: link.href,
          supplierId,
          blogPostId,
          proxySessionId: sessionId,
        });
      }

      await this.jobRepo.increment({ id: jobId }, 'totalLinks', links.length);
      await page.close();
      await context.close();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Link extraction failed for ${url}: ${message}`);
    }
  }
}
