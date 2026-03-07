import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { SearchWebDto } from '../dto/search-web.dto';
import {
  SEARCH_PROVIDER_TOKEN,
  SearchProviderResult,
  SearchSourceType,
} from './search-provider.interface';
import type { SearchProvider } from './search-provider.interface';
import { ProcedureExtractor } from './procedure-extractor.service';
import { WebCache } from '../../web_cache/entities/web_cache.entity';

type SearchWebResponse = {
  possibleCause: string;
  suggestedProcedure: string[];
  sources: Array<{ title: string; url: string; sourceType: string }>;
  confidence: 'low' | 'medium';
  notes?: string[];
};

@Injectable()
export class WebSearchService {
  private readonly logger = new Logger(WebSearchService.name);

  constructor(
    @InjectRepository(WebCache)
    private readonly webCacheRepository: Repository<WebCache>,
    @Inject(SEARCH_PROVIDER_TOKEN)
    private readonly searchProvider: SearchProvider,
    private readonly procedureExtractor: ProcedureExtractor,
  ) {}

  private normalizeSourceType(url: string): SearchSourceType {
    const normalized = url.toLowerCase();
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

  private getCacheTtlDays(): number {
    const raw = process.env.WEB_CACHE_TTL_DAYS;
    const value = Number(raw ?? 30);
    if (!Number.isFinite(value) || value <= 0) return 30;
    return value;
  }

  private getQueryHash(query: string) {
    return createHash('sha256').update(query.toLowerCase().trim()).digest('hex');
  }

  private compactText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  private buildQueries(dto: SearchWebDto): string[] {
    const brand = this.compactText(dto.brand || '');
    const model = this.compactText(dto.model || '');
    const device = this.compactText(dto.device || '');
    const defect = this.compactText(dto.defect || '');
    const stem = [brand, model, device].filter(Boolean).join(' ').trim();

    const queries = new Set<string>();
    queries.add(`${stem} ${defect} repair`);
    queries.add(`${stem} ${defect} troubleshooting`);
    queries.add(`${stem} ${defect} fix`);
    queries.add(`${stem} ${defect} service manual`);
    queries.add(`${stem} ${defect} fault code`);

    return Array.from(queries)
      .map((q) => this.compactText(q))
      .filter((q) => q.length > 0)
      .slice(0, 5);
  }

  private dedupeResults(results: SearchProviderResult[]) {
    const seen = new Set<string>();
    const deduped: SearchProviderResult[] = [];
    for (const result of results) {
      const key = result.url.toLowerCase().trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      deduped.push(result);
    }
    return deduped;
  }

  private stripHtml(html: string): string {
    return this.compactText(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>'),
    );
  }

  private pickRelevantExcerpt(text: string, defect: string): string {
    const compact = this.compactText(text);
    if (!compact) return '';

    const tokens = defect
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 3);

    for (const token of tokens) {
      const idx = compact.toLowerCase().indexOf(token);
      if (idx >= 0) {
        const start = Math.max(0, idx - 120);
        const excerpt = compact.slice(start, start + 420).trim();
        if (excerpt.length >= 60) return excerpt;
      }
    }

    return compact.slice(0, 320);
  }

  private async fetchUrlExcerpt(url: string, defect: string): Promise<string> {
    try {
      if (!/^https?:\/\//i.test(url)) return '';
      if (/\.pdf(\?|$)/i.test(url)) return '';

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'repairhub-bot/1.0 (+https://repairhub.local)',
            Accept: 'text/html, text/plain',
          },
          signal: controller.signal,
        });

        if (!response.ok) return '';
        const contentType = String(response.headers.get('content-type') || '').toLowerCase();
        if (!contentType.includes('text/html') && !contentType.includes('text/plain')) return '';

        const body = await response.text();
        return this.pickRelevantExcerpt(this.stripHtml(body), defect);
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      return '';
    }
  }

  private async enrichWithFetchedExcerpts(results: SearchProviderResult[], defect: string) {
    const top = results.slice(0, 3);
    const excerpts = await Promise.all(top.map((item) => this.fetchUrlExcerpt(item.url, defect)));
    const excerptByUrl = new Map<string, string>();
    top.forEach((item, index) => {
      const excerpt = excerpts[index];
      if (excerpt) excerptByUrl.set(item.url, excerpt);
    });

    return results.map((result) => {
      const excerpt = excerptByUrl.get(result.url);
      if (!excerpt) return result;
      const mergedSnippet = this.compactText(
        [result.snippet, `Source excerpt: ${excerpt}`].filter(Boolean).join(' '),
      ).slice(0, 700);
      return {
        ...result,
        snippet: mergedSnippet,
      };
    });
  }

  private buildResponse(
    results: SearchProviderResult[],
    defect: string,
    fromCache: boolean,
  ): SearchWebResponse {
    const sources = results.map((r) => ({
      title: r.title,
      url: r.url,
      sourceType: r.sourceType,
    }));

    const response: SearchWebResponse = {
      possibleCause: this.procedureExtractor.extractPossibleCause(results, defect),
      suggestedProcedure: this.procedureExtractor.extractProcedure(results),
      sources,
      confidence: results.length >= 3 ? 'medium' : 'low',
    };

    const notes: string[] = [];
    if (fromCache) notes.push('Result served from recent web cache.');
    if (results.length === 0) {
      notes.push(
        'No web results were found for this query. Check provider configuration or try a broader defect description.',
      );
    }
    if (notes.length) response.notes = notes;
    return response;
  }

  async searchWeb(dto: SearchWebDto): Promise<SearchWebResponse> {
    const limit = dto.limit ?? 5;
    const queries = this.buildQueries(dto);
    const query = queries.join(' || ');
    const queryHash = this.getQueryHash(query);

    const ttlDate = new Date();
    ttlDate.setDate(ttlDate.getDate() - this.getCacheTtlDays());

    const cached = await this.webCacheRepository.findOne({
      where: {
        queryHash,
        createdAt: MoreThan(ttlDate),
      },
      order: { createdAt: 'DESC' },
    });

    if (cached) {
      return this.buildResponse((cached.results as SearchProviderResult[]) ?? [], dto.defect, true);
    }

    const providerResponses = await Promise.all(
      queries.map((singleQuery) => this.searchProvider.search(singleQuery, limit)),
    );
    const mergedResults = this.dedupeResults(providerResponses.flat()).slice(0, Math.max(limit * 2, 8));
    const enrichedResults = await this.enrichWithFetchedExcerpts(mergedResults, dto.defect);
    const normalizedResults = enrichedResults
      .map((result) => ({
        ...result,
        sourceType: result.sourceType ?? this.normalizeSourceType(result.url),
      }))
      .slice(0, limit);

    this.logger.log(
      `Web search queries=${queries.length} merged=${mergedResults.length} final=${normalizedResults.length}`,
    );

    const response = this.buildResponse(normalizedResults, dto.defect, false);

    const cacheRecord = this.webCacheRepository.create({
      queryHash,
      brand: dto.brand,
      model: dto.model,
      defect: dto.defect,
      results: normalizedResults,
    });
    await this.webCacheRepository.save(cacheRecord);

    return response;
  }
}
