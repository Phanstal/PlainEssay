import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalRepository } from '../../src/infra/storage/localRepository';

describe('local repository', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('creates, lists, updates, and removes essays', async () => {
    const repository = createLocalRepository();
    const first = await repository.create({ title: 'First' });
    const second = await repository.create();

    expect(await repository.list()).toHaveLength(2);
    expect(await repository.get(first.id)).toMatchObject({ title: 'First', wordCount: 0 });

    const updated = {
      ...first,
      title: 'First revised',
      contentHtml: '<p>Hello world</p>',
      plainText: 'Hello world',
      wordCount: 2,
      updatedAt: Date.now() + 1_000,
    };
    await repository.save(updated);

    expect((await repository.list())[0].id).toBe(first.id);
    expect((await repository.get(first.id))?.title).toBe('First revised');

    await repository.remove(second.id);
    expect(await repository.list()).toHaveLength(1);
    expect(await repository.get(second.id)).toBeNull();
  });

  it('persists across repository instances', async () => {
    const firstInstance = createLocalRepository();
    const created = await firstInstance.create({ title: 'Persisted' });

    const secondInstance = createLocalRepository();
    expect((await secondInstance.get(created.id))?.title).toBe('Persisted');
  });
});
