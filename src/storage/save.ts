// Sauvegarde de la partie : état du moteur, profils, niveaux et séance en cours.
// Une seule clé par bloc dans la table meta ; écritures en transaction pour ne jamais garder un état à moitié écrit.
import { newGame, type GameState } from '../engine/game';
import { initialSkills, type Skills } from '../engine/difficulty';
import { DEFAULT_PROFILE, type Profile } from '../engine/profile';
import type { SessionProgress } from '../engine/session';
import type { PlayerId } from '../engine/types';
import { db as defaultDb, type ArcheDB } from './db';

export interface SaveData {
  game: GameState;
  profiles: Record<PlayerId, Profile> | null;
  skills: Record<PlayerId, Skills>;
  progress: SessionProgress | null;
}

export const emptySave = (): SaveData => ({
  game: newGame(),
  profiles: null,
  skills: { axelle: initialSkills(), maelle: initialSkills(), rafaelle: initialSkills() },
  progress: null
});

const KEYS = ['game', 'profiles', 'skills', 'progress'] as const;

export async function loadSave(database: ArcheDB = defaultDb): Promise<SaveData> {
  const base = emptySave();
  const rows = await database.meta.bulkGet([...KEYS]);
  const out = { ...base } as Record<string, unknown>;
  KEYS.forEach((k, i) => {
    const row = rows[i];
    if (row && row.value !== undefined) out[k] = row.value;
  });
  return out as unknown as SaveData;
}

export async function writeSave(data: SaveData, database: ArcheDB = defaultDb): Promise<void> {
  await database.transaction('rw', database.meta, () => database.meta.bulkPut(KEYS.map((k) => ({ key: k, value: structuredClone(data[k]) }))));
}

export { DEFAULT_PROFILE };
