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
import { Supplier } from './supplier.entity';
import { BlogPostCheck } from './blog-post-check.entity';
import { FlightSearchResult } from './flight-search-result.entity';

@Entity('blog_posts')
export class BlogPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'import_batch_id' })
  importBatchId: string;

  @Column({ type: 'uuid', name: 'supplier_id' })
  supplierId: string;

  @Column({ type: 'text', name: 'blog_post_url' })
  blogPostUrl: string;

  @Column({ type: 'text', nullable: true })
  title: string | null;

  @Column({ type: 'date', name: 'source_date', nullable: true })
  sourceDate: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ImportBatch, (ib) => ib.blogPosts)
  @JoinColumn({ name: 'import_batch_id' })
  importBatch: ImportBatch;

  @ManyToOne(() => Supplier, (s) => s.blogPosts)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @OneToMany(() => BlogPostCheck, (bpc) => bpc.blogPost)
  checks: BlogPostCheck[];

  @OneToMany(() => FlightSearchResult, (fsr) => fsr.blogPost)
  flightSearchResults: FlightSearchResult[];
}
