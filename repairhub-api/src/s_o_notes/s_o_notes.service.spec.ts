import { Test, TestingModule } from '@nestjs/testing';
import { SONotesService } from './s_o_notes.service';

describe('SONotesService', () => {
  let service: SONotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SONotesService],
    }).compile();

    service = module.get<SONotesService>(SONotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
