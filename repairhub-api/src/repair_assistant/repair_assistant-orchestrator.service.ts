import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecommendDto } from './dto/recommend.dto';
import { RepairCase } from '../repair_cases/entities/repair_case.entity';
import { ServiceOrder } from '../service_orders/entities/service_order.entity';
import { RetrievalLog } from '../retrieval_log/entities/retrieval_log.entity';
import { ChatMessage } from '../chat_messages/entities/chat_message.entity';
import { ManualAnalyzerService } from './manual-analyzer.service';
import { WebSearchService } from './web-search/web-search.service';
import { AnalyzeManualDto } from './dto/analyze-manual.dto';
import { SearchWebDto } from './dto/search-web.dto';
import { LlmInput, LlmService, RepairPlanOutput } from '../llm/llm.service';

type FinalRecommendation = RepairPlanOutput;

type ScoredCase = {
  caseRow: RepairCase;
  score: number;
};
type RetrievalStrategy = 'case' | 'manual' | 'web' | 'llm' | 'heuristic';

export type RecommendEvidencePack = {
  serviceOrderId: number;
  context: {
    device: string;
    brand?: string;
    model?: string;
    defect: string;
  };
  evidence: LlmInput['evidence'];
  heuristicPlan: FinalRecommendation;
};

@Injectable()
export class RepairAssistantOrchestratorService {
  private readonly CASE_STRONG_THRESHOLD = 0.65;
  private readonly MANUAL_SUFFICIENT_THRESHOLD = 0.7;
  private readonly WEB_SUFFICIENT_THRESHOLD = 0.5;

  constructor(
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
    @InjectRepository(RepairCase)
    private readonly repairCaseRepository: Repository<RepairCase>,
    @InjectRepository(RetrievalLog)
    private readonly retrievalLogRepository: Repository<RetrievalLog>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    private readonly manualAnalyzerService: ManualAnalyzerService,
    private readonly webSearchService: WebSearchService,
    private readonly llmService: LlmService,
  ) {}

  private tokenize(text?: string): string[] {
    if (!text) return [];
    return text
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((t) => t.length >= 3);
  }

  private overlapScore(base: string[], against: string[]) {
    if (!base.length || !against.length) return 0;
    const set = new Set(against);
    const matches = base.filter((token) => set.has(token)).length;
    return matches / Math.max(base.length, 1);
  }

  private scoreRepairCase(
    caseRow: RepairCase,
    context: { brand?: string; model?: string; defect: string },
  ): number {
    const brandScore =
      context.brand && caseRow.brand.toLowerCase().includes(context.brand.toLowerCase()) ? 0.15 : 0;
    const modelScore =
      context.model && caseRow.model.toLowerCase().includes(context.model.toLowerCase()) ? 0.15 : 0;

    const defectTokens = this.tokenize(context.defect);
    const caseDefectTokens = this.tokenize(caseRow.defect);
    const caseSymptomsTokens = this.tokenize(caseRow.symptoms);

    const defectMatch = this.overlapScore(defectTokens, caseDefectTokens) * 0.45;
    const symptomsMatch = this.overlapScore(defectTokens, caseSymptomsTokens) * 0.25;

    return Math.min(1, brandScore + modelScore + defectMatch + symptomsMatch);
  }

  private async logRetrieval(
    serviceOrderId: number,
    strategy: RetrievalStrategy,
    score: number,
    meta: Record<string, unknown>,
  ) {
    const row = this.retrievalLogRepository.create();
    row.serviceOrderId = serviceOrderId;
    row.strategy = strategy as RetrievalLog['strategy'];
    row.score = score;
    row.meta = meta;
    await this.retrievalLogRepository.save(row);
  }

  private inferToolsFromText(text: string) {
    const candidates = ['multimeter', 'screwdriver', 'torx', 'esd', 'thermal paste'];
    return candidates
      .filter((tool) => text.toLowerCase().includes(tool))
      .map((tool) => `Prepare ${tool}`);
  }

  private confidenceToScore(confidence: 'high' | 'medium' | 'low') {
    if (confidence === 'high') return 1;
    if (confidence === 'medium') return 0.7;
    return 0.4;
  }

  private async saveRecommendationToChat(
    serviceOrderId: number,
    payload: FinalRecommendation,
    meta: { engineUsed: 'llm' | 'heuristic'; streamed: boolean; streamFailed?: boolean },
  ) {
    const message = this.chatMessageRepository.create();
    message.serviceOrderId = serviceOrderId;
    message.content = `ASSISTANT_RECOMMEND_JSON: ${JSON.stringify(payload)}`;
    message.meta = meta;
    await this.chatMessageRepository.save(message);
  }

