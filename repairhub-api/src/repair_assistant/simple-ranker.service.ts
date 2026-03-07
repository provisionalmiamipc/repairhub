import { Injectable } from '@nestjs/common';

export type ManualSection =
  | 'troubleshooting'
  | 'error_codes'
  | 'disassembly'
  | 'repair_procedures'
  | 'general';

export type ManualFragment = {
  documentId: number;
  page: number | null;
  text: string;
  section: ManualSection;
};

export type RankedFragment = ManualFragment & {
  score: number;
  matchedKeywords: string[];
};

const DEFECT_SYNONYMS: Record<string, string[]> = {
  battery: ['power', 'charging', 'charge', 'drain', 'no enciende', 'no power'],
  screen: ['display', 'lcd', 'panel', 'touch', 'flicker', 'black screen'],
  audio: ['sound', 'speaker', 'mic', 'microphone', 'buzz', 'noise'],
  wifi: ['wireless', 'network', 'connection', 'signal'],
  overheating: ['hot', 'temperature', 'thermal', 'shutdown'],
  keyboard: ['keys', 'key', 'typing', 'input'],
};

@Injectable()
export class SimpleRanker {
  expandKeywords(defect: string): string[] {
    const rawWords = defect
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((w) => w.length >= 3);

    const expanded = new Set<string>(rawWords);
    for (const [root, synonyms] of Object.entries(DEFECT_SYNONYMS)) {
      if (rawWords.some((w) => root.includes(w) || w.includes(root))) {
        synonyms.forEach((syn) => expanded.add(syn.toLowerCase()));
      }
    }

    return Array.from(expanded);
  }

  rankFragments(fragments: ManualFragment[], defect: string): RankedFragment[] {
    const keywords = this.expandKeywords(defect);

    const rankBoostBySection: Record<ManualSection, number> = {
      troubleshooting: 4,
      error_codes: 3,
      disassembly: 2,
      repair_procedures: 4,
      general: 1,
    };

    return fragments
      .map((fragment) => {
        const text = fragment.text.toLowerCase();
        let score = rankBoostBySection[fragment.section] ?? 1;
        const matchedKeywords: string[] = [];

        for (const keyword of keywords) {
          if (!keyword) continue;
          if (text.includes(keyword)) {
            const hits = text.split(keyword).length - 1;
            score += hits * 3;
            matchedKeywords.push(keyword);
          }
        }

        if (text.includes('warning') || text.includes('caution')) score += 1;
        if (text.length > 700) score -= 1;
        if (matchedKeywords.length === 0) score -= 2;

        return {
          ...fragment,
          score,
          matchedKeywords: Array.from(new Set(matchedKeywords)),
        };
      })
      .sort((a, b) => b.score - a.score);
  }
}
