import Database from '@tauri-apps/plugin-sql';
import type { Essay, EssaySummary } from '../../domain/essay';
import { newEssayId, type CreateEssayInput, type EssayRepository } from '../../domain/repository';

interface EssayRow {
  id: string;
  title: string;
  content_html: string;
  plain_text: string;
  word_count: number;
  created_at: number;
  updated_at: number;
}

let databasePromise: Promise<Database> | null = null;

function getDatabase(): Promise<Database> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const database = await Database.load('sqlite:plainessay.db');
      await database.execute(`
        CREATE TABLE IF NOT EXISTS essays (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL DEFAULT '',
          content_html TEXT NOT NULL DEFAULT '',
          plain_text TEXT NOT NULL DEFAULT '',
          word_count INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);
      await database.execute(
        'CREATE INDEX IF NOT EXISTS idx_essays_updated_at ON essays(updated_at DESC)',
      );
      return database;
    })();
  }
  return databasePromise;
}

function rowToEssay(row: EssayRow): Essay {
  return {
    id: row.id,
    title: row.title,
    contentHtml: row.content_html,
    plainText: row.plain_text,
    wordCount: row.word_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createSqliteRepository(): EssayRepository {
  return {
    async list(): Promise<EssaySummary[]> {
      const database = await getDatabase();
      const rows = await database.select<EssayRow[]>(
        'SELECT id, title, word_count, updated_at FROM essays ORDER BY updated_at DESC',
      );
      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        wordCount: row.word_count,
        updatedAt: row.updated_at,
      }));
    },

    async get(id: string): Promise<Essay | null> {
      const database = await getDatabase();
      const rows = await database.select<EssayRow[]>('SELECT * FROM essays WHERE id = $1 LIMIT 1', [
        id,
      ]);
      return rows.length > 0 ? rowToEssay(rows[0]) : null;
    },

    async create(input: CreateEssayInput = {}): Promise<Essay> {
      const database = await getDatabase();
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
      await database.execute(
        `INSERT INTO essays (id, title, content_html, plain_text, word_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          essay.id,
          essay.title,
          essay.contentHtml,
          essay.plainText,
          essay.wordCount,
          essay.createdAt,
          essay.updatedAt,
        ],
      );
      return essay;
    },

    async save(essay: Essay): Promise<void> {
      const database = await getDatabase();
      await database.execute(
        `INSERT INTO essays (id, title, content_html, plain_text, word_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           content_html = excluded.content_html,
           plain_text = excluded.plain_text,
           word_count = excluded.word_count,
           updated_at = excluded.updated_at`,
        [
          essay.id,
          essay.title,
          essay.contentHtml,
          essay.plainText,
          essay.wordCount,
          essay.createdAt,
          essay.updatedAt,
        ],
      );
    },

    async remove(id: string): Promise<void> {
      const database = await getDatabase();
      await database.execute('DELETE FROM essays WHERE id = $1', [id]);
    },
  };
}