  private mapManualScore(manualResult: any): number {
    const base =
      manualResult.confidence === 'high' ? 0.85 : manualResult.confidence === 'medium' ? 0.6 : 0.3;
    const evidenceBoost = Math.min((manualResult.relatedManualPages?.length ?? 0) * 0.03, 0.15);
    return Math.min(1, base + evidenceBoost);
  }

  private mapWebScore(webResult: any): number {
    const base = webResult.confidence === 'medium' ? 0.5 : 0.3;
    const sourceBoost = Math.min((webResult.sources?.length ?? 0) * 0.04, 0.2);
    return Math.min(1, base + sourceBoost);
  }

  private isManualSufficient(manualResult: any, manualScore: number): boolean {
    const hasEnoughEvidence =
      (manualResult.relatedManualPages?.length ?? 0) >= 3 || manualResult.confidence === 'high';
    return manualScore >= this.MANUAL_SUFFICIENT_THRESHOLD && hasEnoughEvidence;
  }

  private isWebSufficient(webResult: any, webScore: number): boolean {
    return webScore >= this.WEB_SUFFICIENT_THRESHOLD && (webResult.sources?.length ?? 0) >= 2;
  }

  private buildFromCase(scored: ScoredCase, notes: string[]): FinalRecommendation {
    const caseRow = scored.caseRow;
    const fallbackProcedure = caseRow.resolutionSteps?.map((step) => String(step)) ?? [
      'Run basic diagnostics based on the reported symptoms and confirm root cause.',
    ];

    const textBlock = `${caseRow.defect} ${caseRow.symptoms} ${caseRow.rootCause ?? ''}`;
    const tools = this.inferToolsFromText(textBlock);

    return {
      origin: 'internal_case',
      probableDiagnosis: caseRow.rootCause || `Internal case match for defect: ${caseRow.defect}`,
      recommendedProcedure: fallbackProcedure,
      testsToPerform: [
        `Validate reported symptoms: ${caseRow.symptoms.slice(0, 180)}`,
        'Run a functional test after each corrective step.',
      ],
      requiredTools: tools.length ? tools : ['Multimeter and basic disassembly tools'],
      risksAndPrecautions: ['Disconnect power and follow ESD procedures.'],
      sources: [
        {
          type: 'case',
          ref: `repair_case:${caseRow.id}`,
          excerpt: caseRow.symptoms.slice(0, 260),
        },
      ],
      confidence: scored.score >= 0.8 ? 'high' : 'medium',
      notes,
    };
  }

  private buildFromManual(manualResult: any, notes: string[]): FinalRecommendation {
    return {
      origin: 'manual',
      probableDiagnosis: manualResult.probableDiagnosis,
      recommendedProcedure: manualResult.recommendedProcedure,
      testsToPerform: manualResult.testsToPerform,
      requiredTools: manualResult.requiredTools,
      risksAndPrecautions: manualResult.risksAndPrecautions,
      sources: (manualResult.relatedManualPages ?? []).map((p: any) => ({
        type: 'manual' as const,
        ref: `document:${p.documentId}`,
        excerpt: p.excerpt,
        page: p.page ?? null,
      })),
      confidence: manualResult.confidence,
      notes: [...notes, ...(manualResult.notes ?? [])],
    };
  }

  private buildFromWeb(webResult: any, notes: string[]): FinalRecommendation {
    return {
      origin: 'web',
      probableDiagnosis: webResult.possibleCause,
      recommendedProcedure: webResult.suggestedProcedure,
      testsToPerform: ['Validate each step using measurements and controlled bench tests.'],
      requiredTools: ['Basic diagnostic tools for this equipment type'],
      risksAndPrecautions: ['Verify source reliability before applying irreversible actions.'],
      sources: (webResult.sources ?? []).map((s: any) => ({
        type: 'web' as const,
        ref: s.title,
        url: s.url,
      })),
      confidence: webResult.confidence,
      notes: [...notes, ...(webResult.notes ?? [])],
    };
  }

