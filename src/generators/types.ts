import { shuffle, type Rng } from '../engine/random';
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

/**
 * 5 choix pour une réponse numérique : la bonne réponse + 4 leurres plausibles (erreurs de calcul
 * courantes) autour d'elle, dans un ordre mélangé. `decimals` formate comme la réponse attendue.
 */
export function numChoices(rng: Rng, answer: number, decimals?: number, extraDeltas: readonly number[] = []): { choices: string[]; answer: string } {
  const round = (v: number) => (decimals !== undefined ? Math.round(v * 10 ** decimals) / 10 ** decimals : Math.round(v * 1e6) / 1e6);
  const scale = Math.max(decimals !== undefined ? 10 ** -decimals : 1, Math.round(Math.abs(answer)) / 10 || 1);
  const pool = [...extraDeltas, 1, -1, 2, -2, scale, -scale, scale * 2, -scale * 2, scale * 3];
  const seen = new Set([answer]);
  const distractors: number[] = [];
  for (const d of pool) {
    if (distractors.length >= 4) break;
    const v = round(answer + d);
    if (!seen.has(v)) {
      seen.add(v);
      distractors.push(v);
    }
  }
  let i = 1;
  while (distractors.length < 4) {
    const v = round(answer + i * scale);
    if (!seen.has(v)) {
      seen.add(v);
      distractors.push(v);
    }
    i++;
  }
  const choices = shuffle(rng, [answer, ...distractors]).map((v) => fr(v, decimals));
  return { choices, answer: fr(answer, decimals) };
}

/** 5 choix pour une réponse texte déjà connue : la bonne + 4 leurres fournis, dans un ordre mélangé. */
export function textChoices(rng: Rng, answer: string, distractors: readonly string[]): { choices: string[]; answer: string } {
  return { choices: shuffle(rng, [answer, ...distractors.slice(0, 4)]), answer };
}
