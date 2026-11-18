// Résout le tour d'une fille : questions rédigées + questions générées à graine fixe + révision.
import type { SessionRecord } from '../engine/parent';
import { mulberry32, seedFrom, shuffle } from '../engine/random';
import { generate } from '../generators';
import type { Grade, Level } from '../generators/types';
import { CHAPTERS } from './chapters';
import type { Chapter, Question, TourItem } from './schema';

export type PlayerId = 'axelle' | 'maelle' | 'rafaelle';
export const GRADE_OF: Record<PlayerId, Grade> = { axelle: 'CE1', maelle: 'CM1', rafaelle: '6e' };

const isGenerated = (i: TourItem): i is { gen: string; count: number } => 'gen' in i;
const isReview = (i: TourItem): i is { review: true; count: number } => 'review' in i;

/** Toutes les questions rédigées (hors générateurs/révision) des chapitres strictement avant `beforeChapter`. */
function questionsBefore(beforeChapter: number): Question[] {
  const out: Question[] = [];
  for (const c of CHAPTERS) {
    if (c.number >= beforeChapter) continue;
    for (const d of c.days) for (const m of d.manches) for (const items of Object.values(m.tours)) for (const it of items) if (!isGenerated(it) && !isReview(it)) out.push(it);
  }
  return out;
}

/**
 * Révision à répétition espacée : pioche pondérée dans l'historique réel de la fille parmi les
 * questions déjà posées aux chapitres précédents. Une question ratée, aidée ou réussie au 2e essai
 * pèse 3 fois plus qu'une question réussie du premier coup — elle revient plus souvent. Sans
 * historique exploitable (première partie), on pioche au hasard (graine fixe) dans ces questions.
 */
export function resolveReview(history: readonly SessionRecord[], player: PlayerId, beforeChapter: number, count: number, salt: string): Question[] {
  const pool = questionsBefore(beforeChapter);
  const byId = new Map(pool.map((q) => [q.id, q] as const));
  const latest = new Map<string, { at: number; wrong: boolean }>();
  for (const s of history)
    for (const r of s.results) {
      if (r.player !== player || !byId.has(r.questionId)) continue;
      const wrong = r.verdict === 'faux' || r.helped || r.attempts > 1;
      const prev = latest.get(r.questionId);
      if (!prev || r.at > prev.at) latest.set(r.questionId, { at: r.at, wrong });
    }
  const weighted: string[] = [];
  for (const [id, { wrong }] of latest) for (let k = 0; k < (wrong ? 3 : 1); k++) weighted.push(id);

  const rng = mulberry32(seedFrom(salt));
  const candidates = shuffle(rng, weighted.length > 0 ? weighted : pool.map((q) => q.id));
  const seen = new Set<string>();
  const picked: Question[] = [];
  for (const id of candidates) {
    if (seen.has(id)) continue;
    seen.add(id);
    const q = byId.get(id);
    if (q) picked.push(q);
    if (picked.length >= count) break;
  }
  return picked;
}

/** Questions d'un tour, dans l'ordre. `level` règle les générateurs (1-5, adapté par la difficulté). */
export function resolveTour(ch: Chapter, dayN: number, mancheId: string, player: PlayerId, level: Level, salt = '', history: readonly SessionRecord[] = []): Question[] {
  const day = ch.days.find((d) => d.n === dayN);
  const manche = day?.manches.find((m) => m.id === mancheId);
  const items = manche?.tours[player];
  if (!items) throw new Error(`Tour introuvable : ${ch.id} jour ${dayN} ${mancheId} ${player}`);
  return items.flatMap((item, i) => {
    if (isGenerated(item)) return Array.from({ length: item.count }, (_, k) => generate(item.gen, GRADE_OF[player], level, `${ch.id}|j${dayN}|${mancheId}|${player}|${i}|${k}|${salt}`));
    if (isReview(item)) return resolveReview(history, player, ch.number, item.count, `${ch.id}|j${dayN}|${mancheId}|${player}|${i}|${salt}`);
    return [item];
  });
}
