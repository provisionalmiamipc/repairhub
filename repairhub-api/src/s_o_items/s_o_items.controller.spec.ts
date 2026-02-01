import { Test, TestingModule } from '@nestjs/testing';
import { SOItemsController } from './s_o_items.controller';
import { SOItemsService } from './s_o_items.service';

describe('SOItemsController', () => {
  let controller: SOItemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SOItemsController],
      providers: [SOItemsService],
    }).compile();

    controller = module.get<SOItemsController>(SOItemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
