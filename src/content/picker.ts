// Résout le tour d'une fille : questions rédigées + questions générées à graine fixe.
import { generate } from '../generators';
import type { Grade, Level } from '../generators/types';
import type { Chapter, Question, TourItem } from './schema';

export type PlayerId = 'axelle' | 'maelle' | 'rafaelle';
export const GRADE_OF: Record<PlayerId, Grade> = { axelle: 'CE1', maelle: 'CM1', rafaelle: '6e' };

const isGenerated = (i: TourItem): i is { gen: string; count: number } => 'gen' in i;

/** Questions d'un tour, dans l'ordre. `level` règle les générateurs (1-5, adapté par la difficulté). */
export function resolveTour(ch: Chapter, dayN: number, mancheId: string, player: PlayerId, level: Level, salt = ''): Question[] {
  const day = ch.days.find((d) => d.n === dayN);
  const manche = day?.manches.find((m) => m.id === mancheId);
  const items = manche?.tours[player];
  if (!items) throw new Error(`Tour introuvable : ${ch.id} jour ${dayN} ${mancheId} ${player}`);
  return items.flatMap((item, i) =>
    isGenerated(item)
      ? Array.from({ length: item.count }, (_, k) => generate(item.gen, GRADE_OF[player], level, `${ch.id}|j${dayN}|${mancheId}|${player}|${i}|${k}|${salt}`))
      : [item]
  );
}
