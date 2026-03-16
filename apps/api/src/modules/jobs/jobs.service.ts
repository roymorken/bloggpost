import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Job } from '../../database/entities';
import { BlogPostsService } from '../blog-posts/blog-posts.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly repo: Repository<Job>,
    @InjectQueue('url-check')
    private readonly urlCheckQueue: Queue,
    private readonly blogPostsService: BlogPostsService,
  ) {}

  async create(importBatchId: string, options?: { autoGenerateReports?: boolean; autoSendEmails?: boolean }): Promise<Job> {
    const blogPosts = await this.blogPostsService.findByBatchId(importBatchId);
    if (blogPosts.length === 0) {
      throw new NotFoundException('No blog posts found for this import batch');
    }

    const job = await this.repo.save(
      this.repo.create({
        importBatchId,
        status: 'pending',
        totalBlogPosts: blogPosts.length,
      }),
    );

    for (const blogPost of blogPosts) {
      await this.urlCheckQueue.add('check-url', {
        jobId: job.id,
        blogPostId: blogPost.id,
        url: blogPost.blogPostUrl,
        supplierId: blogPost.supplierId,
        autoGenerateReports: options?.autoGenerateReports ?? false,
        autoSendEmails: options?.autoSendEmails ?? false,
      });
    }

    await this.repo.update(job.id, { status: 'running', startedAt: new Date() });
    return this.repo.findOneByOrFail({ id: job.id });
  }

  findById(id: string): Promise<Job | null> {
    return this.repo.findOne({ where: { id }, relations: ['checks'] });
  }

  async cancel(id: string): Promise<Job> {
    await this.repo.update(id, { status: 'cancelled', finishedAt: new Date() });
    return this.repo.findOneByOrFail({ id });
  }

  async markComplete(id: string): Promise<void> {
    await this.repo.update(id, { status: 'completed', finishedAt: new Date() });
  }
}
