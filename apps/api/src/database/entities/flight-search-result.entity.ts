import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Job } from './job.entity';
import { Supplier } from './supplier.entity';
import { BlogPost } from './blog-post.entity';
import { ExtractedLink } from './extracted-link.entity';

@Entity('flight_search_results')
export class FlightSearchResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'job_id' })
  jobId: string;

  @Column({ type: 'uuid', name: 'supplier_id' })
  supplierId: string;

  @Column({ type: 'uuid', name: 'blog_post_id' })
  blogPostId: string;

  @Column({ type: 'uuid', name: 'extracted_link_id' })
  extractedLinkId: string;

  @Column({ type: 'text', name: 'landing_page_url', nullable: true })
  landingPageUrl: string | null;

  @Column({ type: 'text' })
  origin: string;

  @Column({ type: 'text' })
  destination: string;

  @Column({ type: 'date', name: 'depart_date' })
  departDate: Date;

  @Column({ type: 'date', name: 'return_date' })
  returnDate: Date;

  @Column({ type: 'int', name: 'trip_length_days', default: 5 })
  tripLengthDays: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'price_amount', nullable: true })
  priceAmount: string | null;

  @Column({ type: 'text', nullable: true })
  currency: string | null;

  @Column({ type: 'text', name: 'provider_name', nullable: true })
  providerName: string | null;

  @Column({ type: 'int', name: 'result_rank', nullable: true })
  resultRank: number | null;

  @Column({ type: 'timestamp', name: 'captured_at' })
  capturedAt: Date;

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage: string | null;

  @ManyToOne(() => Job, (j) => j.flightSearchResults)
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @ManyToOne(() => Supplier, (s) => s.flightSearchResults)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @ManyToOne(() => BlogPost, (bp) => bp.flightSearchResults)
  @JoinColumn({ name: 'blog_post_id' })
  blogPost: BlogPost;

  @ManyToOne(() => ExtractedLink, (el) => el.flightSearchResults)
  @JoinColumn({ name: 'extracted_link_id' })
  extractedLink: ExtractedLink;
}
