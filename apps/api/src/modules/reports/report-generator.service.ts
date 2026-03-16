import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Report,
  BlogPostCheck,
  ExtractedLink,
  FlightSearchResult,
  Supplier,
} from '../../database/entities';
import { PdfService } from './pdf.service';

@Injectable()
export class ReportGeneratorService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(BlogPostCheck)
    private readonly checkRepo: Repository<BlogPostCheck>,
    @InjectRepository(ExtractedLink)
    private readonly linkRepo: Repository<ExtractedLink>,
    @InjectRepository(FlightSearchResult)
    private readonly flightRepo: Repository<FlightSearchResult>,
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    private readonly pdfService: PdfService,
  ) {}

  async generate(jobId: string, supplierId?: string, reportType = 'summary'): Promise<Report> {
    const supplier = supplierId ? await this.supplierRepo.findOneBy({ id: supplierId }) : null;

    // Fetch data, filtered by supplier if specified
    const checkQb = this.checkRepo
      .createQueryBuilder('c')
      .leftJoin('c.blogPost', 'bp')
      .where('c.job_id = :jobId', { jobId });
    if (supplierId) checkQb.andWhere('bp.supplier_id = :sid', { sid: supplierId });
    const checks = await checkQb.getMany();

    const flightQb = this.flightRepo
      .createQueryBuilder('f')
      .where('f.job_id = :jobId', { jobId });
    if (supplierId) flightQb.andWhere('f.supplier_id = :sid', { sid: supplierId });
    const flights = await flightQb.getMany();

    const linkQb = this.linkRepo
      .createQueryBuilder('l')
      .leftJoin('l.blogPostCheck', 'c')
      .where('c.job_id = :jobId', { jobId });
    if (supplierId) {
      linkQb.leftJoin('c.blogPost', 'bp').andWhere('bp.supplier_id = :sid', { sid: supplierId });
    }
    const links = await linkQb.getMany();

    const pricesWithAmount = flights.filter((f) => f.priceAmount !== null);
    const priceValues = pricesWithAmount.map((f) => parseFloat(f.priceAmount!));

    const report = await this.reportRepo.save(
      this.reportRepo.create({
        jobId,
        supplierId: supplierId || null,
        reportType,
        reportScope: supplierId ? 'supplier' : 'all',
        generatedAt: new Date(),
      }),
    );

    const filePath = await this.pdfService.generateReport(report.id, {
      title: supplier
        ? `Blog Post Report — ${supplier.supplierName}`
        : 'Blog Post Report — All Suppliers',
      supplierName: supplier?.supplierName,
      generatedAt: new Date().toLocaleDateString('en-GB'),
      blogPostChecks: checks.map((c) => ({
        url: c.originalUrl,
        status: c.statusCategory,
        httpStatus: c.httpStatus,
        responseTimeMs: c.responseTimeMs,
      })),
      extractedLinks: links.map((l) => ({
        url: l.linkUrl,
        anchorText: l.anchorText,
        status: l.statusCategory,
      })),
      flightPrices: flights.map((f) => ({
        route: `${f.origin}→${f.destination}`,
        departDate: String(f.departDate),
        returnDate: String(f.returnDate),
        price: f.priceAmount,
        currency: f.currency,
        status: f.status,
      })),
      summary: {
        totalBlogPosts: checks.length,
        activeBlogPosts: checks.filter((c) => c.statusCategory === 'active').length,
        notFoundBlogPosts: checks.filter((c) => c.statusCategory === 'not_found').length,
        totalLinks: links.length,
        brokenLinks: links.filter((l) => l.statusCategory === 'not_found').length,
        totalSearches: flights.length,
        pricesFound: pricesWithAmount.length,
        lowestPrice: priceValues.length > 0 ? Math.min(...priceValues).toFixed(2) : null,
        highestPrice: priceValues.length > 0 ? Math.max(...priceValues).toFixed(2) : null,
      },
    });

    await this.reportRepo.update(report.id, { filePath });
    return this.reportRepo.findOneByOrFail({ id: report.id });
  }
}
