import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { ArcheDB } from '../../src/storage/db';
import { DEFAULT_PROFILE, emptySave, fromExport, loadSave, toExport, writeSave } from '../../src/storage/save';

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
    expect(back.profiles?.maelle.bust).toBe(1);
    expect(back.game.sessionsPlayed).toBe(3);
  });

  it('export puis import redonnent la même sauvegarde ; un fichier étranger est refusé', () => {
    const data = emptySave();
    data.settings.pin = '4321';
    data.history = [{ chapter: 1, day: 1, startedAt: 1, endedAt: 2, extra: false, results: [] }];
    const back = fromExport(toExport(data));
    expect(back.settings.pin).toBe('4321');
    expect(back.history).toHaveLength(1);
    expect(() => fromExport('{"foo":1}')).toThrow(/pas un export/);
    expect(() => fromExport('pas du json')).toThrow(/pas un export/);
  });
});
