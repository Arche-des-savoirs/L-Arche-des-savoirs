import type { Rng } from '../engine/random';
import type { Question } from '../content/schema';

export type Grade = 'CE1' | 'CM1' | '6e';
/** Niveau 1 à 3 : programme de la classe ; 4 à 5 : classe supérieure. */
export type Level = 1 | 2 | 3 | 4 | 5;

export type Generator = (rng: Rng, grade: Grade, level: Level) => Omit<Question, 'id' | 'subject' | 'level' | 'validation'> & { validation?: Question['validation'] };

export const int = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
/** Écrit un nombre à la française : espace des milliers, virgule décimale. */
export const fr = (n: number, decimals?: number) => {
  const s = decimals === undefined ? String(Math.round(n * 1e6) / 1e6) : n.toFixed(decimals);
  const [ent, dec] = s.split('.');
  const e = ent!.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const out = dec ? `${e},${dec}` : e;
  return out.replace(/^-/, '\u2212');
};
export const hm = (minutes: number) => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h} h ${String(m).padStart(2, '0')}`;
};
export const clock = (minutes: number) => `${Math.floor(minutes / 60) % 24}:${String(minutes % 60).padStart(2, '0')}`;
