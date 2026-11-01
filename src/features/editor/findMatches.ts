import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

export interface TextMatch {
  from: number;
  to: number;
}

/**
 * Matches text inside individual ProseMirror text nodes. Positions are the
 * document positions used by TipTap selections and insertContentAt.
 */
export function findTextMatches(doc: ProseMirrorNode, query: string): TextMatch[] {
  const needle = query.toLocaleLowerCase();
  if (!needle) {
    return [];
  }

  const matches: TextMatch[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) {
      return;
    }
    const haystack = node.text.toLocaleLowerCase();
    let offset = haystack.indexOf(needle);
    while (offset !== -1) {
      matches.push({ from: pos + offset, to: pos + offset + needle.length });
      offset = haystack.indexOf(needle, offset + Math.max(needle.length, 1));
    }
  });

  return matches;
}
