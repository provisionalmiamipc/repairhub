import { SimpleRanker } from './simple-ranker.service';

describe('SimpleRanker', () => {
  let ranker: SimpleRanker;

  beforeEach(() => {
    ranker = new SimpleRanker();
  });

  it('prioritizes fragments with stronger keyword/synonym matches', () => {
    const ranked = ranker.rankFragments(
      [
        {
          documentId: 1,
          page: 2,
          section: 'troubleshooting',
          text: 'Power issue and charging failure. No power and battery drain detected.',
        },
        {
          documentId: 1,
          page: 5,
          section: 'general',
          text: 'Cleaning instructions for the external case.',
        },
      ],
      'battery not charging',
    );

    expect(ranked[0].page).toBe(2);
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
    expect(ranked[0].matchedKeywords.length).toBeGreaterThan(0);
  });

  it('gives section priority to troubleshooting/repair sections', () => {
    const ranked = ranker.rankFragments(
      [
        {
          documentId: 2,
          page: 1,
          section: 'general',
          text: 'Screen replacement and panel inspection details.',
        },
        {
          documentId: 2,
          page: 3,
          section: 'repair_procedures',
          text: 'Screen replacement and panel inspection details.',
        },
      ],
      'screen panel issue',
    );

    expect(ranked[0].section).toBe('repair_procedures');
  });
});
