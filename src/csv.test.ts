import { describe, expect, it } from 'vitest';
import { parseCsv, summarizeDeck } from './csv';

describe('CSV import', () => {
  it('handles commas and escaped quotes inside fields', () => {
    expect(parseCsv('front,back,reps\n"Hello, world","A ""quote""",0')[1]).toEqual(['Hello, world', 'A "quote"', '0']);
  });

  it('separates new cards using Anki reps', () => {
    const result = summarizeDeck('Front,Back,Reps\na,b,0\nc,d,3\ne,f,1', 'French_vocab.csv');
    expect(result).toMatchObject({ name: 'French vocab', rows: 3, newCards: 1, reviewCards: 2 });
  });

  it('treats rows as reviewed when classification columns are absent', () => {
    const result = summarizeDeck('Front,Back\na,b\nc,d');
    expect(result.reviewCards).toBe(2);
    expect(result.note).toContain('all rows');
  });
});
