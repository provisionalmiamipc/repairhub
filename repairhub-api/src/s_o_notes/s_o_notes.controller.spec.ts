import { Test, TestingModule } from '@nestjs/testing';
import { SONotesController } from './s_o_notes.controller';
import { SONotesService } from './s_o_notes.service';

describe('SONotesController', () => {
  let controller: SONotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SONotesController],
      providers: [SONotesService],
    }).compile();

    controller = module.get<SONotesController>(SONotesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
