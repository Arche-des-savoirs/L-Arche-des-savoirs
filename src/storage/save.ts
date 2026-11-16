// Sauvegarde de la partie : état du moteur, profils, niveaux et séance en cours.
// Une seule clé par bloc dans la table meta ; écritures en transaction pour ne jamais garder un état à moitié écrit.
import { newGame, type GameState } from '../engine/game';
import { initialSkills, type Skills } from '../engine/difficulty';
import { DEFAULT_PROFILE, type Profile } from '../engine/profile';
import type { SessionProgress } from '../engine/session';
import { DEFAULT_PIN, type SessionRecord } from '../engine/parent';
import type { PlayerId } from '../engine/types';
import { db as defaultDb, type ArcheDB } from './db';

export interface SaveData {
  game: GameState;
  profiles: Record<PlayerId, Profile> | null;
  skills: Record<PlayerId, Skills>;
  progress: SessionProgress | null;
  /** Séances terminées, de la plus ancienne à la plus récente. */
  history: SessionRecord[];
  settings: Settings;
}

export interface Settings {
  pin: string;
  /** Voix de lecture choisie par le parent (sinon : première voix fr-FR locale). */
  voiceName?: string;
  rate: number;
}

export const emptySave = (): SaveData => ({
  game: newGame(),
  profiles: null,
  skills: { axelle: initialSkills(), maelle: initialSkills(), rafaelle: initialSkills() },
  progress: null,
  history: [],
  settings: { pin: DEFAULT_PIN, rate: 0.95 }
});

const KEYS = ['game', 'profiles', 'skills', 'progress', 'history', 'settings'] as const;

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

/** Fichier d'export : la sauvegarde complète, versionnée. */
export const EXPORT_APP = 'arche-des-savoirs';
export const toExport = (data: SaveData, now = Date.now()) => JSON.stringify({ app: EXPORT_APP, format: 1, exportedAt: new Date(now).toISOString(), data }, null, 2);

/** Relit un fichier d'export ; lève une erreur lisible si le fichier n'est pas une sauvegarde valide. */
export function fromExport(text: string): SaveData {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Ce fichier n'est pas un export de L'Arche des Savoirs.");
  }
  const o = raw as { app?: string; format?: number; data?: Partial<SaveData> };
  const d = o?.data;
  if (o?.app !== EXPORT_APP || o.format !== 1 || !d || d.game?.version !== 1 || !d.skills) throw new Error("Ce fichier n'est pas un export de L'Arche des Savoirs.");
  const base = emptySave();
  return { ...base, ...d, history: d.history ?? [], settings: { ...base.settings, ...d.settings } } as SaveData;
}
