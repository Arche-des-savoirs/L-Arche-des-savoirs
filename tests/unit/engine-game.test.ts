import { describe, expect, it } from 'vitest';
import { createReducer, GameRuleError, newGame, rotation, type Action, type GameState } from '../../src/engine/game';
import { decisionOf } from '../../src/content/decisions';
import { openDoors } from '../../src/engine/counters';
import { mulberry32, pick } from '../../src/engine/random';
import type { Option } from '../../src/engine/types';

const reduce = createReducer(decisionOf);
const DAY = 24 * 3600 * 1000;
const t0 = new Date('2027-01-04T17:00:00').getTime();
const all = (o: Option) => ({ axelle: o, maelle: o, rafaelle: o });

/** Joue une session complète au jour donné, avec l'option choisie si c'est un jour de décision. */
function playDay(s: GameState, dayIndex: number, option: () => Option = () => 'A'): GameState {
  s = reduce(s, { type: 'DEMARRER_SESSION', now: t0 + dayIndex * DAY });
  if (s.position.day === 5) {
    const o = option();
    s = reduce(s, { type: 'DECIDER', record: { first: all(o), palabre: false, result: o } });
  }
  if (s.position.chapter === 30 && s.position.day === 6) {
    const doors = openDoors(s.counters);
    s = reduce(s, { type: 'CHOISIR_FIN', record: { result: doors[0]! } });
  }
  return reduce(s, { type: 'TERMINER_SESSION' });
}

describe('déroulé de partie', () => {
  it('fait tourner l’ordre de passage et la Décideuse', () => {
    expect(rotation(0)).toEqual({ turnOrder: ['axelle', 'maelle', 'rafaelle'], decider: 'axelle' });
    expect(rotation(1)).toEqual({ turnOrder: ['maelle', 'rafaelle', 'axelle'], decider: 'maelle' });
    expect(rotation(5).decider).toBe('rafaelle');
  });

  it('refuse une deuxième session le même jour', () => {
    const s = playDay(newGame(), 0);
    expect(() => reduce(s, { type: 'DEMARRER_SESSION', now: t0 + 3600_000 })).toThrow(GameRuleError);
  });

  it('impose la décision au jour 5', () => {
    let s = newGame();
    for (let d = 0; d < 4; d++) s = playDay(s, d);
    s = reduce(s, { type: 'DEMARRER_SESSION', now: t0 + 4 * DAY });
    expect(s.position).toEqual({ chapter: 1, day: 5 });
    expect(() => reduce(s, { type: 'TERMINER_SESSION' })).toThrow(/décision/);
  });

  it('une partie complète dure 151 sessions et se termine par une fin', () => {
    let s = newGame();
    let day = 0;
    while (!s.final) s = playDay(s, day++);
    expect(s.sessionsPlayed).toBe(151);
    expect(s.choices).toHaveLength(30);
    expect(s.counters.L + s.counters.C + s.counters.M).toBe(35);
    expect(s.final?.result).toBe('F1');
    expect(() => reduce(s, { type: 'DEMARRER_SESSION', now: t0 + day * DAY })).toThrow(/terminée/);
  });

  it('après la Fin 5, revient au carrefour choisi avec les compteurs de l’époque', () => {
    let s = newGame();
    let day = 0;
    // Toujours Courage : Orvane finit perdu, la Fin 5 s'ouvre.
    while (!s.final) s = playDay(s, day++, () => 'B');
    expect(s.final?.result).toBe('F5');
    const before20 = s.checkpoints[20]!;
    s = reduce(s, { type: 'REVENIR_AU_CARREFOUR', chapter: 20 });
    expect(s.position).toEqual({ chapter: 20, day: 5 });
    expect(s.counters).toEqual(before20.counters);
    expect(s.choices).toHaveLength(19);
    expect(s.final).toBeUndefined();
    expect(s.endingsSeen).toEqual(['F5']);
  });

  it('le parent corrige le dernier vote et les compteurs suivent', () => {
    let s = newGame();
    for (let d = 0; d < 5; d++) s = playDay(s, d, () => 'B');
    expect(s.counters.C).toBe(1);
    s = reduce(s, { type: 'PARENT_CORRIGER_DERNIER_VOTE', result: 'A' });
    expect(s.counters).toEqual({ L: 1, C: 0, M: 0, O: 0 });
  });

  it('des parties aléatoires finissent toujours sur une porte ouverte', () => {
    const rng = mulberry32(3);
    for (let run = 0; run < 50; run++) {
      let s = newGame();
      let day = 0;
      while (!s.final) s = playDay(s, day++, () => pick(rng, ['A', 'B', 'C'] as const));
      expect(s.final!.doors).toContain(s.final!.result);
    }
  });

  it('le reducer ne modifie jamais l’état reçu', () => {
    const s = newGame();
    const copy = structuredClone(s);
    reduce(s, { type: 'DEMARRER_SESSION', now: t0 } as Action);
    expect(s).toEqual(copy);
  });
});
