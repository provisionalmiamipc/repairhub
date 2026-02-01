import { Test, TestingModule } from '@nestjs/testing';
import { SOItemsService } from './s_o_items.service';

describe('SOItemsService', () => {
  let service: SOItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SOItemsService],
    }).compile();

    service = module.get<SOItemsService>(SOItemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
