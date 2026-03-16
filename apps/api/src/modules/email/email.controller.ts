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

  @Post('emails/send-report')
  sendReport(
    @Body() body: { reportId: string; supplierId?: string; to: string[]; cc?: string[]; customMessage?: string },
  ) {
    return this.service.sendReport(body);
  }
}
