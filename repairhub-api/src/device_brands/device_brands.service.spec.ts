import { Test, TestingModule } from '@nestjs/testing';
import { DeviceBrandsService } from './device_brands.service';

describe('DeviceBrandsService', () => {
  let service: DeviceBrandsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeviceBrandsService],
    }).compile();

    service = module.get<DeviceBrandsService>(DeviceBrandsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
