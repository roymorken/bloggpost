import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { ProxyService } from './proxy.service';

@Injectable()
export class BrowserService implements OnModuleDestroy {
  private readonly logger = new Logger(BrowserService.name);
  private browser: Browser | null = null;

  constructor(private readonly proxyService: ProxyService) {}

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
    return this.browser;
  }

  async createContext(): Promise<{ context: BrowserContext; sessionId: string | null }> {
    const browser = await this.getBrowser();
    let sessionId: string | null = null;

    const contextOptions: Record<string, unknown> = {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      locale: 'en-US',
    };

    if (this.proxyService.isConfigured()) {
      const proxy = this.proxyService.getRotatingSession();
      sessionId = proxy.sessionId;
      contextOptions.proxy = {
        server: proxy.server,
        username: proxy.username,
        password: proxy.password,
      };
    }

    const context = await browser.newContext(contextOptions);
    return { context, sessionId };
  }

  async extractLinks(page: Page): Promise<{ anchorText: string; href: string }[]> {
    return page.evaluate(() => {
      const contentSelectors = ['article', 'main', '[role="main"]', '.post-content', '.entry-content', '.content', '#content'];
      let container: Element | null = null;

      for (const selector of contentSelectors) {
        container = document.querySelector(selector);
        if (container) break;
      }

      if (!container) container = document.body;

      const anchors = container.querySelectorAll('a[href]');
      const links: { anchorText: string; href: string }[] = [];
      const seen = new Set<string>();

      anchors.forEach((a) => {
        const href = (a as HTMLAnchorElement).href;
        if (href && !seen.has(href) && href.startsWith('http')) {
          seen.add(href);
          links.push({
            anchorText: (a.textContent || '').trim().slice(0, 500),
            href,
          });
        }
      });

      return links;
    });
  }

  async browseNaturally(page: Page, durationMs: number): Promise<void> {
    const startTime = Date.now();
    const interval = 3000 + Math.random() * 5000;

    while (Date.now() - startTime < durationMs) {
      await page.evaluate(() => {
        const scrollAmount = 200 + Math.random() * 400;
        window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
      });

      await page.waitForTimeout(interval);

      // Occasionally scroll back up
      if (Math.random() < 0.2) {
        await page.evaluate(() => {
          window.scrollBy({ top: -(100 + Math.random() * 200), behavior: 'smooth' });
        });
        await page.waitForTimeout(1000 + Math.random() * 2000);
      }
    }
  }
}
