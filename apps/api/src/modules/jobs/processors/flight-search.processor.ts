import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job as BullJob } from 'bullmq';
import { FlightSearchResult, Job } from '../../../database/entities';
import { BrowserService } from '../../browser/browser.service';
import { MondoticketsAdapter } from '../../flight-search/adapters/mondotickets.adapter';
import { FlightSearchAdapter } from '../../flight-search/adapters/flight-search.adapter';
import { FLIGHT_ROUTES, computeDates, formatDate } from '../../flight-search/routes.config';

interface FlightSearchJobData {
  jobId: string;
  extractedLinkId: string | null;
  landingPageUrl: string;
  supplierId: string;
  blogPostId: string;
}

@Processor('flight-search', { concurrency: 2 })
export class FlightSearchProcessor extends WorkerHost {
  private readonly logger = new Logger(FlightSearchProcessor.name);
  private readonly adapters: FlightSearchAdapter[];

  constructor(
    @InjectRepository(FlightSearchResult)
    private readonly resultRepo: Repository<FlightSearchResult>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    private readonly browserService: BrowserService,
  ) {
    super();
    this.adapters = [new MondoticketsAdapter()];
  }

  async process(job: BullJob<FlightSearchJobData>): Promise<void> {
    const { jobId, extractedLinkId, landingPageUrl, supplierId, blogPostId } = job.data;
    const { departDate, returnDate } = computeDates();

    // Find the right adapter — skip if no adapter matches
    const adapter = this.adapters.find((a) => a.canHandle(landingPageUrl));
    if (!adapter) {
      this.logger.log(`No flight search adapter for ${landingPageUrl} — skipping`);
      return;
    }

    for (const route of FLIGHT_ROUTES) {
      try {
        const { context } = await this.browserService.createContext();
        const page = await context.newPage();

        await page.goto(landingPageUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await page.waitForTimeout(3000);

        const hasForm = await adapter.detectSearchForm(page);
        if (!hasForm) {
          await this.saveResult({
            jobId, supplierId, blogPostId, extractedLinkId, landingPageUrl,
            route, departDate, returnDate,
            status: 'no_search_form',
            error: 'Search form not detected on page',
          });
          await page.close();
          await context.close();
          continue;
        }

        const result = await adapter.search(page, {
          origin: route.origin,
          originCode: route.originCode,
          destination: route.destination,
          destinationCode: route.destinationCode,
          departDate: formatDate(departDate),
          returnDate: formatDate(returnDate),
        });

        if (result.success && result.prices.length > 0) {
          for (const price of result.prices) {
            await this.saveResult({
              jobId, supplierId, blogPostId, extractedLinkId, landingPageUrl,
              route, departDate, returnDate,
              status: 'price_found',
              price,
            });
          }
          this.logger.log(
            `Found ${result.prices.length} prices for ${route.originCode}→${route.destinationCode}`,
          );
        } else {
          await this.saveResult({
            jobId, supplierId, blogPostId, extractedLinkId, landingPageUrl,
            route, departDate, returnDate,
            status: 'price_not_found',
            error: result.error,
          });
        }

        await page.close();
        await context.close();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Flight search error ${route.originCode}→${route.destinationCode}: ${message}`);

        await this.saveResult({
          jobId, supplierId, blogPostId, extractedLinkId, landingPageUrl,
          route, departDate, returnDate,
          status: 'unknown_error',
          error: message,
        });
      }
    }

    await this.jobRepo.increment({ id: jobId }, 'totalFlightSearches', FLIGHT_ROUTES.length);
  }

  private async saveResult(data: {
    jobId: string;
    supplierId: string;
    blogPostId: string;
    extractedLinkId: string | null;
    landingPageUrl: string;
    route: { origin: string; originCode: string; destination: string; destinationCode: string };
    departDate: Date;
    returnDate: Date;
    status: string;
    price?: { priceAmount: number; currency: string; providerName: string | null; resultRank: number };
    error?: string;
  }): Promise<void> {
    await this.resultRepo.save(
      this.resultRepo.create({
        jobId: data.jobId,
        supplierId: data.supplierId,
        blogPostId: data.blogPostId,
        extractedLinkId: data.extractedLinkId,
        landingPageUrl: data.landingPageUrl,
        origin: data.route.originCode,
        destination: data.route.destinationCode,
        departDate: data.departDate,
        returnDate: data.returnDate,
        tripLengthDays: 5,
        priceAmount: data.price?.priceAmount?.toString() ?? null,
        currency: data.price?.currency ?? null,
        providerName: data.price?.providerName ?? null,
        resultRank: data.price?.resultRank ?? null,
        capturedAt: new Date(),
        status: data.status,
        errorMessage: data.error ?? null,
      }),
    );
  }
}
