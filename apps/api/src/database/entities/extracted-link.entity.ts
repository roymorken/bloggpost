import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BlogPostCheck } from './blog-post-check.entity';
import { LandingPageSession } from './landing-page-session.entity';
import { FlightSearchResult } from './flight-search-result.entity';

@Entity('extracted_links')
export class ExtractedLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'blog_post_check_id' })
  blogPostCheckId: string;

  @Column({ type: 'text', name: 'anchor_text', nullable: true })
  anchorText: string | null;

  @Column({ type: 'text', name: 'link_url' })
  linkUrl: string;

  @Column({ type: 'text', name: 'final_url', nullable: true })
  finalUrl: string | null;

  @Column({ type: 'int', name: 'http_status', nullable: true })
  httpStatus: number | null;

  @Column({ type: 'text', name: 'status_category' })
  statusCategory: string;

  @Column({ type: 'timestamp', name: 'checked_at' })
  checkedAt: Date;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage: string | null;

  @ManyToOne(() => BlogPostCheck, (bpc) => bpc.extractedLinks)
  @JoinColumn({ name: 'blog_post_check_id' })
  blogPostCheck: BlogPostCheck;

  @OneToMany(() => LandingPageSession, (lps) => lps.extractedLink)
  landingPageSessions: LandingPageSession[];

  @OneToMany(() => FlightSearchResult, (fsr) => fsr.extractedLink)
  flightSearchResults: FlightSearchResult[];
}
