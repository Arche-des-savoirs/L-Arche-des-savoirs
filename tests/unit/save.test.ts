import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { ArcheDB } from '../../src/storage/db';
import { DEFAULT_PROFILE, emptySave, loadSave, writeSave } from '../../src/storage/save';

describe('sauvegarde de la partie', () => {
  it('relit exactement ce qui a été écrit', async () => {
    const db = new ArcheDB('test-save-' + Math.random());
    expect((await loadSave(db)).game.position).toEqual({ chapter: 1, day: 1 });
    const data = emptySave();
    data.profiles = DEFAULT_PROFILE;
    data.progress = { chapter: 1, day: 1, step: 7, results: [], teamCalls: [0] };
    data.game = { ...data.game, sessionsPlayed: 3 };
    await writeSave(data, db);
    const back = await loadSave(db);
    expect(back.progress?.step).toBe(7);
    expect(back.profiles?.maelle.hair).toBe('tresse');
    expect(back.game.sessionsPlayed).toBe(3);
  });
});
