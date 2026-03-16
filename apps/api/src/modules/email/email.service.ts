import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate, EmailLog, Report, BlogPostCheck, ExtractedLink, Supplier } from '../../database/entities';
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
    @InjectRepository(BlogPostCheck)
    private readonly checkRepo: Repository<BlogPostCheck>,
    @InjectRepository(ExtractedLink)
    private readonly linkRepo: Repository<ExtractedLink>,
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
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

  private async buildReportVariables(report: Report): Promise<Record<string, string>> {
    const supplier = report.supplierId
      ? await this.supplierRepo.findOneBy({ id: report.supplierId })
      : null;

    // Fetch failed blog post checks
    const checkQb = this.checkRepo
      .createQueryBuilder('c')
      .leftJoin('c.blogPost', 'bp')
      .where('c.job_id = :jobId', { jobId: report.jobId })
      .andWhere('c.status_category != :active', { active: 'active' });
    if (report.supplierId) {
      checkQb.andWhere('bp.supplier_id = :sid', { sid: report.supplierId });
    }
    const failedChecks = await checkQb.getMany();

    // Fetch broken extracted links
    const linkQb = this.linkRepo
      .createQueryBuilder('l')
      .leftJoin('l.blogPostCheck', 'c')
      .where('c.job_id = :jobId', { jobId: report.jobId })
      .andWhere('l.status_category != :active', { active: 'active' });
    if (report.supplierId) {
      linkQb.leftJoin('c.blogPost', 'bp').andWhere('bp.supplier_id = :sid', { sid: report.supplierId });
    }
    const brokenLinks = await linkQb.getMany();

    const failedUrlList = failedChecks.length > 0
      ? failedChecks.map((c) => `- ${c.originalUrl} (${c.statusCategory}, HTTP ${c.httpStatus ?? 'N/A'})`).join('\n')
      : 'None';

    const brokenLinkList = brokenLinks.length > 0
      ? brokenLinks.map((l) => `- ${l.linkUrl} (${l.statusCategory})`).join('\n')
      : 'None';

    return {
      supplierName: supplier?.supplierName || 'All Suppliers',
      reportDate: new Date().toLocaleDateString('en-GB'),
      errorCount: String(failedChecks.length),
      brokenLinkCount: String(brokenLinks.length),
      failedUrlList,
      brokenLinkList,
    };
  }

  findAllEmails(): Promise<EmailLog[]> {
    return this.logRepo.find({
      relations: ['supplier', 'report'],
      order: { sentAt: 'DESC' },
    });
  }

  async sendReport(data: {
    reportId: string;
    supplierId?: string;
    to: string[];
    cc?: string[];
    customMessage?: string;
    templateId?: string;
    variables?: Record<string, string>;
    draft?: boolean;
  }): Promise<EmailLog> {
    const report = await this.reportRepo.findOneBy({ id: data.reportId });

    let subject = 'Blog Post Monitor Report';
    let body = data.customMessage || '';

    // Auto-build variables from report data, allow overrides from caller
    const autoVariables = report ? await this.buildReportVariables(report) : {};
    const mergedVariables = { ...autoVariables, ...data.variables };

    // Find supplier template if no templateId specified
    const templateId = data.templateId
      || (await this.templateRepo.findOneBy({ scope: report?.reportScope === 'supplier' ? 'supplier' : 'internal' }))?.id;

    if (templateId) {
      const template = await this.templateRepo.findOneBy({ id: templateId });
      if (template) {
        subject = this.renderTemplate(template.subjectTemplate, mergedVariables);
        body = this.renderTemplate(template.bodyTemplate, mergedVariables);
      }
    }

    // Always save as draft first — requires explicit approval to send
    const log = await this.logRepo.save(
      this.logRepo.create({
        reportId: data.reportId,
        supplierId: data.supplierId || null,
        recipients: data.to,
        ccRecipients: data.cc || null,
        subject,
        body,
        status: 'awaiting_approval',
      }),
    );

    this.logger.log(`Email draft created for ${data.to.join(', ')} — awaiting approval`);

    // If explicitly not a draft (legacy direct send), auto-approve
    if (data.draft === false) {
      return this.approveAndSend(log.id);
    }

    return this.logRepo.findOneByOrFail({ id: log.id });
  }

  async approveAndSend(emailId: string): Promise<EmailLog> {
    const log = await this.logRepo.findOne({
      where: { id: emailId },
      relations: ['report'],
    });
    if (!log) throw new Error('Email not found');
    if (log.status !== 'awaiting_approval') {
      throw new Error(`Email is ${log.status}, not awaiting approval`);
    }

    if (!this.transporter) {
      this.logger.warn('SMTP not configured - email logged but not sent');
      await this.logRepo.update(log.id, { status: 'skipped', errorMessage: 'SMTP not configured' });
      return this.logRepo.findOneByOrFail({ id: log.id });
    }

    try {
      const attachments: { filename: string; path: string }[] = [];
      const report = log.report;
      if (report?.filePath && fs.existsSync(report.filePath)) {
        attachments.push({
          filename: `report-${report.id}.pdf`,
          path: report.filePath,
        });
      }

      await this.transporter.sendMail({
        from: this.config.get('EMAIL_FROM', 'noreply@example.com'),
        to: log.recipients.join(', '),
        cc: log.ccRecipients?.join(', '),
        subject: log.subject,
        text: log.body,
        attachments,
      });

      await this.logRepo.update(log.id, { status: 'sent', sentAt: new Date() });
      this.logger.log(`Email approved and sent to ${log.recipients.join(', ')}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      await this.logRepo.update(log.id, { status: 'failed', errorMessage: message });
      this.logger.error(`Email send failed: ${message}`);
    }

    return this.logRepo.findOneByOrFail({ id: log.id });
  }

  async rejectEmail(emailId: string): Promise<EmailLog> {
    await this.logRepo.update(emailId, { status: 'rejected' });
    return this.logRepo.findOneByOrFail({ id: emailId });
  }
}
