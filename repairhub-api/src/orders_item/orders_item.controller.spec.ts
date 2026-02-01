import { Test, TestingModule } from '@nestjs/testing';
import { OrdersItemController } from './orders_item.controller';
import { OrdersItemService } from './orders_item.service';

describe('OrdersItemController', () => {
  let controller: OrdersItemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersItemController],
      providers: [OrdersItemService],
    }).compile();

    controller = module.get<OrdersItemController>(OrdersItemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
