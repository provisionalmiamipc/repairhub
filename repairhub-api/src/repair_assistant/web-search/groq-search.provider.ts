import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  SearchProvider,
  SearchProviderResult,
  SearchSourceType,
} from './search-provider.interface';
import { LLM_CONFIG } from '../../llm/llm.config';
import type { LlmConfig } from '../../llm/llm.config';

@Injectable()
export class GroqSearchProvider implements SearchProvider {
  private readonly logger = new Logger(GroqSearchProvider.name);
  private client: any | null = null;

  constructor(@Inject(LLM_CONFIG) private readonly llmConfig: LlmConfig) {}

  private getClient() {
    if (!this.llmConfig.groqApiKey) return null;
    if (!this.client) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const OpenAI = require('openai').default ?? require('openai');
      this.client = new OpenAI({
        apiKey: this.llmConfig.groqApiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
    }
    return this.client;
  }

  private detectSourceType(url: string): SearchSourceType {
    const normalized = String(url || '').toLowerCase();
    if (normalized.includes('forum') || normalized.includes('reddit') || normalized.includes('stackexchange')) {
      return 'forum';
    }
    if (normalized.includes('ifixit') || normalized.includes('repair') || normalized.includes('manualslib')) {
      return 'repairdb';
    }
    if (normalized.includes('support.') || normalized.includes('/kb/') || normalized.includes('bulletin')) {
      return 'bulletin';
    }
    if (normalized.startsWith('http')) return 'article';
    return 'unknown';
  }

  private dedupe(items: SearchProviderResult[], limit: number) {
    const seen = new Set<string>();
    const out: SearchProviderResult[] = [];
    for (const item of items) {
      const key = String(item.url || '').toLowerCase().trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(item);
      if (out.length >= limit) break;
    }
    return out;
  }

  private mapToolResults(message: any): SearchProviderResult[] {
    const mapped: SearchProviderResult[] = [];
    const executedTools = Array.isArray(message?.executed_tools) ? message.executed_tools : [];

    for (const tool of executedTools) {
      const rawResults =
        (Array.isArray(tool?.search_results) && tool.search_results) ||
        (Array.isArray(tool?.results) && tool.results) ||
        [];

      for (const result of rawResults) {
        const url = String(result?.url || result?.link || '').trim();
        if (!url.startsWith('http')) continue;

        mapped.push({
          title: String(result?.title || result?.name || url).trim(),
          url,
          snippet: String(result?.snippet || result?.text || result?.content || '').trim(),
          sourceType: this.detectSourceType(url),
        });
      }
    }

    return mapped;
  }

  private mapCitations(response: any): SearchProviderResult[] {
    const citations = Array.isArray(response?.citations)
      ? response.citations
      : Array.isArray(response?.choices?.[0]?.message?.citations)
        ? response.choices[0].message.citations
        : [];

    return citations
      .map((citation: any) => {
        const url = String(citation?.url || citation?.link || '').trim();
        if (!url.startsWith('http')) return null;
        return {
          title: String(citation?.title || url).trim(),
          url,
          snippet: String(citation?.snippet || '').trim(),
          sourceType: this.detectSourceType(url),
        } as SearchProviderResult;
      })
      .filter((item: SearchProviderResult | null): item is SearchProviderResult => Boolean(item));
  }

  private mapUrlsFromContent(content: string): SearchProviderResult[] {
    const urlMatches = content.match(/https?:\/\/[^\s)\]}"'<>]+/g) ?? [];
    return urlMatches.map((url) => ({
      title: url,
      url,
      snippet: '',
      sourceType: this.detectSourceType(url),
    }));
  }

  async search(query: string, limit: number): Promise<SearchProviderResult[]> {
    if (!this.llmConfig.enabled) return [];
    const client = this.getClient();
    if (!client) return [];

    const model = process.env.GROQ_WEB_MODEL || 'groq/compound-mini';
    const country = process.env.GROQ_WEB_COUNTRY || 'united states';
    const timeoutMsCandidate = Number(process.env.GROQ_WEB_TIMEOUT_MS ?? this.llmConfig.timeoutMs);
    const timeoutMs = Number.isFinite(timeoutMsCandidate) && timeoutMsCandidate > 0 ? timeoutMsCandidate : 12000;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const completion = await client.chat.completions.create(
        {
          model,
          messages: [
            {
              role: 'system',
              content:
                'You are a technical web retrieval assistant. Use built-in web search and provide sources for the query.',
            },
            {
              role: 'user',
              content: `Find technical repair sources for: ${query}`,
            },
          ],
          citation_options: 'enabled',
          search_settings: {
            country,
          },
        },
        { signal: controller.signal } as any,
      );

      const message = completion?.choices?.[0]?.message;
      const fromTools = this.mapToolResults(message);
      const fromCitations = this.mapCitations(completion);
      const content = String(message?.content || '');
      const fromContentUrls = this.mapUrlsFromContent(content);

      const merged = this.dedupe([...fromTools, ...fromCitations, ...fromContentUrls], limit);
      this.logger.log(`Groq web search results: tools=${fromTools.length}, citations=${fromCitations.length}, merged=${merged.length}`);
      return merged;
    } catch (error: any) {
      this.logger.warn(`Groq web search failed: ${error?.status || error?.code || error?.name || 'UNKNOWN'} - ${error?.message || 'unknown error'}`);
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }
}
