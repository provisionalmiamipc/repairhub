import { Injectable } from '@nestjs/common';
import { SearchProviderResult } from './search-provider.interface';

@Injectable()
export class ProcedureExtractor {
  extractPossibleCause(results: SearchProviderResult[], defect: string): string {
    if (!results.length) {
      return `No web sources were found for "${defect}".`;
    }

    const first = results[0].snippet || results[0].title;
    return `Possible cause detected from web sources: ${first.slice(0, 220)}`;
  }

  extractProcedure(results: SearchProviderResult[]): string[] {
    const steps: string[] = [];
    const verbs = ['check', 'verify', 'test', 'inspect', 'replace', 'clean', 'reset', 'update'];

    for (const result of results) {
      const text = `${result.title}. ${result.snippet}`;
      const sentences = text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 20);

      for (const sentence of sentences) {
        const lower = sentence.toLowerCase();
        if (verbs.some((v) => lower.includes(v))) {
          steps.push(sentence.slice(0, 220));
        }
      }
    }

    if (!steps.length) {
      return ['Review the suggested links and validate diagnostic steps manually.'];
    }

    return Array.from(new Set(steps)).slice(0, 6);
  }
}