  async recommendWithEvidence(dto: RecommendDto): Promise<RecommendEvidencePack> {
    const serviceOrderId = Number(dto.serviceOrderId);
    if (!Number.isInteger(serviceOrderId) || serviceOrderId <= 0) {
      throw new BadRequestException('Invalid serviceOrderId');
    }

    const serviceOrder = await this.serviceOrderRepository.findOne({
      where: { id: serviceOrderId },
      relations: ['device', 'deviceBrand'],
    });
    if (!serviceOrder) throw new NotFoundException(`service_order ${serviceOrderId} not found`);

    const context = {
      device: dto.device || serviceOrder.device?.name || 'Unknown device',
      brand: dto.brand || serviceOrder.deviceBrand?.name || '',
      model: dto.model || serviceOrder.model || '',
      defect: dto.defect || serviceOrder.defectivePart || '',
    };
    if (!context.defect) {
      throw new BadRequestException(
        'defect must be provided or defectivePart must exist in service_order',
      );
    }

    const notes: string[] = [];
    const evidence: LlmInput['evidence'] = [];

    const cases = await this.repairCaseRepository.find();
    const scoredCases: ScoredCase[] = cases
      .map((caseRow) => ({ caseRow, score: this.scoreRepairCase(caseRow, context) }))
      .sort((a, b) => b.score - a.score);
    const bestCase = scoredCases[0];
    const caseScore = bestCase?.score ?? 0;
    await this.logRetrieval(serviceOrderId, 'case', caseScore, {
      bestCaseId: bestCase?.caseRow.id ?? null,
      candidates: scoredCases.slice(0, 3).map((c) => ({ id: c.caseRow.id, score: c.score })),
    });

    scoredCases.slice(0, 3).forEach((item) => {
      evidence.push({
        type: 'case',
        ref: `repair_case:${item.caseRow.id}`,
        text: `${item.caseRow.defect}. ${item.caseRow.symptoms}. ${item.caseRow.rootCause ?? ''}`.slice(
          0,
          600,
        ),
      });
    });

    if (bestCase && caseScore >= this.CASE_STRONG_THRESHOLD) {
      notes.push(
        `Strong internal case match found: ${bestCase.caseRow.id} (score ${caseScore.toFixed(2)}).`,
      );
      return {
        serviceOrderId,
        context,
        evidence,
        heuristicPlan: this.buildFromCase(bestCase, notes),
      };
    }

    notes.push('No strong internal case match; trying manual analysis.');
    let manualResult: any = null;
    let manualScore = 0;
    try {
      manualResult = await this.manualAnalyzerService.analyzeManual({
        serviceOrderId: String(serviceOrderId),
        device: context.device,
        brand: context.brand,
        model: context.model,
        defectivePart: context.defect,
        documentIds: dto.documentIds,
      } as AnalyzeManualDto);
      manualScore = this.mapManualScore(manualResult);
      (manualResult.relatedManualPages ?? []).slice(0, 8).forEach((page: any) => {
        evidence.push({
          type: 'manual',
          ref: `document:${page.documentId}`,
          text: String(page.excerpt ?? '').slice(0, 600),
          page: page.page ?? null,
        });
      });
    } catch (error: any) {
      notes.push(`Manual analysis unavailable: ${error?.message ?? 'unknown error'}`);
      manualScore = 0;
    }
    await this.logRetrieval(serviceOrderId, 'manual', manualScore, {
      confidence: manualResult?.confidence ?? null,
      pages: manualResult?.relatedManualPages?.length ?? 0,
    });

    if (manualResult && this.isManualSufficient(manualResult, manualScore)) {
      notes.push(`Manual evidence is sufficient (score ${manualScore.toFixed(2)}).`);
      return {
        serviceOrderId,
        context,
        evidence,
        heuristicPlan: this.buildFromManual(manualResult, notes),
      };
    }

    notes.push('Manual evidence is insufficient; trying web fallback.');
    const webResult = await this.webSearchService.searchWeb({
      device: context.device,
      brand: context.brand || 'unknown',
      model: context.model || 'unknown',
      defect: context.defect,
      limit: 5,
    } as SearchWebDto);
    const webScore = this.mapWebScore(webResult);

    await this.logRetrieval(serviceOrderId, 'web', webScore, {
      confidence: webResult.confidence,
      sources: webResult.sources?.length ?? 0,
    });

    (webResult.sources ?? []).slice(0, 8).forEach((source: any) => {
      evidence.push({
        type: 'web',
        ref: source.title,
        text: `${source.title}. ${webResult.possibleCause}`.slice(0, 600),
        url: source.url,
      });
    });

    const webSufficient = this.isWebSufficient(webResult, webScore);
    if (manualResult && webSufficient) {
      const manualMapped = this.buildFromManual(manualResult, []);
      const webMapped = this.buildFromWeb(webResult, []);
      return {
        serviceOrderId,
        context,
        evidence,
        heuristicPlan: {
          origin: 'mixed',
          probableDiagnosis: `${manualMapped.probableDiagnosis} | ${webMapped.probableDiagnosis}`,
          recommendedProcedure: Array.from(
            new Set([...manualMapped.recommendedProcedure, ...webMapped.recommendedProcedure]),
          ).slice(0, 8),
          testsToPerform: Array.from(
            new Set([...manualMapped.testsToPerform, ...webMapped.testsToPerform]),
          ).slice(0, 6),
          requiredTools: Array.from(
            new Set([...manualMapped.requiredTools, ...webMapped.requiredTools]),
          ).slice(0, 6),
          risksAndPrecautions: Array.from(
            new Set([...manualMapped.risksAndPrecautions, ...webMapped.risksAndPrecautions]),
          ).slice(0, 6),
          sources: [...manualMapped.sources, ...webMapped.sources].slice(0, 10),
          confidence: manualMapped.confidence === 'high' ? 'high' : 'medium',
          notes,
        },
      };
    }

    const heuristic = this.buildFromWeb(webResult, notes);
    if (!webSufficient) {
      heuristic.confidence = 'low';
      heuristic.notes.push(
        'Web evidence was limited; validate manually before any repair action.',
      );
    }
    return {
      serviceOrderId,
      context,
      evidence,
      heuristicPlan: heuristic,
    };
  }

