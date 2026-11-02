/**
 * Mirrors the prototype's export punctuation cleanup: opening straight quotes
 * become typographic opening quotes, and every remaining straight quote
 * becomes its typographic closing form. Apostrophes therefore become ’.
 */
export function smartQuotes(text: string): string {
  return text
    .replace(/(^|[\s([{])"(?=\S)/g, '$1“')
    .replace(/"/g, '”')
    .replace(/(^|[\s([{])'(?=\S)/g, '$1‘')
    .replace(/'/g, '’');
}
