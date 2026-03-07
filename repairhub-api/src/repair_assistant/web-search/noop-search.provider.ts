import { Injectable } from '@nestjs/common';
import { SearchProvider, SearchProviderResult } from './search-provider.interface';

@Injectable()
export class NoopSearchProvider implements SearchProvider {
  async search(_query: string, _limit: number): Promise<SearchProviderResult[]> {
    // MVP placeholder: no external API call.
    return [];
  }
}
