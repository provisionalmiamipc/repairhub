import { Test, TestingModule } from '@nestjs/testing';
import { DeviceBrandsController } from './device_brands.controller';
import { DeviceBrandsService } from './device_brands.service';

describe('DeviceBrandsController', () => {
  let controller: DeviceBrandsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceBrandsController],
      providers: [DeviceBrandsService],
    }).compile();

    controller = module.get<DeviceBrandsController>(DeviceBrandsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
