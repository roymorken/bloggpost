import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier, BlogPost, BlogPostCheck, ExtractedLink, FlightSearchResult, Job } from '../../database/entities';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Supplier) private readonly supplierRepo: Repository<Supplier>,
    @InjectRepository(BlogPost) private readonly blogPostRepo: Repository<BlogPost>,
    @InjectRepository(BlogPostCheck) private readonly checkRepo: Repository<BlogPostCheck>,
    @InjectRepository(ExtractedLink) private readonly linkRepo: Repository<ExtractedLink>,
    @InjectRepository(FlightSearchResult) private readonly flightRepo: Repository<FlightSearchResult>,
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
  ) {}

  async getSummary() {
    const [totalSuppliers, totalBlogPosts, activeBlogPosts, notFoundBlogPosts, brokenLinks, recentPrices, recentJobs] =
      await Promise.all([
        this.supplierRepo.count(),
        this.blogPostRepo.count(),
        this.checkRepo.count({ where: { statusCategory: 'active' } }),
        this.checkRepo.count({ where: { statusCategory: 'not_found' } }),
        this.linkRepo.count({ where: { statusCategory: 'not_found' } }),
        this.flightRepo.find({ order: { capturedAt: 'DESC' }, take: 10 }),
        this.jobRepo.find({ order: { createdAt: 'DESC' }, take: 5 }),
      ]);

    return {
      totalSuppliers,
      totalBlogPosts,
      activeBlogPosts,
      notFoundBlogPosts,
      brokenLinks,
      recentPrices,
      recentJobs,
    };
  }
}
