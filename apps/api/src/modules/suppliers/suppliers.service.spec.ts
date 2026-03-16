import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SuppliersService } from './suppliers.service';
import { Supplier } from '../../database/entities';

const mockRepo = () => ({
  find: jest.fn(),
  findOneBy: jest.fn(),
  findOneByOrFail: jest.fn(),
  create: jest.fn((dto) => dto),
  save: jest.fn((entity) => Promise.resolve({ id: 'test-uuid', ...entity })),
  update: jest.fn(),
});

describe('SuppliersService', () => {
  let service: SuppliersService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    repo = mockRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        { provide: getRepositoryToken(Supplier), useValue: repo },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
  });

  it('should find all suppliers ordered by name', async () => {
    repo.find.mockResolvedValue([]);
    const result = await service.findAll();
    expect(repo.find).toHaveBeenCalledWith({ order: { supplierName: 'ASC' } });
    expect(result).toEqual([]);
  });

  it('should create a supplier', async () => {
    const data = { supplierName: 'Test Supplier' };
    const result = await service.create(data);
    expect(repo.create).toHaveBeenCalledWith(data);
    expect(result).toHaveProperty('supplierName', 'Test Supplier');
  });

  it('should find or create by name - existing', async () => {
    const existing = { id: '123', supplierName: 'Existing' };
    repo.findOneBy.mockResolvedValue(existing);
    const result = await service.findOrCreateByName('Existing');
    expect(result).toEqual(existing);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should find or create by name - new', async () => {
    repo.findOneBy.mockResolvedValue(null);
    await service.findOrCreateByName('New Supplier');
    expect(repo.save).toHaveBeenCalled();
  });

  it('should update a supplier', async () => {
    const updated = { id: '123', supplierName: 'Updated' };
    repo.findOneByOrFail.mockResolvedValue(updated);
    const result = await service.update('123', { supplierName: 'Updated' });
    expect(repo.update).toHaveBeenCalledWith('123', { supplierName: 'Updated' });
    expect(result).toEqual(updated);
  });
});
