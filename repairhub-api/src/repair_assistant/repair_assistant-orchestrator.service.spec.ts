import { RepairAssistantOrchestratorService } from './repair_assistant-orchestrator.service';

describe('RepairAssistantOrchestratorService', () => {
  const serviceOrderRepository = { findOne: jest.fn() };
  const repairCaseRepository = { find: jest.fn() };
  const retrievalLogRepository = { create: jest.fn((v) => v), save: jest.fn() };
  const chatMessageRepository = { create: jest.fn((v) => v), save: jest.fn() };
  const manualAnalyzerService = { analyzeManual: jest.fn() };
  const webSearchService = { searchWeb: jest.fn() };
  const llmService = { generateRepairPlan: jest.fn() };

  let service: RepairAssistantOrchestratorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RepairAssistantOrchestratorService(
      serviceOrderRepository as any,
      repairCaseRepository as any,
      retrievalLogRepository as any,
      chatMessageRepository as any,
      manualAnalyzerService as any,
      webSearchService as any,
      llmService as any,
    );
    llmService.generateRepairPlan.mockResolvedValue(null);

    serviceOrderRepository.findOne.mockResolvedValue({
      id: 1,
      model: 'Latitude 5420',
      defectivePart: 'no enciende',
      device: { name: 'Laptop' },
      deviceBrand: { name: 'Dell' },
    });
  });

  it('uses internal_case when strong match exists', async () => {
    repairCaseRepository.find.mockResolvedValue([
      {
        id: 10,
        brand: 'Dell',
        model: 'Latitude 5420',
        defect: 'no enciende',
        symptoms: 'no enciende y sin power',
        rootCause: 'Fusible de entrada abierto',
        resolutionSteps: ['reemplazar fusible'],
      },
    ]);

    const result = await service.recommend({ serviceOrderId: '1' });

    expect(result.origin).toBe('internal_case');
    expect(manualAnalyzerService.analyzeManual).not.toHaveBeenCalled();
    expect(webSearchService.searchWeb).not.toHaveBeenCalled();
    expect(chatMessageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: expect.objectContaining({ engineUsed: 'heuristic' }),
      }),
    );
  });

  it('uses manual when case is weak and manual is sufficient', async () => {
    repairCaseRepository.find.mockResolvedValue([
      {
        id: 11,
        brand: 'Other',
        model: 'Other',
        defect: 'random issue',
        symptoms: 'unrelated symptom',
        rootCause: null,
        resolutionSteps: null,
      },
    ]);
    manualAnalyzerService.analyzeManual.mockResolvedValue({
      probableDiagnosis: 'Falla de conector DC',
      recommendedProcedure: ['revisar conector'],
      testsToPerform: ['medir voltaje'],
      requiredTools: ['multimetro'],
      risksAndPrecautions: ['ESD'],
      relatedManualPages: [
        { documentId: '1', page: 4, excerpt: 'power input' },
        { documentId: '1', page: 5, excerpt: 'dc jack' },
        { documentId: '1', page: 6, excerpt: 'fuse' },
        { documentId: '1', page: 7, excerpt: 'replace' },
      ],
      confidence: 'medium',
      notes: [],
    });

    const result = await service.recommend({ serviceOrderId: '1' });

    expect(result.origin).toBe('manual');
    expect(webSearchService.searchWeb).not.toHaveBeenCalled();
  });

  it('falls back to web when manual is unavailable', async () => {
    repairCaseRepository.find.mockResolvedValue([]);
    manualAnalyzerService.analyzeManual.mockRejectedValue(new Error('No docs'));
    webSearchService.searchWeb.mockResolvedValue({
      possibleCause: 'Posible falla en fuente',
      suggestedProcedure: ['check adapter', 'test power rail'],
      sources: [
        { title: 'Repair forum', url: 'https://forum.example.com/a', sourceType: 'forum' },
        { title: 'Support article', url: 'https://support.example.com/b', sourceType: 'article' },
      ],
      confidence: 'medium',
      notes: [],
    });

    const result = await service.recommend({ serviceOrderId: '1' });

    expect(result.origin).toBe('web');
    expect(webSearchService.searchWeb).toHaveBeenCalled();
  });

  it('uses llm result when available', async () => {
    repairCaseRepository.find.mockResolvedValue([
      {
        id: 10,
        brand: 'Dell',
        model: 'Latitude 5420',
        defect: 'no enciende',
        symptoms: 'no enciende y sin power',
        rootCause: 'Fusible de entrada abierto',
        resolutionSteps: ['reemplazar fusible'],
      },
    ]);
    llmService.generateRepairPlan.mockResolvedValue({
      origin: 'internal_case',
      probableDiagnosis: 'Diagnostico por LLM anclado',
      recommendedProcedure: ['Paso LLM 1'],
      testsToPerform: ['Test LLM'],
      requiredTools: ['Multimetro'],
      risksAndPrecautions: ['ESD'],
      sources: [{ type: 'case', ref: 'repair_case:10' }],
      confidence: 'high',
      notes: ['Usando evidencia de caso interno'],
    });

    const result = await service.recommend({ serviceOrderId: '1' });

    expect(result.probableDiagnosis).toBe('Diagnostico por LLM anclado');
    expect(chatMessageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: expect.objectContaining({ engineUsed: 'llm' }),
      }),
    );
  });
});
