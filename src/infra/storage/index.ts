import type { EssayRepository } from '../../domain/repository';
import { isTauri } from '../../platform/tauri';

export async function createEssayRepository(): Promise<EssayRepository> {
  if (isTauri()) {
    const { createSqliteRepository } = await import('./sqliteRepository');
    return createSqliteRepository();
  }

  const { createLocalRepository } = await import('./localRepository');
  return createLocalRepository();
}
