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
    if (data.supplierName) drawText(`Leverandør: ${data.supplierName}`, { size: 12 });
    drawText(`Generert: ${data.generatedAt}`, { size: 10, color: rgb(0.4, 0.4, 0.4) });
    y -= 20;

    // Summary
    drawText('Sammendrag', { bold: true, size: 14 });
    y -= 5;
    drawText(`Bloggposter totalt: ${data.summary.totalBlogPosts}`);
    drawText(`Aktive: ${data.summary.activeBlogPosts}`);
    drawText(`404/Ikke funnet: ${data.summary.notFoundBlogPosts}`);
    drawText(`Lenker totalt: ${data.summary.totalLinks}`);
    drawText(`Ødelagte lenker: ${data.summary.brokenLinks}`);
    drawText(`Flysøk utført: ${data.summary.totalSearches}`);
    drawText(`Priser funnet: ${data.summary.pricesFound}`);
    if (data.summary.lowestPrice) drawText(`Laveste pris: ${data.summary.lowestPrice}`);
    if (data.summary.highestPrice) drawText(`Høyeste pris: ${data.summary.highestPrice}`);
    y -= 20;

    // Blog post checks
    if (data.blogPostChecks.length > 0) {
      drawText('Bloggpoststatus', { bold: true, size: 14 });
      y -= 5;
      for (const check of data.blogPostChecks.slice(0, 50)) {
        const statusIcon = check.status === 'active' ? '[OK]' : '[FEIL]';
        const url = check.url.length > 60 ? check.url.slice(0, 60) + '...' : check.url;
        drawText(`${statusIcon} ${url} - ${check.status} (${check.httpStatus ?? 'N/A'})`);
      }
      y -= 15;
    }

    // Flight prices
    if (data.flightPrices.length > 0) {
      drawText('Flypriser', { bold: true, size: 14 });
      y -= 5;
      for (const price of data.flightPrices.slice(0, 30)) {
        const priceStr = price.price ? `${price.price} ${price.currency}` : 'Ikke funnet';
        drawText(`${price.route} | ${price.departDate} - ${price.returnDate} | ${priceStr}`);
      }
    }

    const filePath = path.join(this.outputDir, `report-${reportId}.pdf`);
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);

    this.logger.log(`PDF generated: ${filePath}`);
    return filePath;
  }
}
