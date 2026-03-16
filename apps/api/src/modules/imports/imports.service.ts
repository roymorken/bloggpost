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

const KNOWN_HEADERS = ['supplier_name', 'blog_post_url', 'supplier_email', 'title', 'date', 'notes', 'keywords'];

@Injectable()
export class ImportsService {
  constructor(
    @InjectRepository(ImportBatch)
    private readonly batchRepo: Repository<ImportBatch>,
    @InjectRepository(BlogPost)
    private readonly blogPostRepo: Repository<BlogPost>,
    private readonly suppliersService: SuppliersService,
  ) {}

  private normalizeRawCsvRows(rawRows: string[][]): ParsedRow[] {
    // Find the column mapping by scanning the first rows for known header names
    const columnMap: Record<string, number> = {};
    let dataStartRow = 0;

    for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
      for (let c = 0; c < rawRows[r].length; c++) {
        const cell = (rawRows[r][c] || '').trim().toLowerCase();
        if (KNOWN_HEADERS.includes(cell) && !(cell in columnMap)) {
          columnMap[cell] = c;
          if (r >= dataStartRow) dataStartRow = r + 1;
        }
      }
    }

    // If standard headers found on row 0, parse normally
    if (columnMap['supplier_name'] !== undefined && columnMap['blog_post_url'] !== undefined && dataStartRow <= 1) {
      return rawRows.slice(dataStartRow).map((cols) => ({
        supplier_name: (cols[columnMap['supplier_name']] || '').trim(),
        blog_post_url: (cols[columnMap['blog_post_url']] || '').trim(),
        supplier_email: columnMap['supplier_email'] !== undefined ? (cols[columnMap['supplier_email']] || '').trim() : undefined,
        title: columnMap['title'] !== undefined ? (cols[columnMap['title']] || '').trim() : undefined,
        date: columnMap['date'] !== undefined ? (cols[columnMap['date']] || '').trim() : undefined,
        notes: columnMap['notes'] !== undefined ? (cols[columnMap['notes']] || '').trim() : undefined,
      }));
    }

    // Headers spread across multiple rows — use discovered column positions
    if (columnMap['blog_post_url'] !== undefined) {
      return rawRows.slice(dataStartRow).map((cols) => ({
        supplier_name: columnMap['supplier_name'] !== undefined
          ? (cols[columnMap['supplier_name']] || '').trim()
          : '',
        blog_post_url: (cols[columnMap['blog_post_url']] || '').trim(),
        supplier_email: columnMap['supplier_email'] !== undefined ? (cols[columnMap['supplier_email']] || '').trim() : undefined,
        title: columnMap['title'] !== undefined ? (cols[columnMap['title']] || '').trim()
          : columnMap['keywords'] !== undefined ? (cols[columnMap['keywords']] || '').trim()
          : undefined,
        date: columnMap['date'] !== undefined ? (cols[columnMap['date']] || '').trim() : undefined,
        notes: columnMap['notes'] !== undefined ? (cols[columnMap['notes']] || '').trim() : undefined,
      }));
    }

    // Fallback: assume first row is header
    return [];
  }

  async parseFile(file: Express.Multer.File): Promise<{ rows: ParsedRow[]; errors: string[] }> {
    const ext = path.extname(file.originalname).toLowerCase();
    let rows: ParsedRow[];

    if (ext === '.csv') {
      // Parse as raw arrays first to handle non-standard header layouts
      const rawRows: string[][] = csvParse(file.buffer, {
        columns: false,
        skip_empty_lines: true,
        trim: true,
      });

      // Check if first row looks like standard headers
      const firstRow = rawRows[0]?.map((c: string) => c.toLowerCase().trim()) || [];
      if (firstRow.includes('supplier_name') && firstRow.includes('blog_post_url')) {
        // Standard format — re-parse with column headers
        rows = csvParse(file.buffer, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });
      } else {
        // Non-standard layout — detect columns from scattered headers
        rows = this.normalizeRawCsvRows(rawRows);
      }
    } else if (['.xls', '.xlsx'].includes(ext)) {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const rawRows: string[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
      const firstRow = rawRows[0]?.map((c: unknown) => String(c || '').toLowerCase().trim()) || [];

      if (firstRow.includes('supplier_name') && firstRow.includes('blog_post_url')) {
        rows = XLSX.utils.sheet_to_json<ParsedRow>(workbook.Sheets[sheetName]);
      } else {
        rows = this.normalizeRawCsvRows(rawRows.map((r) => r.map((c) => String(c || ''))));
      }
    } else {
      throw new BadRequestException(`Unsupported file type: ${ext}`);
    }

    // Filter out empty rows (no URL)
    rows = rows.filter((row) => row.blog_post_url && row.blog_post_url.trim().length > 0);

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

  findAll(): Promise<ImportBatch[]> {
    return this.batchRepo.find({
      relations: ['jobs'],
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: string): Promise<ImportBatch | null> {
    return this.batchRepo.findOne({ where: { id }, relations: ['blogPosts', 'jobs'] });
  }
}
