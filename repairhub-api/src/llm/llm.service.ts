import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { LLM_CONFIG } from './llm.config';
import type { LlmConfig } from './llm.config';

export type RepairPlanOutput = {
  origin: 'internal_case' | 'manual' | 'web' | 'mixed';
  probableDiagnosis: string;
  recommendedProcedure: string[];
  testsToPerform: string[];
  requiredTools: string[];
  risksAndPrecautions: string[];
  sources: Array<{
    type: 'case' | 'manual' | 'web';
    ref: string;
    excerpt?: string;
    url?: string;
    page?: number | null;
  }>;
  confidence: 'high' | 'medium' | 'low';
  notes: string[];
};

export type LlmInput = {
  equipment: {
    device: string;
    brand?: string;
    model?: string;
    defect: string;
  };
  evidence: Array<{
    type: 'case' | 'manual' | 'web';
    ref: string;
    text: string;
    url?: string;
    page?: number | null;
  }>;
  heuristicPlan: RepairPlanOutput;
  conversationSummary?: string;
};

export type LlmChatInput = {
  equipment: {
    device: string;
    brand?: string;
    model?: string;
    defect?: string;
  };
  question: string;
  manualText?: string;
  lowText?: boolean;
};

export type LlmStreamEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'final_json'; json: RepairPlanOutput }
  | { type: 'error'; code: string; message: string };

const sourceSchema = z.object({
  type: z.enum(['case', 'manual', 'web']),
  ref: z.string().min(1),
  excerpt: z.string().optional(),
  url: z.string().url().optional(),
  page: z.number().int().nullable().optional(),
});

const repairPlanSchema = z.object({
  origin: z.enum(['internal_case', 'manual', 'web', 'mixed']),
  probableDiagnosis: z.string(),
  recommendedProcedure: z.array(z.string()),
  testsToPerform: z.array(z.string()),
  requiredTools: z.array(z.string()),
  risksAndPrecautions: z.array(z.string()),
  sources: z.array(sourceSchema),
  confidence: z.enum(['high', 'medium', 'low']),
  notes: z.array(z.string()),
});

const repairPlanJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'origin',
    'probableDiagnosis',
    'recommendedProcedure',
    'testsToPerform',
    'requiredTools',
    'risksAndPrecautions',
    'sources',
    'confidence',
    'notes',
  ],
  properties: {
    origin: { type: 'string', enum: ['internal_case', 'manual', 'web', 'mixed'] },
    probableDiagnosis: { type: 'string' },
    recommendedProcedure: {
      type: 'array',
      items: { type: 'string' },
    },
    testsToPerform: {
      type: 'array',
      items: { type: 'string' },
    },
    requiredTools: {
      type: 'array',
      items: { type: 'string' },
    },
    risksAndPrecautions: {
      type: 'array',
      items: { type: 'string' },
    },
    sources: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'ref'],
        properties: {
          type: { type: 'string', enum: ['case', 'manual', 'web'] },
          ref: { type: 'string' },
          excerpt: { type: 'string' },
          url: { type: 'string' },
          page: { type: ['integer', 'null'] },
        },
      },
    },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    notes: {
      type: 'array',
      items: { type: 'string' },
    },
  },
} as const;

export interface LlmProvider {
  generateRepairPlan(input: LlmInput, externalSignal?: AbortSignal): Promise<RepairPlanOutput>;
  generateChatAnswer(input: LlmChatInput, externalSignal?: AbortSignal): Promise<string>;
  streamRepairPlan(input: LlmInput, externalSignal?: AbortSignal): AsyncIterable<LlmStreamEvent>;
}

export const LLM_PROVIDER = 'LLM_PROVIDER';

class LlmProviderError extends Error {
  constructor(
    public readonly code:
      | 'LLM_DISABLED'
      | 'AUTH_ERROR'
      | 'RATE_LIMIT'
      | 'TIMEOUT'
      | 'NETWORK'
      | 'SERVER_ERROR'
      | 'INVALID_RESPONSE'
      | 'UNKNOWN',
    message: string,
  ) {
    super(message);
  }
}

