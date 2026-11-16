// Mode parent : historique des séances, réponses à valider, bilan par fille et par matière. Pur.
import { SUBJECTS, type Skills } from './difficulty';
import type { QuestionResult } from './session';
import { PLAYERS, type PlayerId } from './types';
import type { Subject } from '../content/schema';

export const AUTO_OK_MS = 24 * 3600 * 1000;
export const DEFAULT_PIN = '0000';

export interface SessionRecord {
  chapter: number;
  day: number;
  startedAt: number;
  endedAt: number;
  extra: boolean;
  results: QuestionResult[];
}

export type Effective = 'juste' | 'faux' | 'en-attente';

/** Verdict retenu : la décision du parent prime ; un « pas sûr » non traité est validé au bout de 24 h. */
export function effectiveVerdict(r: QuestionResult, now: number): Effective {
  if (r.parent) return r.parent === 'ok' ? 'juste' : 'faux';
  if (r.verdict === 'juste' || r.verdict === 'valide-soeurs') return 'juste';
  if (r.verdict === 'faux') return 'faux';
  return now - r.at >= AUTO_OK_MS ? 'juste' : 'en-attente';
}

export interface PendingRef {
  session: number;
  index: number;
  result: QuestionResult;
  /** Millisecondes avant la validation automatique. */
  remaining: number;
}

/** Réponses « pas sûr » encore en attente, les plus anciennes d'abord. */
export function pending(history: readonly SessionRecord[], now: number): PendingRef[] {
  const out: PendingRef[] = [];
  history.forEach((s, si) =>
    s.results.forEach((r, ri) => {
      if (effectiveVerdict(r, now) === 'en-attente') out.push({ session: si, index: ri, result: r, remaining: AUTO_OK_MS - (now - r.at) });
    })
  );
  return out.sort((a, b) => a.result.at - b.result.at);
}

/** Applique la décision du parent sur un résultat (copie immuable de l'historique). */
export function decide(history: readonly SessionRecord[], session: number, index: number, verdict: 'ok' | 'ko'): SessionRecord[] {
  return history.map((s, si) => (si !== session ? s : { ...s, results: s.results.map((r, ri) => (ri === index ? { ...r, parent: verdict } : r)) }));
}

export interface Cell {
  total: number;
  justes: number;
  attente: number;
  level: number;
}

/** Bilan cumulé : par fille et par matière, avec le niveau actuel de la difficulté adaptative. */
export function summary(history: readonly SessionRecord[], skills: Record<PlayerId, Skills>, now: number): Record<PlayerId, Record<Subject, Cell>> {
  const out = Object.fromEntries(
    PLAYERS.map((p) => [p, Object.fromEntries(SUBJECTS.map((sub) => [sub, { total: 0, justes: 0, attente: 0, level: skills[p][sub].level }]))])
  ) as Record<PlayerId, Record<Subject, Cell>>;
  for (const s of history)
    for (const r of s.results) {
      const c = out[r.player][r.subject];
      c.total++;
      const v = effectiveVerdict(r, now);
      if (v === 'juste') c.justes++;
      if (v === 'en-attente') c.attente++;
    }
  return out;
}

/** Ligne d'historique : réussites par fille pour une séance. */
export function sessionLine(s: SessionRecord, now: number): Record<PlayerId, { total: number; justes: number }> {
  const out = { axelle: { total: 0, justes: 0 }, maelle: { total: 0, justes: 0 }, rafaelle: { total: 0, justes: 0 } };
  for (const r of s.results) {
    out[r.player].total++;
    if (effectiveVerdict(r, now) === 'juste') out[r.player].justes++;
  }
  return out;
}

export const isValidPin = (pin: string) => /^\d{4}$/.test(pin);
