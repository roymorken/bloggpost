import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BlogPost } from './blog-post.entity';
import { FlightSearchResult } from './flight-search-result.entity';
import { Report } from './report.entity';
import { EmailLog } from './email-log.entity';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', name: 'supplier_name' })
  supplierName: string;

  @Column({ type: 'text', name: 'supplier_code', nullable: true })
  supplierCode: string | null;

  @Column({ type: 'text', name: 'primary_email', nullable: true })
  primaryEmail: string | null;

  @Column({ type: 'text', array: true, name: 'cc_emails', nullable: true })
  ccEmails: string[] | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => BlogPost, (bp) => bp.supplier)
  blogPosts: BlogPost[];

  @OneToMany(() => FlightSearchResult, (fsr) => fsr.supplier)
  flightSearchResults: FlightSearchResult[];

  @OneToMany(() => Report, (r) => r.supplier)
  reports: Report[];

  @OneToMany(() => EmailLog, (el) => el.supplier)
  emailLogs: EmailLog[];
}
