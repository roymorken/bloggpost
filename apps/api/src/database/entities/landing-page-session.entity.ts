import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ExtractedLink } from './extracted-link.entity';

@Entity('landing_page_sessions')
export class LandingPageSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'extracted_link_id' })
  extractedLinkId: string;

  @Column({ type: 'timestamp', name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamp', name: 'finished_at', nullable: true })
  finishedAt: Date | null;

  @Column({ type: 'int', name: 'browse_duration_seconds' })
  browseDurationSeconds: number;

  @Column({ type: 'text', name: 'proxy_session_id', nullable: true })
  proxySessionId: string | null;

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage: string | null;

  @ManyToOne(() => ExtractedLink, (el) => el.landingPageSessions)
  @JoinColumn({ name: 'extracted_link_id' })
  extractedLink: ExtractedLink;
}
