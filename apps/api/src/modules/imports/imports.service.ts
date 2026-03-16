import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImportBatch, BlogPost } from '../../database/entities';
import { SuppliersService } from '../suppliers/suppliers.service';
import * as XLSX from 'xlsx';
import { parse as csvParse } from 'csv-parse/sync';
import * as path from 'path';

interface ParsedRow {
  supplier_name: string;
  blog_post_url: string;
  supplier_email?: string;
  title?: string;
  date?: string;
  notes?: string;
}

@Injectable()
export class ImportsService {
  constructor(
    @InjectRepository(ImportBatch)
    private readonly batchRepo: Repository<ImportBatch>,
    @InjectRepository(BlogPost)
    private readonly blogPostRepo: Repository<BlogPost>,
    private readonly suppliersService: SuppliersService,
  ) {}

  async parseFile(file: Express.Multer.File): Promise<{ rows: ParsedRow[]; errors: string[] }> {
    const ext = path.extname(file.originalname).toLowerCase();
    let rows: ParsedRow[];

    if (ext === '.csv') {
      rows = csvParse(file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } else if (['.xls', '.xlsx'].includes(ext)) {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      rows = XLSX.utils.sheet_to_json<ParsedRow>(workbook.Sheets[sheetName]);
    } else {
      throw new BadRequestException(`Unsupported file type: ${ext}`);
    }

    const errors: string[] = [];
    rows.forEach((row, i) => {
      if (!row.supplier_name) errors.push(`Row ${i + 1}: missing supplier_name`);
      if (!row.blog_post_url) errors.push(`Row ${i + 1}: missing blog_post_url`);
    });

    return { rows, errors };
  }

  async createBatchFromRows(
    filename: string,
    fileType: string,
    rows: ParsedRow[],
  ): Promise<ImportBatch> {
    const batch = await this.batchRepo.save(
      this.batchRepo.create({
        filename,
        fileType,
        rowCount: rows.length,
        status: 'validated',
      }),
    );

    for (const row of rows) {
      const supplier = await this.suppliersService.findOrCreateByName(row.supplier_name);

      if (row.supplier_email && !supplier.primaryEmail) {
        await this.suppliersService.update(supplier.id, { primaryEmail: row.supplier_email });
      }

      await this.blogPostRepo.save(
        this.blogPostRepo.create({
          importBatchId: batch.id,
          supplierId: supplier.id,
          blogPostUrl: row.blog_post_url,
          title: row.title || null,
          sourceDate: row.date ? new Date(row.date) : null,
          notes: row.notes || null,
        }),
      );
    }

    return batch;
  }

  findById(id: string): Promise<ImportBatch | null> {
    return this.batchRepo.findOne({ where: { id }, relations: ['blogPosts'] });
  }
}
