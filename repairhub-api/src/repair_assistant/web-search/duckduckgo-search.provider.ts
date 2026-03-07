import { Injectable, Logger } from '@nestjs/common';
import {
  SearchProvider,
  SearchProviderResult,
  SearchSourceType,
} from './search-provider.interface';

@Injectable()
export class DuckDuckGoSearchProvider implements SearchProvider {
  private readonly logger = new Logger(DuckDuckGoSearchProvider.name);
  private readonly endpoint = 'https://html.duckduckgo.com/html/';

  async search(query: string, limit: number): Promise<SearchProviderResult[]> {
    try {
      const url = `${this.endpoint}?q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'repairhub-bot/1.0 (+https://repairhub.local)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      if (!response.ok) {
        this.logger.warn(`DuckDuckGo returned status ${response.status}`);
        return [];
      }

      const html = await response.text();
      return this.parseResults(html, limit);
    } catch (error: any) {
      this.logger.warn(`DuckDuckGo search failed: ${error?.message ?? 'unknown error'}`);
      return [];
    }
  }

  private parseResults(html: string, limit: number): SearchProviderResult[] {
    const primary = this.parseByResultBlock(html, limit);
    if (primary.length >= Math.max(2, Math.floor(limit / 2))) {
      return primary.slice(0, limit);
    }

    const fallback = this.parseByAnchorScan(html, limit);
    const merged = [...primary];
    const seen = new Set(primary.map((item) => item.url));
    for (const item of fallback) {
      if (merged.length >= limit) break;
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      merged.push(item);
    }

    this.logger.log(`DuckDuckGo parsed results primary=${primary.length} fallback=${fallback.length}`);
    return merged.slice(0, limit);
  }

  private parseByResultBlock(html: string, limit: number): SearchProviderResult[] {
    const results: SearchProviderResult[] = [];
    const blocks = html.match(/<div[^>]*class="[^"]*result[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi) ?? [];

    for (const block of blocks) {
      if (results.length >= limit) break;

      const titleMatch = block.match(
        /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i,
      );
      if (!titleMatch) continue;

      const rawUrl = this.decodeEntities(titleMatch[1]);
      const resolvedUrl = this.resolveDuckDuckGoRedirect(rawUrl);
      if (!resolvedUrl || !resolvedUrl.startsWith('http')) continue;
      if (results.some((item) => item.url === resolvedUrl)) continue;

      const title = this.cleanText(titleMatch[2]);
      const snippetMatch =
        block.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
        block.match(/<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      const snippet = snippetMatch ? this.cleanText(snippetMatch[1]) : '';

      results.push({
        title: title || resolvedUrl,
        url: resolvedUrl,
        snippet,
        sourceType: this.detectSourceType(resolvedUrl),
      });
    }

    return results;
  }

  private parseByAnchorScan(html: string, limit: number): SearchProviderResult[] {
    const results: SearchProviderResult[] = [];
    const anchorRegex =
      /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = anchorRegex.exec(html)) && results.length < limit) {
      const rawUrl = this.decodeEntities(match[1]);
      const resolvedUrl = this.resolveDuckDuckGoRedirect(rawUrl);
      if (!resolvedUrl || !resolvedUrl.startsWith('http')) continue;
      if (results.some((item) => item.url === resolvedUrl)) continue;

      const title = this.cleanText(match[2]) || resolvedUrl;
      const snippet = this.extractNearbySnippet(html, match.index);

      results.push({
        title,
        url: resolvedUrl,
        snippet,
        sourceType: this.detectSourceType(resolvedUrl),
      });
    }

    return results;
  }

  private extractNearbySnippet(html: string, anchorIndex: number): string {
    const windowStart = Math.max(0, anchorIndex - 600);
    const windowEnd = Math.min(html.length, anchorIndex + 1200);
    const chunk = html.slice(windowStart, windowEnd);

    const snippetMatch =
      chunk.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
      chunk.match(/<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (!snippetMatch) return '';

    return this.cleanText(snippetMatch[1]);
  }

  private resolveDuckDuckGoRedirect(url: string): string {
    try {
      if (url.startsWith('/l/?')) {
        const parsed = new URL(`https://duckduckgo.com${url}`);
        const uddg = parsed.searchParams.get('uddg');
        if (uddg) return decodeURIComponent(uddg);
      }
      return url;
    } catch {
      return url;
    }
  }

  private detectSourceType(url: string): SearchSourceType {
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

  private cleanText(raw: string): string {
    const withoutTags = raw.replace(/<[^>]+>/g, ' ');
    const decoded = this.decodeEntities(withoutTags);
    return decoded.replace(/\s+/g, ' ').trim();
  }

  private decodeEntities(raw: string): string {
    return raw
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#x2F;/g, '/');
  }
}
