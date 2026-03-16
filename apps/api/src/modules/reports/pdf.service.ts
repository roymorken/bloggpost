import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts, type Color } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

interface ReportData {
  title: string;
  supplierName?: string;
  generatedAt: string;
  blogPostChecks: {
    url: string;
    status: string;
    httpStatus: number | null;
    responseTimeMs: number | null;
  }[];
  extractedLinks: {
    url: string;
    anchorText: string | null;
    status: string;
  }[];
  flightPrices: {
    route: string;
    departDate: string;
    returnDate: string;
    price: string | null;
    currency: string | null;
    status: string;
  }[];
  summary: {
    totalBlogPosts: number;
    activeBlogPosts: number;
    notFoundBlogPosts: number;
    totalLinks: number;
    brokenLinks: number;
    totalSearches: number;
    pricesFound: number;
    lowestPrice: string | null;
    highestPrice: string | null;
  };
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly outputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateReport(reportId: string, data: ReportData): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595, 842]); // A4
    let y = 800;
    const leftMargin = 50;
    const lineHeight = 16;

    const drawText = (text: string, options?: { bold?: boolean; size?: number; color?: Color }) => {
      const usedFont = options?.bold ? boldFont : font;
      const size = options?.size || 10;
      if (y < 60) {
        page = pdfDoc.addPage([595, 842]);
        y = 800;
      }
      page.drawText(text, {
        x: leftMargin,
        y,
        size,
        font: usedFont,
        color: options?.color || rgb(0, 0, 0),
      });
      y -= lineHeight;
    };

    // Title
    drawText(data.title, { bold: true, size: 18 });
    y -= 10;
    if (data.supplierName) drawText(`Supplier: ${data.supplierName}`, { size: 12 });
    drawText(`Generated: ${data.generatedAt}`, { size: 10, color: rgb(0.4, 0.4, 0.4) });
    y -= 20;

    // Filter to only failed blog posts and broken links
    const failedChecks = data.blogPostChecks.filter((c) => c.status !== 'active');
    const brokenLinks = data.extractedLinks.filter((l) => l.status !== 'active');

    // Summary — only error counts
    drawText('Summary', { bold: true, size: 14 });
    y -= 5;
    drawText(`Total blog posts checked: ${data.summary.totalBlogPosts}`);
    drawText(`Blog posts with errors: ${failedChecks.length}`);
    drawText(`Broken links found: ${brokenLinks.length}`);
    y -= 20;

    // Failed blog posts
    if (failedChecks.length > 0) {
      drawText('Blog Posts With Errors', { bold: true, size: 14 });
      y -= 5;
      for (const check of failedChecks.slice(0, 50)) {
        const url = check.url.length > 70 ? check.url.slice(0, 70) + '...' : check.url;
        drawText(`${url}`, { color: rgb(0.8, 0, 0) });
        drawText(`  Status: ${check.status} (HTTP ${check.httpStatus ?? 'N/A'})`);
      }
      y -= 10;

      // Action required message
      drawText('Action Required', { bold: true, size: 12, color: rgb(0.8, 0, 0) });
      y -= 5;
      drawText('The URLs listed above are no longer accessible or have errors.');
      drawText('Please publish a new equivalent blog post on the same blog post server');
      drawText('to replace each failed URL and notify us with the updated links.');
      y -= 15;
    }

    // Broken extracted links
    if (brokenLinks.length > 0) {
      drawText('Broken Links Within Blog Posts', { bold: true, size: 14 });
      y -= 5;
      for (const link of brokenLinks.slice(0, 50)) {
        const url = link.url.length > 70 ? link.url.slice(0, 70) + '...' : link.url;
        const anchor = link.anchorText ? ` (anchor: "${link.anchorText}")` : '';
        drawText(`${url}${anchor}`, { color: rgb(0.8, 0, 0) });
        drawText(`  Status: ${link.status}`);
      }
      y -= 15;
    }

    // No errors case
    if (failedChecks.length === 0 && brokenLinks.length === 0) {
      drawText('All blog posts and links are active. No action required.', {
        size: 12,
        color: rgb(0, 0.5, 0),
      });
    }

    const filePath = path.join(this.outputDir, `report-${reportId}.pdf`);
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);

    this.logger.log(`PDF generated: ${filePath}`);
    return filePath;
  }
}
