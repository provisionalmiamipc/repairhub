import { Test, TestingModule } from '@nestjs/testing';
import { RepairStatusController } from './repair_status.controller';
import { RepairStatusService } from './repair_status.service';

describe('RepairStatusController', () => {
  let controller: RepairStatusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepairStatusController],
      providers: [RepairStatusService],
    }).compile();

    controller = module.get<RepairStatusController>(RepairStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
