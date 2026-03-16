import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job as BullJob } from 'bullmq';
import { Repository } from 'typeorm';
import { LandingPageSession, ExtractedLink } from '../../../database/entities';
import { BrowserService } from '../../browser/browser.service';

const BROWSE_DURATION_MS = 2 * 60 * 1000; // 2 minutes

interface LandingPageJobData {
  jobId: string;
  extractedLinkId: string;
  url: string;
  supplierId: string;
  blogPostId: string;
  proxySessionId: string | null;
}

@Processor('landing-page', { concurrency: 2 })
export class LandingPageProcessor extends WorkerHost {
  private readonly logger = new Logger(LandingPageProcessor.name);

  constructor(
    @InjectRepository(LandingPageSession)
    private readonly sessionRepo: Repository<LandingPageSession>,
    @InjectRepository(ExtractedLink)
    private readonly linkRepo: Repository<ExtractedLink>,
    @InjectQueue('flight-search')
    private readonly flightSearchQueue: Queue,
    private readonly browserService: BrowserService,
  ) {
    super();
  }

  async process(job: BullJob<LandingPageJobData>): Promise<void> {
    const { jobId, extractedLinkId, url, supplierId, blogPostId } = job.data;
    const startedAt = new Date();

    const session = await this.sessionRepo.save(
      this.sessionRepo.create({
        extractedLinkId,
        startedAt,
        browseDurationSeconds: 0,
        status: 'browsing',
      }),
    );

    try {
      const { context, sessionId } = await this.browserService.createContext();
      const page = await context.newPage();

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });

      // Check HTTP response for the link
      const response = await page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
      }));

      // Update the extracted link with final URL
      await this.linkRepo.update(extractedLinkId, {
        finalUrl: response.url,
        statusCategory: 'active',
        httpStatus: 200,
      });

      // Browse naturally for 2 minutes
      this.logger.log(`Browsing ${url} for 2 minutes...`);
      await this.browserService.browseNaturally(page, BROWSE_DURATION_MS);

      const finishedAt = new Date();
      const durationSeconds = Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000);

      await this.sessionRepo.update(session.id, {
        finishedAt,
        browseDurationSeconds: durationSeconds,
        proxySessionId: sessionId,
        status: 'completed',
      });

      // Only queue flight search for mondotickets.com landing pages
      if (response.url.includes('mondotickets.com')) {
        await this.flightSearchQueue.add('search-flights', {
          jobId,
          extractedLinkId,
          landingPageUrl: response.url,
          supplierId,
          blogPostId,
        });
      }

      await page.close();
      await context.close();

      this.logger.log(`Landing page browsing completed: ${url} (${durationSeconds}s)`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const isBlocked = message.includes('blocked') || message.includes('captcha') || message.includes('403');

      await this.sessionRepo.update(session.id, {
        finishedAt: new Date(),
        browseDurationSeconds: Math.round((Date.now() - startedAt.getTime()) / 1000),
        status: isBlocked ? 'blocked' : 'error',
        errorMessage: message,
      });

      await this.linkRepo.update(extractedLinkId, {
        statusCategory: isBlocked ? 'blocked' : 'unknown_error',
        errorMessage: message,
      });

      this.logger.warn(`Landing page failed: ${url} - ${message}`);
    }
  }
}
