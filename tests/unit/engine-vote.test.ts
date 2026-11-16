import { describe, expect, it } from 'vitest';
import { resolveVote } from '../../src/engine/vote';

const b = (a: string, m: string, r: string) => ({ axelle: a, maelle: m, rafaelle: r }) as const;

describe('Conseil de la Lanterne', () => {
  it('vote unanime : pas de palabre', () => {
    expect(resolveVote({ first: b('A', 'A', 'A'), decider: 'maelle' })).toEqual({ status: 'resolu', result: 'A', palabre: false });
  });
  it('une voix diffère : palabre puis second vote', () => {
    expect(resolveVote({ first: b('A', 'A', 'B'), decider: 'maelle' })).toEqual({ status: 'palabre-puis-second-vote' });
  });
  it('second vote unanime : résolu après palabre', () => {
    expect(resolveVote({ first: b('A', 'B', 'C'), second: b('C', 'C', 'C'), decider: 'axelle' })).toEqual({ status: 'resolu', result: 'C', palabre: true });
  });
  it('désaccord persistant : la Décideuse tranche parmi les options du second vote', () => {
    expect(resolveVote({ first: b('A', 'B', 'C'), second: b('A', 'B', 'B'), decider: 'rafaelle' })).toEqual({ status: 'decideuse', decider: 'rafaelle', options: ['A', 'B'] });
    expect(resolveVote({ first: b('A', 'B', 'C'), second: b('A', 'B', 'B'), decider: 'rafaelle', deciderChoice: 'A' })).toEqual({ status: 'resolu', result: 'A', palabre: true, decidedBy: 'rafaelle' });
  });
  it('refuse une option absente du second vote', () => {
    expect(() => resolveVote({ first: b('A', 'B', 'C'), second: b('A', 'B', 'B'), decider: 'axelle', deciderChoice: 'C' })).toThrow();
  });
});