@Injectable()
export class GroqProvider implements LlmProvider {
  private readonly logger = new Logger(GroqProvider.name);
  private client: any | null = null;

  constructor(@Inject(LLM_CONFIG) private readonly llmConfig: LlmConfig) {}

  private getClient() {
    if (!this.llmConfig.groqApiKey) {
      throw new LlmProviderError('LLM_DISABLED', 'GROQ_API_KEY is not configured');
    }
    if (!this.client) {
      // Reuse OpenAI-compatible SDK pointing to Groq API.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const OpenAI = require('openai').default ?? require('openai');
      this.client = new OpenAI({
        apiKey: this.llmConfig.groqApiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
    }
    return this.client;
  }

  private withAbortTimeout(externalSignal?: AbortSignal) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.llmConfig.timeoutMs);
    if (externalSignal) {
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
    return { controller, timeout };
  }

  private mapError(error: any): LlmProviderError {
    if (error?.name === 'AbortError') {
      return new LlmProviderError('TIMEOUT', 'Timeout while calling Groq');
    }

    const status = error?.status ?? error?.response?.status;
    if (status === 401 || status === 403) {
      return new LlmProviderError('AUTH_ERROR', 'Groq authentication error');
    }
    if (status === 429) {
      return new LlmProviderError('RATE_LIMIT', 'Rate limit Groq');
    }
    if (typeof status === 'number' && status >= 500) {
      return new LlmProviderError('SERVER_ERROR', 'Groq server error');
    }

    const code = String(error?.code ?? '').toUpperCase();
    if (['ENOTFOUND', 'ECONNRESET', 'ECONNREFUSED', 'EAI_AGAIN'].includes(code)) {
      return new LlmProviderError('NETWORK', 'Network error while calling Groq');
    }

    if (error instanceof SyntaxError || error?.message?.includes('JSON')) {
      return new LlmProviderError('INVALID_RESPONSE', 'Invalid model response');
    }

    return new LlmProviderError('UNKNOWN', error?.message ?? 'Unknown Groq error');
  }

  private buildPrompts(input: LlmInput) {
    const systemPrompt = [
      'You are a technical repair assistant for electronic equipment.',
      'Mandatory rules:',
      '1) Prefer provided evidence when available.',
      '2) If evidence is insufficient, provide a conservative context-based diagnostic plan using equipment fields (device, brand, model, defect).',
      '3) Never claim a root cause as confirmed without support; mark uncertainty in notes.',
      '4) Always return valid JSON that matches the schema.',
      "4.1) Field 'origin' must be exactly one of: internal_case, manual, web, mixed.",
      '5) Do not answer personal, pricing/cost, or off-service-order topics.',
      '6) Prioritize verifiable and safe steps (inspection, measurement, ESD, non-destructive testing).',
    ].join('\n');

    const evidenceBlock = input.evidence.length
      ? input.evidence
          .map((item, idx) => {
            const pagePart = item.page === null || item.page === undefined ? '' : ` page=${item.page}`;
            const urlPart = item.url ? ` url=${item.url}` : '';
            return `${idx + 1}. [${item.type}] ref=${item.ref}${pagePart}${urlPart}\n${item.text}`;
          })
          .join('\n\n')
      : 'No external evidence snippets were provided.';

    const userPrompt = [
      'Service order context:',
      `- device: ${input.equipment.device}`,
      `- brand: ${input.equipment.brand || 'unknown'}`,
      `- model: ${input.equipment.model || 'unknown'}`,
      `- defect: ${input.equipment.defect}`,
      '',
      'Conversation summary:',
      input.conversationSummary || 'N/A',
      '',
      'Evidence:',
      evidenceBlock,
      '',
      'Heuristic baseline plan (use as fallback reference, do not copy blindly):',
      JSON.stringify(input.heuristicPlan),
      '',
      'Return ONLY valid JSON that matches the required repair plan schema.',
    ].join('\n');

    return {
      model: this.llmConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };
  }

  private buildChatPrompts(input: LlmChatInput) {
    const systemPrompt = [
      'You are a technical repair assistant for electronic equipment.',
      'Rules:',
      '1) Answer in clear practical English.',
      '2) Stay on technical diagnosis/repair scope only.',
      '3) Do not provide pricing, personal advice, or non-technical content.',
      '4) If a manual snippet is provided, prioritize it and cite what was used briefly.',
      '5) If evidence is weak or missing, say so briefly and provide conservative next diagnostic steps.',
      '6) Keep response concise and directly actionable.',
    ].join('\n');

    const userPrompt = [
      'Service order context:',
      `- device: ${input.equipment.device}`,
      `- brand: ${input.equipment.brand || 'unknown'}`,
      `- model: ${input.equipment.model || 'unknown'}`,
      `- defect: ${input.equipment.defect || 'not specified'}`,
      '',
      'Technician question:',
      input.question,
      '',
      input.manualText
        ? `Manual extracted text (may be partial):\n${input.manualText.slice(0, 24000)}`
        : 'No manual text provided.',
      input.lowText ? '\nNote: uploaded PDF appears to have low text content.' : '',
    ].join('\n');

    return {
      model: this.llmConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    };
  }

  private async createCompletionWithFormatFallback(
    client: any,
    input: LlmInput,
    signal: AbortSignal,
  ) {
    const base = this.buildPrompts(input);

    try {
      return await client.chat.completions.create(
        {
          ...base,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'repair_plan_output',
              strict: true,
              schema: repairPlanJsonSchema,
            },
          },
        },
        { signal } as any,
      );
    } catch (error: any) {
      const status = error?.status ?? error?.response?.status;
      const msg = String(error?.message ?? '');
      const unsupported =
        status === 400 &&
        (msg.includes('response_format') || msg.includes('json_schema') || msg.includes('schema'));
      if (!unsupported) throw error;

      this.logger.warn(
        'Groq model rejected json_schema response_format; retrying with json_object mode.',
      );
      return client.chat.completions.create(
        {
          ...base,
          response_format: { type: 'json_object' },
        },
        { signal } as any,
      );
    }
  }

  private extractJsonCandidate(raw: string): string {
    const text = String(raw || '').trim();
    if (!text) return text;

    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) return fenced[1].trim();

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return text.slice(firstBrace, lastBrace + 1).trim();
    }

    return text;
  }

  private normalizeRepairPlanCandidate(candidate: any): any {
    if (!candidate || typeof candidate !== 'object') return candidate;

    const normalized = { ...candidate } as any;
    const allowedOrigins = new Set(['internal_case', 'manual', 'web', 'mixed']);
    if (!allowedOrigins.has(normalized.origin)) {
      const incoming = String(normalized.origin ?? '').toLowerCase().trim();
      if (incoming === 'context' || incoming === 'contextual' || incoming === 'fallback') {
        normalized.origin = 'mixed';
        this.logger.warn("Normalized invalid origin to 'mixed'.");
      }
    }
    return normalized;
  }

  async generateRepairPlan(input: LlmInput, externalSignal?: AbortSignal): Promise<RepairPlanOutput> {
    const client = this.getClient();
    const { controller, timeout } = this.withAbortTimeout(externalSignal);

    try {
      const response = await this.createCompletionWithFormatFallback(
        client,
        input,
        controller.signal,
      );

      const outputText = String((response as any)?.choices?.[0]?.message?.content ?? '');
      if (!outputText || typeof outputText !== 'string') {
        throw new LlmProviderError('INVALID_RESPONSE', 'Groq did not return message content');
      }

      const jsonText = this.extractJsonCandidate(outputText);
      const parsed = JSON.parse(jsonText);
      const normalized = this.normalizeRepairPlanCandidate(parsed);
      return repairPlanSchema.parse(normalized);
    } catch (error) {
      const mapped = this.mapError(error);
      this.logger.warn(`Groq provider error [${mapped.code}]: ${mapped.message}`);
      throw mapped;
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateChatAnswer(input: LlmChatInput, externalSignal?: AbortSignal): Promise<string> {
    const client = this.getClient();
    const { controller, timeout } = this.withAbortTimeout(externalSignal);

    try {
      const response = await client.chat.completions.create(
        {
          ...this.buildChatPrompts(input),
        },
        { signal: controller.signal } as any,
      );

      const outputText = String((response as any)?.choices?.[0]?.message?.content ?? '').trim();
      if (!outputText) {
        throw new LlmProviderError('INVALID_RESPONSE', 'Groq did not return message content');
      }
      return outputText;
    } catch (error) {
      const mapped = this.mapError(error);
      this.logger.warn(`Groq provider error [${mapped.code}]: ${mapped.message}`);
      throw mapped;
    } finally {
      clearTimeout(timeout);
    }
  }

  async *streamRepairPlan(
    input: LlmInput,
    externalSignal?: AbortSignal,
  ): AsyncIterable<LlmStreamEvent> {
    const client = this.getClient();
    const { controller, timeout } = this.withAbortTimeout(externalSignal);
    let accumulated = '';

    try {
      const stream = await client.chat.completions.create(
        {
          ...this.buildPrompts(input),
          stream: true,
        },
        { signal: controller.signal } as any,
      );

      for await (const event of stream as AsyncIterable<any>) {
        const delta = String(event?.choices?.[0]?.delta?.content ?? '');
        if (delta) {
          accumulated += delta;
          yield { type: 'text_delta', text: delta };
        }
      }

      try {
        const jsonText = this.extractJsonCandidate(accumulated);
        const parsed = JSON.parse(jsonText);
        const normalized = this.normalizeRepairPlanCandidate(parsed);
        const validated = repairPlanSchema.parse(normalized);
        yield { type: 'final_json', json: validated };
      } catch {
        // Streaming text may not be strict JSON; final validation is handled by non-stream path.
      }
    } catch (error) {
      const mapped = this.mapError(error);
      this.logger.warn(`Groq stream error [${mapped.code}]: ${mapped.message}`);
      throw mapped;
    } finally {
      clearTimeout(timeout);
    }
  }
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(
    @Inject(LLM_CONFIG) private readonly llmConfig: LlmConfig,
    @Inject(LLM_PROVIDER) private readonly provider: LlmProvider,
  ) {}

  async generateRepairPlan(
    input: LlmInput,
    externalSignal?: AbortSignal,
  ): Promise<RepairPlanOutput | null> {
    if (!this.llmConfig.enabled || !this.llmConfig.groqApiKey) {
      this.logger.log('LLM disabled or GROQ_API_KEY missing. Using heuristic fallback.');
      return null;
    }

    try {
      return await this.provider.generateRepairPlan(input, externalSignal);
    } catch (error: any) {
      this.logger.warn(`LLM fallback activated: ${error?.code ?? 'UNKNOWN'} - ${error?.message}`);
      return null;
    }
  }

  async generateChatAnswer(
    input: LlmChatInput,
    externalSignal?: AbortSignal,
  ): Promise<string> {
    if (!this.llmConfig.enabled || !this.llmConfig.groqApiKey) {
      throw new Error('LLM is disabled or GROQ_API_KEY is missing');
    }

    return this.provider.generateChatAnswer(input, externalSignal);
  }

  async streamRepairPlanOrNull(
    input: LlmInput,
    externalSignal?: AbortSignal,
  ): Promise<AsyncIterable<LlmStreamEvent> | null> {
    if (!this.llmConfig.enabled || !this.llmConfig.groqApiKey) return null;

    try {
      return this.provider.streamRepairPlan(input, externalSignal);
    } catch (error: any) {
      this.logger.warn(
        `LLM stream not available, fallback to heuristic: ${error?.code ?? 'UNKNOWN'} - ${error?.message}`,
      );
      return null;
    }
  }
}
