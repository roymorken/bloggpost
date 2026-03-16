import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate, EmailLog, Report } from '../../database/entities';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    @InjectRepository(EmailTemplate)
    private readonly templateRepo: Repository<EmailTemplate>,
    @InjectRepository(EmailLog)
    private readonly logRepo: Repository<EmailLog>,
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    private readonly config: ConfigService,
  ) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.config.get('SMTP_HOST');
    if (!host) {
      this.logger.warn('SMTP not configured - email sending disabled');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: parseInt(this.config.get('SMTP_PORT', '587'), 10),
      secure: false,
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASSWORD'),
      },
    });
  }

  findAllTemplates(): Promise<EmailTemplate[]> {
    return this.templateRepo.find({ order: { templateName: 'ASC' } });
  }

  async updateTemplate(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    await this.templateRepo.update(id, data);
    return this.templateRepo.findOneByOrFail({ id });
  }

  renderTemplate(template: string, variables: Record<string, string>): string {
    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return rendered;
  }

  async sendReport(data: {
    reportId: string;
    supplierId?: string;
    to: string[];
    cc?: string[];
    customMessage?: string;
    templateId?: string;
    variables?: Record<string, string>;
  }): Promise<EmailLog> {
    const report = await this.reportRepo.findOneBy({ id: data.reportId });

    let subject = 'Bloggpost Monitor Rapport';
    let body = data.customMessage || '';

    if (data.templateId && data.variables) {
      const template = await this.templateRepo.findOneBy({ id: data.templateId });
      if (template) {
        subject = this.renderTemplate(template.subjectTemplate, data.variables);
        body = this.renderTemplate(template.bodyTemplate, data.variables);
      }
    }

    const log = await this.logRepo.save(
      this.logRepo.create({
        reportId: data.reportId,
        supplierId: data.supplierId || null,
        recipients: data.to,
        ccRecipients: data.cc || null,
        subject,
        body,
        status: 'pending',
      }),
    );

    if (!this.transporter) {
      this.logger.warn('SMTP not configured - email logged but not sent');
      await this.logRepo.update(log.id, { status: 'skipped', errorMessage: 'SMTP not configured' });
      return this.logRepo.findOneByOrFail({ id: log.id });
    }

    try {
      const attachments: { filename: string; path: string }[] = [];
      if (report?.filePath && fs.existsSync(report.filePath)) {
        attachments.push({
          filename: `rapport-${report.id}.pdf`,
          path: report.filePath,
        });
      }

      await this.transporter.sendMail({
        from: this.config.get('EMAIL_FROM', 'noreply@example.com'),
        to: data.to.join(', '),
        cc: data.cc?.join(', '),
        subject,
        text: body,
        attachments,
      });

      await this.logRepo.update(log.id, { status: 'sent', sentAt: new Date() });
      this.logger.log(`Email sent to ${data.to.join(', ')}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      await this.logRepo.update(log.id, { status: 'failed', errorMessage: message });
      this.logger.error(`Email failed: ${message}`);
    }

    return this.logRepo.findOneByOrFail({ id: log.id });
  }
}
