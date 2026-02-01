import { Test, TestingModule } from '@nestjs/testing';
import { ServiceOrdersRequestedService } from './service_orders_requested.service';

describe('ServiceOrdersRequestedService', () => {
  let service: ServiceOrdersRequestedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceOrdersRequestedService],
    }).compile();

    service = module.get<ServiceOrdersRequestedService>(ServiceOrdersRequestedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
