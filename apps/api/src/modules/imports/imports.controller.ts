import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportsService } from './imports.service';

@Controller('imports')
export class ImportsController {
  constructor(private readonly service: ImportsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const { rows, errors } = await this.service.parseFile(file);
    if (errors.length > 0) {
      return { status: 'validation_error', errors, rowCount: rows.length };
    }

    const batch = await this.service.createBatchFromRows(
      file.originalname,
      file.mimetype,
      rows,
    );

    return {
      importBatchId: batch.id,
      rowCount: batch.rowCount,
      status: batch.status,
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
