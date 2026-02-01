import { Test, TestingModule } from '@nestjs/testing';
import { ServiceOrdersController } from './service_orders.controller';
import { ServiceOrdersService } from './service_orders.service';

describe('ServiceOrdersController', () => {
  let controller: ServiceOrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceOrdersController],
      providers: [ServiceOrdersService],
    }).compile();

    controller = module.get<ServiceOrdersController>(ServiceOrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
