import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ImportBatch } from './import-batch.entity';
import { BlogPostCheck } from './blog-post-check.entity';
import { FlightSearchResult } from './flight-search-result.entity';
import { Report } from './report.entity';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'import_batch_id' })
  importBatchId: string;

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'timestamp', name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamp', name: 'finished_at', nullable: true })
  finishedAt: Date | null;

  @Column({ type: 'int', name: 'total_blog_posts', default: 0 })
  totalBlogPosts: number;

  @Column({ type: 'int', name: 'total_links', default: 0 })
  totalLinks: number;

  @Column({ type: 'int', name: 'total_flight_searches', default: 0 })
  totalFlightSearches: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ImportBatch, (ib) => ib.jobs)
  @JoinColumn({ name: 'import_batch_id' })
  importBatch: ImportBatch;

  @OneToMany(() => BlogPostCheck, (bpc) => bpc.job)
  checks: BlogPostCheck[];

  @OneToMany(() => FlightSearchResult, (fsr) => fsr.job)
  flightSearchResults: FlightSearchResult[];

  @OneToMany(() => Report, (r) => r.job)
  reports: Report[];
}
