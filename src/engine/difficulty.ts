// Difficulté adaptative par fille et par matière (doc du chapitre 1, section 6).
// Montée : 3 réussites d'affilée sans aide. Descente : 2 échecs d'affilée. Niveaux 1 à 5.
import type { Subject } from '../content/schema';

export type Level = 1 | 2 | 3 | 4 | 5;
export interface SkillState {
  level: Level;
  streakOk: number;
  streakKo: number;
}
export type Skills = Record<Subject, SkillState>;

export const SUBJECTS: Subject[] = ['maths', 'francais', 'sciences', 'histoire-geo', 'espagnol', 'musique'];
export const UP_AFTER = 3;
export const DOWN_AFTER = 2;

const clampLevel = (n: number): Level => Math.max(1, Math.min(5, n)) as Level;

export const initialSkills = (level: Level = 2): Skills =>
  Object.fromEntries(SUBJECTS.map((s) => [s, { level, streakOk: 0, streakKo: 0 }])) as Skills;

/** Applique un résultat. Une réussite avec aide (indice, appel à l'équipe) ne fait ni monter ni descendre. */
export function updateSkill(s: SkillState, correct: boolean, helped: boolean): SkillState {
  if (correct && helped) return { ...s, streakKo: 0 };
  if (correct) {
    const ok = s.streakOk + 1;
    return ok >= UP_AFTER ? { level: clampLevel(s.level + 1), streakOk: 0, streakKo: 0 } : { ...s, streakOk: ok, streakKo: 0 };
  }
  const ko = s.streakKo + 1;
  return ko >= DOWN_AFTER ? { level: clampLevel(s.level - 1), streakOk: 0, streakKo: 0 } : { ...s, streakOk: 0, streakKo: ko };
}

/**
 * Échelle de placement : questions de niveau 1 à 5, on s'arrête après 2 échecs.
 * Le niveau de départ est le plus haut niveau réussi sans aide (au moins 1).
 * Une réussite aidée n'est pas un échec : elle ne compte simplement pas pour le niveau.
 */
export function placementLevel(results: Array<{ level: number; correct: boolean; helped: boolean }>): Level {
  let fails = 0;
  let best = 0;
  for (const r of results) {
    if (r.correct && !r.helped) best = Math.max(best, r.level);
    if (!r.correct) fails++;
    if (fails >= 2) break;
  }
  return clampLevel(best || 1);
}

/** Le placement est terminé quand 2 échecs sont atteints ou que les 5 marches sont passées. */
export const placementDone = (results: Array<{ correct: boolean }>, total: number) => results.length >= total || results.filter((r) => !r.correct).length >= 2;
