import { Test, TestingModule } from '@nestjs/testing';
import { ServiceOrdersRequestedController } from './service_orders_requested.controller';
import { ServiceOrdersRequestedService } from './service_orders_requested.service';

describe('ServiceOrdersRequestedController', () => {
  let controller: ServiceOrdersRequestedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceOrdersRequestedController],
      providers: [ServiceOrdersRequestedService],
    }).compile();

    controller = module.get<ServiceOrdersRequestedController>(ServiceOrdersRequestedController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
