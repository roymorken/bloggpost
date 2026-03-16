import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTemplate, EmailLog, Report, BlogPostCheck, ExtractedLink, Supplier } from '../../database/entities';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmailTemplate, EmailLog, Report, BlogPostCheck, ExtractedLink, Supplier])],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
