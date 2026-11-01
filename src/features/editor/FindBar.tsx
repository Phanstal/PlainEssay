import { useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { findTextMatches, type TextMatch } from './findMatches';

interface FindBarProps {
  editor: Editor | null;
  onClose: () => void;
}

export function FindBar({ editor, onClose }: FindBarProps) {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [index, setIndex] = useState(0);
  const [navigated, setNavigated] = useState(false);
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const bump = () => setRevision((value) => value + 1);
    editor.on('transaction', bump);
    return () => {
      editor.off('transaction', bump);
    };
  }, [editor]);

  const matches = useMemo(() => {
    void revision;
    return editor ? findTextMatches(editor.state.doc, query) : [];
  }, [editor, query, revision]);

  const currentIndex = matches.length === 0 ? -1 : Math.min(Math.max(index, 0), matches.length - 1);

  const selectMatch = (list: TextMatch[], target: number) => {
    if (!editor || list.length === 0) {
      return;
    }
    const match = list[target];
    editor.chain().focus().setTextSelection(match).scrollIntoView().run();
    setNavigated(true);
    setIndex(target);
    setMessage(`${target + 1} of ${list.length}`);
  };

  const move = (direction: 1 | -1) => {
    if (!editor) {
      return;
    }
    const list = findTextMatches(editor.state.doc, query);
    if (list.length === 0) {
      setMessage('No matches');
      return;
    }
    const base = !navigated ? (direction === 1 ? -1 : 0) : currentIndex;
    const next = (base + direction + list.length) % list.length;
    selectMatch(list, next);
  };

  const replaceCurrent = () => {
    if (!editor || currentIndex < 0) {
      return;
    }
    const match = matches[currentIndex];
    const chain = editor.chain().focus();
    if (replacement) {
      chain.insertContentAt(match, { type: 'text', text: replacement });
    } else {
      chain.deleteRange(match);
    }
    chain.run();
    setMessage('Replaced');
    setIndex(Math.min(currentIndex, Math.max(0, matches.length - 2)));
  };

  const replaceAll = () => {
    if (!editor || matches.length === 0) {
      return;
    }
    const chain = editor.chain().focus();
    for (let position = matches.length - 1; position >= 0; position -= 1) {
      if (replacement) {
        chain.insertContentAt(matches[position], { type: 'text', text: replacement });
      } else {
        chain.deleteRange(matches[position]);
      }
    }
    chain.run();
    setMessage(`${matches.length} replaced`);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      move(event.shiftKey ? -1 : 1);
    }
  };

  return (
    <div className="find-bar" role="search" aria-label="Find and replace">
      <input
        ref={inputRef}
        value={query}
        placeholder="Find"
        aria-label="Find text"
        onChange={(event) => {
          setQuery(event.target.value);
          setIndex(0);
          setNavigated(false);
          setMessage('');
        }}
        onKeyDown={onKeyDown}
      />
      <input
        value={replacement}
        placeholder="Replace with"
        aria-label="Replacement text"
        onChange={(event) => setReplacement(event.target.value)}
        onKeyDown={onKeyDown}
      />
      <button
        type="button"
        aria-label="Previous match"
        onClick={() => move(-1)}
        disabled={matches.length === 0}
      >
        ↑
      </button>
      <button
        type="button"
        aria-label="Next match"
        onClick={() => move(1)}
        disabled={matches.length === 0}
      >
        ↓
      </button>
      <button type="button" onClick={replaceCurrent} disabled={currentIndex < 0}>
        Replace
      </button>
      <button type="button" onClick={replaceAll} disabled={matches.length === 0}>
        All
      </button>
      <span>
        {message || (matches.length > 0 ? `${currentIndex + 1} of ${matches.length}` : '')}
      </span>
      <button type="button" aria-label="Close find" onClick={onClose}>
        ×
      </button>
    </div>
  );
}
