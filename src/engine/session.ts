// Déroulé d'une séance : la liste ordonnée des étapes d'un jour, et le résultat des questions.
// Pur : ni UI ni stockage. L'UI avance d'étape en étape et sauvegarde après chaque étape.
import type { Chapter, Day, Subject } from '../content/schema';
import type { PlayerId } from './types';
import { DECISION_DAY } from './game';

export type Step =
  | { kind: 'ouverture' }
  | { kind: 'espagnol' }
  | { kind: 'conseil' }
  | { kind: 'convergence' }
  | { kind: 'manche'; manche: number }
  | { kind: 'tour'; manche: number; player: PlayerId }
  | { kind: 'pause' }
  | { kind: 'concert' }
  | { kind: 'cloture' };

/** Étapes d'un jour. La Pause Éclair coupe la séance en deux ; le Conseil ouvre le jour 5. */
export function dayPlan(ch: Chapter, day: Day, turnOrder: readonly PlayerId[]): Step[] {
  const steps: Step[] = [{ kind: 'ouverture' }];
  if (ch.espagnol.length > 0) steps.push({ kind: 'espagnol' });
  if (day.n === DECISION_DAY && ch.decision) steps.push({ kind: 'conseil' }, { kind: 'convergence' });
  const pauseAfter = Math.ceil(day.manches.length / 2);
  day.manches.forEach((_, m) => {
    steps.push({ kind: 'manche', manche: m });
    for (const player of turnOrder) steps.push({ kind: 'tour', manche: m, player });
    if (m + 1 === pauseAfter && day.manches.length > 1) steps.push({ kind: 'pause' });
  });
  if (day.concert) steps.push({ kind: 'concert' });
  steps.push({ kind: 'cloture' });
  return steps;
}

/** Rôles de soutien pendant le tour d'une fille : les deux autres, dans l'ordre de passage. */
export function supportRoles(turnOrder: readonly PlayerId[], player: PlayerId): { gardienne: PlayerId; voix: PlayerId } {
  const i = turnOrder.indexOf(player);
  return { gardienne: turnOrder[(i + 1) % 3]!, voix: turnOrder[(i + 2) % 3]! };
}

export type FinalVerdict = 'juste' | 'faux' | 'valide-soeurs' | 'pas-sur';

export interface QuestionResult {
  questionId: string;
  player: PlayerId;
  subject: Subject;
  level: number;
  verdict: FinalVerdict;
  attempts: number;
  /** Indice, appel à l'équipe ou réussite au 2e essai. */
  helped: boolean;
  response: string;
  at: number;
}

/** Ce que la difficulté adaptative retient d'un résultat. `null` = ne compte ni pour monter ni pour descendre. */
export function skillSignal(r: Pick<QuestionResult, 'verdict' | 'attempts' | 'helped'>): { correct: boolean; helped: boolean } | null {
  if (r.verdict === 'valide-soeurs' || r.verdict === 'pas-sur') return null;
  if (r.verdict === 'juste') return { correct: true, helped: r.helped || r.attempts > 1 };
  return { correct: false, helped: r.helped };
}

/** Progression de la séance en cours, sauvegardée après chaque étape (reprise après fermeture). */
export interface SessionProgress {
  chapter: number;
  day: number;
  step: number;
  results: QuestionResult[];
  /** Manches où l'Appel à l'équipe a déjà servi (un par manche). */
  teamCalls: number[];
}

export const newProgress = (chapter: number, day: number): SessionProgress => ({ chapter, day, step: 0, results: [], teamCalls: [] });

/** Bilan par fille pour l'écran « À demain ». */
export function sessionSummary(results: readonly QuestionResult[]): Record<PlayerId, { total: number; justes: number }> {
  const out = { axelle: { total: 0, justes: 0 }, maelle: { total: 0, justes: 0 }, rafaelle: { total: 0, justes: 0 } };
  for (const r of results) {
    out[r.player].total++;
    if (r.verdict === 'juste' || r.verdict === 'valide-soeurs') out[r.player].justes++;
  }
  return out;
}
