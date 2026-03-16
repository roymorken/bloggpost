import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Job } from './job.entity';
import { BlogPost } from './blog-post.entity';
import { ExtractedLink } from './extracted-link.entity';

@Entity('blog_post_checks')
export class BlogPostCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'job_id' })
  jobId: string;

  @Column({ type: 'uuid', name: 'blog_post_id' })
  blogPostId: string;

  @Column({ type: 'text', name: 'original_url' })
  originalUrl: string;

  @Column({ type: 'text', name: 'final_url', nullable: true })
  finalUrl: string | null;

  @Column({ type: 'int', name: 'http_status', nullable: true })
  httpStatus: number | null;

  @Column({ type: 'text', name: 'status_category' })
  statusCategory: string;

  @Column({ type: 'int', name: 'response_time_ms', nullable: true })
  responseTimeMs: number | null;

  @Column({ type: 'timestamp', name: 'checked_at' })
  checkedAt: Date;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage: string | null;

  @ManyToOne(() => Job, (j) => j.checks)
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @ManyToOne(() => BlogPost, (bp) => bp.checks)
  @JoinColumn({ name: 'blog_post_id' })
  blogPost: BlogPost;

  @OneToMany(() => ExtractedLink, (el) => el.blogPostCheck)
  extractedLinks: ExtractedLink[];
}
