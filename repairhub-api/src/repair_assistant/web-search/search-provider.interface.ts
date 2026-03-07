export type SearchSourceType = 'bulletin' | 'forum' | 'repairdb' | 'article' | 'unknown';

export type SearchProviderResult = {
  title: string;
  url: string;
  snippet: string;
  sourceType: SearchSourceType;
};

export interface SearchProvider {
  search(query: string, limit: number): Promise<SearchProviderResult[]>;
}

export const SEARCH_PROVIDER_TOKEN = 'SEARCH_PROVIDER_TOKEN';
