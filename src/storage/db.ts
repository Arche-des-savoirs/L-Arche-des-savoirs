// Sauvegarde locale (IndexedDB via Dexie). Le modèle complet de partie arrive avec le moteur (PR2).
import Dexie, { type Table } from 'dexie';

export interface MetaRow {
  key: string;
  value: unknown;
}

export class ArcheDB extends Dexie {
  meta!: Table<MetaRow, string>;
  constructor(name = 'arche-des-savoirs') {
    super(name);
    this.version(1).stores({ meta: 'key' });
  }
}

export const db = new ArcheDB();

export async function getMeta<T>(key: string, fallback: T, database: ArcheDB = db): Promise<T> {
  const row = await database.meta.get(key);
  return row ? (row.value as T) : fallback;
}

export async function setMeta(key: string, value: unknown, database: ArcheDB = db): Promise<void> {
  await database.meta.put({ key, value });
}

/** Compteur de contrôle : prouve que la sauvegarde survit à une fermeture de l'app. */
export async function bumpOpenCount(database: ArcheDB = db): Promise<number> {
  const n = (await getMeta<number>('openCount', 0, database)) + 1;
  await setMeta('openCount', n, database);
  return n;
}

export interface StorageStatus {
  persisted: boolean | null;
  usageMB: number | null;
  quotaMB: number | null;
}

/** Demande à Edge de ne jamais effacer les données du jeu (stockage persistant). */
export async function ensurePersistentStorage(storage: StorageManager | undefined = navigator.storage): Promise<StorageStatus> {
  if (!storage?.persisted) return { persisted: null, usageMB: null, quotaMB: null };
  let persisted = await storage.persisted();
  if (!persisted && storage.persist) persisted = await storage.persist();
  const est = storage.estimate ? await storage.estimate() : {};
  const mb = (n?: number) => (typeof n === 'number' ? Math.round((n / 1048576) * 10) / 10 : null);
  return { persisted, usageMB: mb(est.usage), quotaMB: mb(est.quota) };
}
