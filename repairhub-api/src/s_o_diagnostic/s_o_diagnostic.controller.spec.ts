import { Test, TestingModule } from '@nestjs/testing';
import { SODiagnosticController } from './s_o_diagnostic.controller';
import { SODiagnosticService } from './s_o_diagnostic.service';

describe('SODiagnosticController', () => {
  let controller: SODiagnosticController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SODiagnosticController],
      providers: [SODiagnosticService],
    }).compile();

    controller = module.get<SODiagnosticController>(SODiagnosticController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
