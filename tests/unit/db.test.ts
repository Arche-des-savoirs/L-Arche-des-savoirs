import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { ArcheDB, bumpOpenCount, ensurePersistentStorage, getMeta, setMeta } from '../../src/storage/db';

describe('sauvegarde locale', () => {
  it('écrit et relit une valeur', async () => {
    const db = new ArcheDB('test-meta');
    await setMeta('x', { a: 1 }, db);
    expect(await getMeta('x', null, db)).toEqual({ a: 1 });
    expect(await getMeta('absent', 42, db)).toBe(42);
  });

  it('le compteur survit à une réouverture de la base', async () => {
    const first = new ArcheDB('test-count');
    expect(await bumpOpenCount(first)).toBe(1);
    first.close();
    const again = new ArcheDB('test-count');
    expect(await bumpOpenCount(again)).toBe(2);
  });

  it('demande le stockage persistant et convertit en Mo', async () => {
    const storage = {
      persisted: async () => false,
      persist: async () => true,
      estimate: async () => ({ usage: 5 * 1048576, quota: 1024 * 1048576 })
    } as unknown as StorageManager;
    expect(await ensurePersistentStorage(storage)).toEqual({ persisted: true, usageMB: 5, quotaMB: 1024 });
  });
});
