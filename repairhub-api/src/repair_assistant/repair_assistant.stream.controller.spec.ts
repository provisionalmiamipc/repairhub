import { EventEmitter } from 'events';
import { RepairAssistantController } from './repair_assistant.controller';

function createReqRes() {
  const req = new EventEmitter() as any;
  const writes: string[] = [];
  const res: any = {
    status: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
    flushHeaders: jest.fn(),
    write: jest.fn((chunk: string) => {
      writes.push(chunk);
      return true;
    }),
    end: jest.fn(),
  };
  return { req, res, writes };
}

describe('RepairAssistantController SSE', () => {
  const repairAssistantService = { extractTextFromPdf: jest.fn() };
  const manualAnalyzerService = { analyzeManual: jest.fn() };
  const webSearchService = { searchWeb: jest.fn() };
  const orchestrator = {
    recommend: jest.fn(),
    recommendWithEvidence: jest.fn(),
    finalizeAndPersist: jest.fn(),
  };
  const llmService = {
    streamRepairPlanOrNull: jest.fn(),
    generateRepairPlan: jest.fn(),
  };

  let controller: RepairAssistantController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new RepairAssistantController(
      repairAssistantService as any,
      manualAnalyzerService as any,
      webSearchService as any,
      orchestrator as any,
      llmService as any,
    );
  });

  it('sends heuristic meta + final + done when LLM stream is unavailable', async () => {
    const pack = {
      serviceOrderId: 123,
      context: { device: 'Laptop', defect: 'no enciende' },
      evidence: [],
      heuristicPlan: {
        origin: 'web',
        probableDiagnosis: 'heuristic',
        recommendedProcedure: [],
        testsToPerform: [],
        requiredTools: [],
        risksAndPrecautions: [],
        sources: [],
        confidence: 'low',
        notes: [],
      },
    };
    orchestrator.recommendWithEvidence.mockResolvedValue(pack);
    llmService.streamRepairPlanOrNull.mockResolvedValue(null);
    orchestrator.finalizeAndPersist.mockResolvedValue(pack.heuristicPlan);

    const { req, res, writes } = createReqRes();
    await controller.recommendStream({ serviceOrderId: '123' } as any, req, res);

    expect(writes.join('')).toContain('event: meta');
    expect(writes.join('')).toContain('"engine":"heuristic"');
    expect(writes.join('')).toContain('event: final');
    expect(writes.join('')).toContain('event: done');
    expect(res.end).toHaveBeenCalled();
  });

  it('streams chunks and emits final when LLM stream succeeds', async () => {
    const pack = {
      serviceOrderId: 123,
      context: { device: 'Laptop', defect: 'no enciende' },
      evidence: [],
      heuristicPlan: {
        origin: 'web',
        probableDiagnosis: 'heuristic',
        recommendedProcedure: [],
        testsToPerform: [],
        requiredTools: [],
        risksAndPrecautions: [],
        sources: [],
        confidence: 'low',
        notes: [],
      },
    };
    const llmPlan = {
      origin: 'manual',
      probableDiagnosis: 'llm',
      recommendedProcedure: ['a'],
      testsToPerform: ['b'],
      requiredTools: ['c'],
      risksAndPrecautions: ['d'],
      sources: [{ type: 'manual', ref: 'document:1' }],
      confidence: 'medium',
      notes: [],
    };

    async function* streamGen() {
      yield { type: 'text_delta', text: 'hola ' };
      yield { type: 'text_delta', text: 'mundo' };
      yield { type: 'final_json', json: llmPlan };
    }

    orchestrator.recommendWithEvidence.mockResolvedValue(pack);
    llmService.streamRepairPlanOrNull.mockResolvedValue(streamGen());
    orchestrator.finalizeAndPersist.mockResolvedValue(llmPlan);

    const { req, res, writes } = createReqRes();
    await controller.recommendStream({ serviceOrderId: '123' } as any, req, res);

    const output = writes.join('');
    expect(output).toContain('event: chunk');
    expect(output).toContain('hola ');
    expect(output).toContain('event: final');
    expect(output).toContain('"probableDiagnosis":"llm"');
  });

  it('emits error and falls back to heuristic when stream fails mid-way', async () => {
    const pack = {
      serviceOrderId: 123,
      context: { device: 'Laptop', defect: 'no enciende' },
      evidence: [],
      heuristicPlan: {
        origin: 'web',
        probableDiagnosis: 'heuristic',
        recommendedProcedure: [],
        testsToPerform: [],
        requiredTools: [],
        risksAndPrecautions: [],
        sources: [],
        confidence: 'low',
        notes: [],
      },
    };

    async function* failingStream() {
      yield { type: 'text_delta', text: 'parcial ' };
      throw new Error('stream exploded');
    }

    orchestrator.recommendWithEvidence.mockResolvedValue(pack);
    llmService.streamRepairPlanOrNull.mockResolvedValue(failingStream());
    orchestrator.finalizeAndPersist.mockResolvedValue(pack.heuristicPlan);

    const { req, res, writes } = createReqRes();
    await controller.recommendStream({ serviceOrderId: '123' } as any, req, res);

    const output = writes.join('');
    expect(output).toContain('event: error');
    expect(output).toContain('event: final');
    expect(output).toContain('"probableDiagnosis":"heuristic"');
  });
});
