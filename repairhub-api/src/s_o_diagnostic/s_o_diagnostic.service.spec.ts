import { Test, TestingModule } from '@nestjs/testing';
import { SODiagnosticService } from './s_o_diagnostic.service';

describe('SODiagnosticService', () => {
  let service: SODiagnosticService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SODiagnosticService],
    }).compile();

    service = module.get<SODiagnosticService>(SODiagnosticService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
