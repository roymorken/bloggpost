import { Page } from 'playwright';
import { Logger } from '@nestjs/common';
import {
  FlightSearchAdapter,
  FlightSearchParams,
  FlightSearchAdapterResult,
  FlightSearchPrice,
} from './flight-search.adapter';

export class MondoticketsAdapter implements FlightSearchAdapter {
  readonly name = 'mondotickets';
  private readonly logger = new Logger(MondoticketsAdapter.name);

  canHandle(url: string): boolean {
    return url.includes('mondotickets.com');
  }

  async detectSearchForm(page: Page): Promise<boolean> {
    // Always attempt search on mondotickets pages — the search widget
    // may be lazy-loaded and only visible after scrolling, which search() handles
    this.logger.log(`Will attempt flight search on: ${page.url()}`);
    return true;
  }

  async search(page: Page, params: FlightSearchParams): Promise<FlightSearchAdapterResult> {
    try {
      this.logger.log(`Searching ${params.originCode} → ${params.destinationCode} on ${page.url()}`);

      // Wait for lazy-loaded scripts (WP Rocket delays JS on mondotickets)
      await page.waitForTimeout(8000);

      // Scroll through page to trigger lazy loading of widgets
      await page.evaluate(async () => {
        const step = Math.floor(document.body.scrollHeight / 5);
        for (let i = 1; i <= 5; i++) {
          window.scrollTo(0, step * i);
          await new Promise((r) => setTimeout(r, 1000));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(3000);

      // Check for Travelpayouts/search iframes
      const iframeHandle = await page.$(
        'iframe[src*="search"], iframe[src*="flight"], iframe[src*="widget"], iframe[src*="travelpayouts"], iframe[src*="aviasales"], iframe[src*="tp.media"]',
      );

      if (iframeHandle) {
        const frame = await iframeHandle.contentFrame();
        if (frame) {
          this.logger.log('Found search widget iframe — filling form');
          await this.tryFillSearchForm(frame as unknown as Page, params);
        }
      } else {
        // Try on main page
        await this.tryFillSearchForm(page, params);
      }

      // Wait for results
      await page.waitForTimeout(10_000);

      // Try to extract prices from the page and any iframes
      let prices = await this.extractPrices(page);

      // Also check iframes for prices
      if (prices.length === 0) {
        const frames = page.frames();
        for (const frame of frames) {
          if (frame === page.mainFrame()) continue;
          try {
            const framePrices = await this.extractPrices(frame as unknown as Page);
            if (framePrices.length > 0) {
              prices = framePrices;
              break;
            }
          } catch { /* iframe may be detached */ }
        }
      }

      if (prices.length === 0) {
        return {
          success: false,
          prices: [],
          error: 'No prices found on landing page after search',
        };
      }

      return { success: true, prices };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Mondotickets search failed: ${message}`);
      return { success: false, prices: [], error: message };
    }
  }

  private async tryFillSearchForm(page: Page, params: FlightSearchParams): Promise<void> {
    // Strategy 1: Try direct input fields
    const originInput = await page.$(
      [
        'input[placeholder*="from" i]',
        'input[placeholder*="origin" i]',
        'input[placeholder*="depart" i]',
        'input[placeholder*="flying from" i]',
        'input[name*="origin" i]',
        'input[name*="from" i]',
        'input[aria-label*="from" i]',
        'input[aria-label*="origin" i]',
      ].join(', '),
    );

    if (originInput) {
      await originInput.click();
      await originInput.fill('');
      await originInput.type(params.origin, { delay: 100 });
      await page.waitForTimeout(2000);

      // Click first autocomplete suggestion
      const suggestion = await page.$(
        [
          '[class*="autocomplete"] li:first-child',
          '[class*="suggestion"] li:first-child',
          '[class*="dropdown"] li:first-child',
          '[role="option"]:first-child',
          '[class*="result"]:first-child',
        ].join(', '),
      );
      if (suggestion) await suggestion.click();
      await page.waitForTimeout(1000);
    }

    // Destination
    const destInput = await page.$(
      [
        'input[placeholder*="to" i]',
        'input[placeholder*="destination" i]',
        'input[placeholder*="arrival" i]',
        'input[placeholder*="flying to" i]',
        'input[name*="destination" i]',
        'input[name*="to" i]',
        'input[aria-label*="to" i]',
        'input[aria-label*="destination" i]',
      ].join(', '),
    );

    if (destInput) {
      await destInput.click();
      await destInput.fill('');
      await destInput.type(params.destination, { delay: 100 });
      await page.waitForTimeout(2000);

      const suggestion = await page.$(
        '[class*="autocomplete"] li:first-child, [class*="suggestion"] li:first-child, [role="option"]:first-child',
      );
      if (suggestion) await suggestion.click();
      await page.waitForTimeout(1000);
    }

    // Date fields
    const departDateInput = await page.$(
      [
        'input[placeholder*="depart" i]',
        'input[name*="depart" i]',
        'input[name*="checkin" i]',
        'input[aria-label*="depart" i]',
        'input[type="date"]:first-of-type',
      ].join(', '),
    );

    if (departDateInput) {
      await departDateInput.click();
      await departDateInput.fill(params.departDate);
      await page.waitForTimeout(500);
    }

    const returnDateInput = await page.$(
      [
        'input[placeholder*="return" i]',
        'input[name*="return" i]',
        'input[name*="checkout" i]',
        'input[aria-label*="return" i]',
        'input[type="date"]:last-of-type',
      ].join(', '),
    );

    if (returnDateInput) {
      await returnDateInput.click();
      await returnDateInput.fill(params.returnDate);
      await page.waitForTimeout(500);
    }

    // Try round-trip selection
    const roundTripRadio = await page.$(
      'input[value*="round" i], input[value*="return" i], label:has-text("Round trip"), label:has-text("Tur/retur")',
    );
    if (roundTripRadio) await roundTripRadio.click();

    // Submit search
    const searchButton = await page.$(
      [
        'button[type="submit"]',
        'button:has-text("Search")',
        'button:has-text("Søk")',
        'button:has-text("Find")',
        'input[type="submit"]',
        '[class*="search-btn"]',
        '[class*="submit"]',
      ].join(', '),
    );

    if (searchButton) {
      await searchButton.click();
      this.logger.log('Search form submitted');
      await page.waitForTimeout(5000);
    }
  }

  private async extractPrices(page: Page): Promise<FlightSearchPrice[]> {
    return page.evaluate(() => {
      const prices: { priceAmount: number; currency: string; providerName: string | null; resultRank: number }[] = [];

      // Strategy: find elements that look like prices
      const pricePatterns = [
        /\$\s*([\d,]+(?:\.\d{2})?)/,
        /€\s*([\d,]+(?:\.\d{2})?)/,
        /£\s*([\d,]+(?:\.\d{2})?)/,
        /([\d,]+(?:\.\d{2})?)\s*(?:USD|EUR|GBP|NOK|SEK|DKK)/,
        /(?:USD|EUR|GBP)\s*([\d,]+(?:\.\d{2})?)/,
      ];

      const currencyMap: Record<string, string> = {
        '$': 'USD', '€': 'EUR', '£': 'GBP',
      };

      // Look for price elements
      const priceSelectors = [
        '[class*="price"]',
        '[class*="fare"]',
        '[class*="cost"]',
        '[class*="amount"]',
        '[data-price]',
      ];

      const elements: Element[] = [];
      for (const sel of priceSelectors) {
        elements.push(...Array.from(document.querySelectorAll(sel)));
      }

      // Also scan visible text for price patterns
      if (elements.length === 0) {
        const all = document.querySelectorAll('span, div, p, td');
        all.forEach((el) => {
          const text = el.textContent || '';
          for (const pattern of pricePatterns) {
            if (pattern.test(text)) {
              elements.push(el);
              break;
            }
          }
        });
      }

      const seen = new Set<number>();
      let rank = 1;

      for (const el of elements) {
        const text = (el.textContent || '').trim();
        for (const pattern of pricePatterns) {
          const match = text.match(pattern);
          if (match) {
            const amount = parseFloat(match[1].replace(/,/g, ''));
            if (!isNaN(amount) && amount > 0 && amount < 100_000 && !seen.has(amount)) {
              seen.add(amount);
              let currency = 'USD';
              for (const [symbol, code] of Object.entries(currencyMap)) {
                if (text.includes(symbol)) { currency = code; break; }
              }
              const currencyMatch = text.match(/USD|EUR|GBP|NOK|SEK|DKK/);
              if (currencyMatch) currency = currencyMatch[0];

              prices.push({
                priceAmount: amount,
                currency,
                providerName: null,
                resultRank: rank++,
              });
            }
          }
        }

        if (prices.length >= 10) break;
      }

      return prices;
    });
  }
}
