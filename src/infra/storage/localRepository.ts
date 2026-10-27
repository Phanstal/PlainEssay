import { displayTitle, type Essay, type EssaySummary } from '../../domain/essay';
import { newEssayId, type CreateEssayInput, type EssayRepository } from '../../domain/repository';

const STORAGE_KEY = 'plainessay.essays.v1';

function readAll(): Essay[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry): entry is Essay => {
      if (typeof entry !== 'object' || entry === null) {
        return false;
      }
      const candidate = entry as Partial<Essay>;
      return typeof candidate.id === 'string' && typeof candidate.updatedAt === 'number';
    });
  } catch {
    return [];
  }
}

function writeAll(essays: Essay[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(essays));
}

export function createLocalRepository(): EssayRepository {
  return {
    async list(): Promise<EssaySummary[]> {
      return readAll()
        .slice()
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .map(({ id, title, wordCount, updatedAt }) => ({ id, title, wordCount, updatedAt }));
    },

    async get(id: string): Promise<Essay | null> {
      return readAll().find((essay) => essay.id === id) ?? null;
    },

    async create(input: CreateEssayInput = {}): Promise<Essay> {
      const now = Date.now();
      const essay: Essay = {
        id: newEssayId(),
        title: input.title ?? '',
        contentHtml: '',
        plainText: '',
        wordCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      const essays = readAll();
      essays.push(essay);
      writeAll(essays);
      return essay;
    },

    async save(essay: Essay): Promise<void> {
      const essays = readAll();
      const index = essays.findIndex((entry) => entry.id === essay.id);
      if (index === -1) {
        essays.push(essay);
      } else {
        essays[index] = essay;
      }
      writeAll(essays);
    },

    async remove(id: string): Promise<void> {
      writeAll(readAll().filter((essay) => essay.id !== id));
    },
  };
}

export function localRepositoryDebugTitle(essay: Essay): string {
  return displayTitle(essay.title);
}
