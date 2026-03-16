import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('email_templates')
export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', name: 'template_name' })
  templateName: string;

  @Column({ type: 'text' })
  scope: string;

  @Column({ type: 'text', name: 'subject_template' })
  subjectTemplate: string;

  @Column({ type: 'text', name: 'body_template' })
  bodyTemplate: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
