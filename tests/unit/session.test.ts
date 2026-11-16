import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../../src/content/chapters';
import { dayPlan, sessionSummary, skillSignal, supportRoles } from '../../src/engine/session';
import { rotation } from '../../src/engine/game';

const ch = CHAPTERS[0]!;
const order = rotation(0).turnOrder;

describe('déroulé des séances du chapitre 1', () => {
  it('jour 1 : ouverture, espagnol, 4 manches × 3 tours, une pause au milieu, clôture', () => {
    const plan = dayPlan(ch, ch.days[0]!, order);
    expect(plan[0]).toEqual({ kind: 'ouverture' });
    expect(plan[1]).toEqual({ kind: 'espagnol' });
    expect(plan.filter((s) => s.kind === 'tour')).toHaveLength(12);
    const pause = plan.findIndex((s) => s.kind === 'pause');
    expect(plan[pause - 1]).toEqual({ kind: 'tour', manche: 1, player: order[2] });
    expect(plan.at(-1)).toEqual({ kind: 'cloture' });
    expect(plan.some((s) => s.kind === 'conseil')).toBe(false);
  });
  it('jour 5 : le Conseil et la Convergence ouvrent la séance, le Concert la termine', () => {
    const plan = dayPlan(ch, ch.days[4]!, order).map((s) => s.kind);
    expect(plan.slice(0, 4)).toEqual(['ouverture', 'espagnol', 'conseil', 'convergence']);
    expect(plan.slice(-2)).toEqual(['concert', 'cloture']);
  });
  it('rôles de soutien : les deux autres sœurs, sans doublon', () => {
    for (const p of order) {
      const r = supportRoles(order, p);
      expect(new Set([p, r.gardienne, r.voix]).size).toBe(3);
    }
  });
});

describe('résultats', () => {
  it('une réussite au 2e essai compte comme aidée ; une validation des sœurs est neutre', () => {
    expect(skillSignal({ verdict: 'juste', attempts: 1, helped: false })).toEqual({ correct: true, helped: false });
    expect(skillSignal({ verdict: 'juste', attempts: 2, helped: false })).toEqual({ correct: true, helped: true });
    expect(skillSignal({ verdict: 'faux', attempts: 2, helped: false })).toEqual({ correct: false, helped: false });
    expect(skillSignal({ verdict: 'pas-sur', attempts: 1, helped: false })).toBeNull();
  });
  it('bilan par fille', () => {
    const base = { subject: 'maths' as const, level: 1, attempts: 1, helped: false, response: '', at: 0 };
    const s = sessionSummary([
      { ...base, questionId: 'a', player: 'axelle', verdict: 'juste' },
      { ...base, questionId: 'b', player: 'axelle', verdict: 'faux' },
      { ...base, questionId: 'c', player: 'maelle', verdict: 'valide-soeurs' }
    ]);
    expect(s.axelle).toEqual({ total: 2, justes: 1 });
    expect(s.maelle).toEqual({ total: 1, justes: 1 });
  });
});