  async finalizeAndPersist(
    pack: RecommendEvidencePack,
    options?: {
      streamed?: boolean;
      preferredPlan?: FinalRecommendation | null;
      streamFailed?: boolean;
      signal?: AbortSignal;
    },
  ): Promise<FinalRecommendation> {
    const streamed = Boolean(options?.streamed);
    const streamFailed = Boolean(options?.streamFailed);

    let llmPlan = options?.preferredPlan;
    if (llmPlan === undefined) {
      llmPlan = await this.llmService.generateRepairPlan(
        {
          equipment: pack.context,
          evidence: pack.evidence,
          heuristicPlan: pack.heuristicPlan,
        },
        options?.signal,
      );

      // Second LLM attempt with minimal context-only input when evidence-driven generation fails.
      if (!llmPlan) {
        const contextOnlyBaseline: FinalRecommendation = {
          origin: 'mixed',
          probableDiagnosis: `Initial context-based diagnosis for ${pack.context.brand || 'unknown brand'} ${pack.context.model || ''} ${pack.context.device}`.trim(),
          recommendedProcedure: [
            'Run non-destructive diagnostics first and confirm power, signals, and connectors.',
            'Isolate subsystems and retest after each step.',
          ],
          testsToPerform: [
            'Check power rails and continuity with a multimeter.',
            'Perform a controlled functional test to reproduce the defect.',
          ],
          requiredTools: ['Multimeter', 'Basic disassembly tools', 'ESD protection'],
          risksAndPrecautions: ['Disconnect power before disassembly.', 'Use ESD protection.'],
          sources: [],
          confidence: 'low',
          notes: ['Evidence is limited; this is a conservative diagnostic plan.'],
        };

        llmPlan = await this.llmService.generateRepairPlan(
          {
            equipment: pack.context,
            evidence: [],
            heuristicPlan: contextOnlyBaseline,
          },
          options?.signal,
        );
      }
    }

    const engineUsed: 'llm' | 'heuristic' = llmPlan ? 'llm' : 'heuristic';
    const finalPlan = llmPlan ?? pack.heuristicPlan;

    if (streamFailed) {
      finalPlan.notes = Array.from(
        new Set([
          ...finalPlan.notes,
          'LLM streaming was interrupted; heuristic fallback was used.',
        ]),
      );
    }

    await this.logRetrieval(pack.serviceOrderId, engineUsed, this.confidenceToScore(finalPlan.confidence), {
      evidenceCount: pack.evidence.length,
      usedFallback: !llmPlan,
      streamed,
      streamFailed,
    });

    await this.saveRecommendationToChat(pack.serviceOrderId, finalPlan, {
      engineUsed,
      streamed,
      streamFailed,
    });

    return finalPlan;
  }

  async recommend(dto: RecommendDto): Promise<FinalRecommendation> {
    const pack = await this.recommendWithEvidence(dto);
    return this.finalizeAndPersist(pack, { streamed: false });
  }
}
