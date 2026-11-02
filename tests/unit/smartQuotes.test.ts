import { describe, expect, it } from 'vitest';
import { smartQuotes } from '../../src/infra/export/smartQuotes';

describe('smartQuotes', () => {
  it('turns straight double quotes into typographic quotes', () => {
    expect(smartQuotes('She said, "hello."')).toBe('She said, “hello.”');
    expect(smartQuotes('"Start" and end.')).toBe('“Start” and end.');
    expect(smartQuotes('An ("inner") quote.')).toBe('An (“inner”) quote.');
  });

  it('turns straight single quotes and apostrophes into typographic forms', () => {
    expect(smartQuotes("'Single quotes' too.")).toBe('‘Single quotes’ too.');
    expect(smartQuotes("Don't stop.")).toBe('Don’t stop.');
    expect(smartQuotes("She said 'yes'.")).toBe('She said ‘yes’.');
  });

  it('leaves text without straight quotes unchanged', () => {
    expect(smartQuotes('A quiet place for ideas.')).toBe('A quiet place for ideas.');
    expect(smartQuotes('“Already curly”')).toBe('“Already curly”');
  });
});
