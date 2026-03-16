import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { BlogPost } from './blog-post.entity';
import { Job } from './job.entity';

@Entity('import_batches')
export class ImportBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  filename: string;

  @Column({ type: 'text', name: 'file_type' })
  fileType: string;

  @Column({ type: 'int', name: 'row_count' })
  rowCount: number;

  @Column({ type: 'text' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => BlogPost, (bp) => bp.importBatch)
  blogPosts: BlogPost[];

  @OneToMany(() => Job, (j) => j.importBatch)
  jobs: Job[];
}
