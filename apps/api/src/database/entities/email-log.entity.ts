import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Report } from './report.entity';
import { Supplier } from './supplier.entity';

@Entity('email_logs')
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'report_id' })
  reportId: string;

  @Column({ type: 'uuid', name: 'supplier_id', nullable: true })
  supplierId: string | null;

  @Column({ type: 'text', array: true })
  recipients: string[];

  @Column({ type: 'text', array: true, name: 'cc_recipients', nullable: true })
  ccRecipients: string[] | null;

  @Column({ type: 'text' })
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'timestamp', name: 'sent_at', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage: string | null;

  @ManyToOne(() => Report, (r) => r.emailLogs)
  @JoinColumn({ name: 'report_id' })
  report: Report;

  @ManyToOne(() => Supplier, (s) => s.emailLogs)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;
}
