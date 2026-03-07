import { LlmService } from './llm.service';

describe('LlmService', () => {
  const provider = {
    generateRepairPlan: jest.fn(),
  };

  const input: any = {
    equipment: {
      device: 'Laptop',
      brand: 'Dell',
      model: 'Latitude',
      defect: 'no enciende',
    },
    evidence: [{ type: 'case', ref: 'repair_case:1', text: 'No power symptom' }],
    heuristicPlan: {
      origin: 'internal_case',
      probableDiagnosis: 'heuristic',
      recommendedProcedure: ['step'],
      testsToPerform: ['test'],
      requiredTools: ['tool'],
      risksAndPrecautions: ['risk'],
      sources: [{ type: 'case', ref: 'repair_case:1' }],
      confidence: 'medium',
      notes: [],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when GROQ_API_KEY is missing (heuristic fallback)', async () => {
    const service = new LlmService(
      {
        enabled: true,
        provider: 'groq',
        groqApiKey: undefined,
        model: 'llama-3.1-8b-instant',
        timeoutMs: 12000,
      } as any,
      provider as any,
    );

    const result = await service.generateRepairPlan(input);

    expect(result).toBeNull();
    expect(provider.generateRepairPlan).not.toHaveBeenCalled();
  });

  it('returns null when Groq provider fails (heuristic fallback)', async () => {
    provider.generateRepairPlan.mockRejectedValue(new Error('RATE_LIMIT'));
    const service = new LlmService(
      {
        enabled: true,
        provider: 'groq',
        groqApiKey: 'key',
        model: 'llama-3.1-8b-instant',
        timeoutMs: 12000,
      } as any,
      provider as any,
    );

    const result = await service.generateRepairPlan(input);

    expect(result).toBeNull();
    expect(provider.generateRepairPlan).toHaveBeenCalled();
  });

  it('returns llm plan when Groq provider succeeds', async () => {
    provider.generateRepairPlan.mockResolvedValue({
      origin: 'manual',
      probableDiagnosis: 'LLM diagnosis',
      recommendedProcedure: ['LLM step'],
      testsToPerform: ['LLM test'],
      requiredTools: ['LLM tool'],
      risksAndPrecautions: ['LLM risk'],
      sources: [{ type: 'manual', ref: 'document:1', page: 2 }],
      confidence: 'medium',
      notes: ['LLM generated'],
    });

    const service = new LlmService(
      {
        enabled: true,
        provider: 'groq',
        groqApiKey: 'key',
        model: 'llama-3.1-8b-instant',
        timeoutMs: 12000,
      } as any,
      provider as any,
    );

    const result = await service.generateRepairPlan(input);

    expect(result?.probableDiagnosis).toBe('LLM diagnosis');
    expect(provider.generateRepairPlan).toHaveBeenCalled();
  });
});
