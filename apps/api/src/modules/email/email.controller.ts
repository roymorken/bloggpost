import { Controller, Get, Patch, Post, Param, Body } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller()
export class EmailController {
  constructor(private readonly service: EmailService) {}

  @Get('email-templates')
  findAllTemplates() {
    return this.service.findAllTemplates();
  }

  @Patch('email-templates/:id')
  updateTemplate(
    @Param('id') id: string,
    @Body() body: { subjectTemplate?: string; bodyTemplate?: string },
  ) {
    return this.service.updateTemplate(id, body);
  }

  @Get('emails')
  findAllEmails() {
    return this.service.findAllEmails();
  }

  @Post('emails/draft-report')
  draftReport(
    @Body() body: { reportId: string; supplierId?: string; to: string[]; cc?: string[] },
  ) {
    return this.service.sendReport({ ...body, draft: true });
  }

  @Post('emails/:id/approve')
  approveEmail(@Param('id') id: string) {
    return this.service.approveAndSend(id);
  }

  @Post('emails/:id/reject')
  rejectEmail(@Param('id') id: string) {
    return this.service.rejectEmail(id);
  }

  @Post('emails/send-report')
  sendReport(
    @Body() body: { reportId: string; supplierId?: string; to: string[]; cc?: string[]; customMessage?: string },
  ) {
    return this.service.sendReport(body);
  }
}
