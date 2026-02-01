import { Test, TestingModule } from '@nestjs/testing';
import { RepairStatusService } from './repair_status.service';

describe('RepairStatusService', () => {
  let service: RepairStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RepairStatusService],
    }).compile();

    service = module.get<RepairStatusService>(RepairStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
