import { Test, TestingModule } from '@nestjs/testing';
import { ItemTypesController } from './item_types.controller';
import { ItemTypesService } from './item_types.service';

describe('ItemTypesController', () => {
  let controller: ItemTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemTypesController],
      providers: [ItemTypesService],
    }).compile();

    controller = module.get<ItemTypesController>(ItemTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
