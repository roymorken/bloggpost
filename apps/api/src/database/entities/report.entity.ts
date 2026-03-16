import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Job } from './job.entity';
import { Supplier } from './supplier.entity';
import { EmailLog } from './email-log.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'job_id' })
  jobId: string;

  @Column({ type: 'uuid', name: 'supplier_id', nullable: true })
  supplierId: string | null;

  @Column({ type: 'text', name: 'report_type' })
  reportType: string;

  @Column({ type: 'text', name: 'report_scope' })
  reportScope: string;

  @Column({ type: 'text', name: 'file_path', nullable: true })
  filePath: string | null;

  @Column({ type: 'timestamp', name: 'generated_at' })
  generatedAt: Date;

  @ManyToOne(() => Job, (j) => j.reports)
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @ManyToOne(() => Supplier, (s) => s.reports)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @OneToMany(() => EmailLog, (el) => el.report)
  emailLogs: EmailLog[];
}
