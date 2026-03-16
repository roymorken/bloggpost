import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ImportsService } from './imports.service';
import { ImportBatch, BlogPost } from '../../database/entities';
import { SuppliersService } from '../suppliers/suppliers.service';

describe('ImportsService', () => {
  let service: ImportsService;

  const mockBatchRepo = {
    create: jest.fn((dto) => dto),
    save: jest.fn((entity) => Promise.resolve({ id: 'batch-1', ...entity })),
    findOne: jest.fn(),
  };

  const mockBlogPostRepo = {
    create: jest.fn((dto) => dto),
    save: jest.fn((entity) => Promise.resolve({ id: 'bp-1', ...entity })),
  };

  const mockSuppliersService = {
    findOrCreateByName: jest.fn((name: string) =>
      Promise.resolve({ id: `supplier-${name}`, supplierName: name, primaryEmail: null }),
    ),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportsService,
        { provide: getRepositoryToken(ImportBatch), useValue: mockBatchRepo },
        { provide: getRepositoryToken(BlogPost), useValue: mockBlogPostRepo },
        { provide: SuppliersService, useValue: mockSuppliersService },
      ],
    }).compile();

    service = module.get<ImportsService>(ImportsService);
  });

  describe('parseFile', () => {
    it('should parse CSV buffer', async () => {
      const csvContent = 'supplier_name,blog_post_url\nAcme,https://example.com/post1';
      const file = {
        buffer: Buffer.from(csvContent),
        originalname: 'test.csv',
        mimetype: 'text/csv',
      } as Express.Multer.File;

      const result = await service.parseFile(file);
      expect(result.rows).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.rows[0].supplier_name).toBe('Acme');
    });

    it('should return errors for missing required fields', async () => {
      const csvContent = 'supplier_name,blog_post_url\n,https://example.com\nAcme,';
      const file = {
        buffer: Buffer.from(csvContent),
        originalname: 'test.csv',
        mimetype: 'text/csv',
      } as Express.Multer.File;

      const result = await service.parseFile(file);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject unsupported file types', async () => {
      const file = {
        buffer: Buffer.from('test'),
        originalname: 'test.txt',
        mimetype: 'text/plain',
      } as Express.Multer.File;

      await expect(service.parseFile(file)).rejects.toThrow('Unsupported file type');
    });
  });

  describe('createBatchFromRows', () => {
    it('should create batch and blog posts', async () => {
      const rows = [
        { supplier_name: 'Acme', blog_post_url: 'https://example.com/1' },
        { supplier_name: 'Acme', blog_post_url: 'https://example.com/2' },
      ];

      const batch = await service.createBatchFromRows('test.csv', 'text/csv', rows);

      expect(batch).toHaveProperty('id');
      expect(mockBatchRepo.save).toHaveBeenCalledTimes(1);
      expect(mockBlogPostRepo.save).toHaveBeenCalledTimes(2);
      expect(mockSuppliersService.findOrCreateByName).toHaveBeenCalledWith('Acme');
    });
  });
});
