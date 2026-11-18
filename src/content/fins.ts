// Chargement et validation des 5 fins (jour 6 du chapitre 30, vote final).
import raw from '../../content/fins.yaml';
import { fin, type Fin } from './schema';
import type { Ending } from '../engine/types';

export const FINS: Fin[] = (raw as unknown[]).map((r, i) => {
  const parsed = fin.safeParse(r);
  if (!parsed.success) throw new Error(`Fin ${i + 1} invalide : ${parsed.error.message}`);
  return parsed.data;
});

export const finOf = (id: Ending): Fin | undefined => FINS.find((f) => f.id === id);
