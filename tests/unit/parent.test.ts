import { describe, expect, it } from 'vitest';
import { AUTO_OK_MS, decide, effectiveVerdict, isValidPin, pending, sessionLine, summary, type SessionRecord } from '../../src/engine/parent';
import { initialSkills } from '../../src/engine/difficulty';
import type { QuestionResult } from '../../src/engine/session';

const r = (over: Partial<QuestionResult>): QuestionResult => ({ questionId: 'q', player: 'axelle', subject: 'maths', level: 2, verdict: 'juste', attempts: 1, helped: false, response: '', at: 0, ...over });
const skills = { axelle: initialSkills(), maelle: initialSkills(), rafaelle: initialSkills() };

describe('mode parent', () => {
  it('« pas sûr » reste en attente, puis est validé au bout de 24 h', () => {
    const x = r({ verdict: 'pas-sur', at: 1000 });
    expect(effectiveVerdict(x, 1000 + AUTO_OK_MS - 1)).toBe('en-attente');
    expect(effectiveVerdict(x, 1000 + AUTO_OK_MS)).toBe('juste');
  });
  it('la décision du parent prime sur tout', () => {
    expect(effectiveVerdict(r({ verdict: 'juste', parent: 'ko' }), 0)).toBe('faux');
    expect(effectiveVerdict(r({ verdict: 'pas-sur', parent: 'ok' }), 0)).toBe('juste');
  });
  it('liste les réponses à valider et applique la décision', () => {
    const h: SessionRecord[] = [{ chapter: 1, day: 1, startedAt: 0, endedAt: 1, extra: false, results: [r({}), r({ verdict: 'pas-sur', at: 5, player: 'maelle', subject: 'francais' })] }];
    const p = pending(h, 10);
    expect(p).toHaveLength(1);
    expect(p[0]!.index).toBe(1);
    const h2 = decide(h, 0, 1, 'ko');
    expect(pending(h2, 10)).toHaveLength(0);
    expect(h[0]!.results[1]!.parent).toBeUndefined();
    expect(summary(h2, skills, 10).maelle.francais).toEqual({ total: 1, justes: 0, attente: 0, level: 2 });
    expect(sessionLine(h2[0]!, 10).axelle).toEqual({ total: 1, justes: 1 });
  });
  it('code PIN : exactement 4 chiffres', () => {
    expect(isValidPin('0000')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
  });
});
