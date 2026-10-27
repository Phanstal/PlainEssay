import type { Essay, EssaySummary } from './essay';

export interface CreateEssayInput {
  title?: string;
}

/**
 * Storage port shared by the SQLite adapter used in the desktop shell, the
 * localStorage adapter used by the browser and end-to-end tests, and any
 * future mobile adapter.
 */
export interface EssayRepository {
  list(): Promise<EssaySummary[]>;
  get(id: string): Promise<Essay | null>;
  create(input?: CreateEssayInput): Promise<Essay>;
  save(essay: Essay): Promise<void>;
  remove(id: string): Promise<void>;
}

export function newEssayId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
