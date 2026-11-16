import { describe, expect, it } from 'vitest';
import { applyDecision, dominantValues, emptyCounters, openDoors, orvaneState } from '../../src/engine/counters';
import { DECISIONS, decisionOf } from '../../src/content/decisions';
import { simulateEndings } from '../../src/engine/simulate';

describe('compteurs', () => {
  it('ajoute +1, ou +2 à un carrefour majeur', () => {
    const a = applyDecision(emptyCounters(), [], decisionOf(1), 'A');
    expect(a.counters).toEqual({ L: 1, C: 0, M: 0, O: 0 });
    const b = applyDecision(emptyCounters(), [], decisionOf(9), 'B');
    expect(b.counters.C).toBe(2);
  });

  it('borne Orvane à [−3 ; +3]', () => {
    let s = { counters: emptyCounters(), flags: [] as never[] };
    for (const ch of [12, 18, 20, 30]) s = applyDecision(s.counters, s.flags, decisionOf(ch), 'A') as typeof s;
    expect(s.counters.O).toBe(3);
  });

  it('pose les drapeaux du chapitre 22 selon l’option', () => {
    expect(applyDecision(emptyCounters(), [], decisionOf(22), 'B').flags).toEqual([]);
    expect(applyDecision(emptyCounters(), [], decisionOf(22), 'C').flags.sort()).toEqual(['CHRONO_DEBOUT', 'SABLIER_DE_POCHE']);
  });

  it('compte 30 décisions et 35 points au total', () => {
    expect(DECISIONS).toHaveLength(30);
    expect(DECISIONS.reduce((n, d) => n + (d.major ? 2 : 1), 0)).toBe(35);
  });
});

describe('portes des fins', () => {
  it('ouvre les valeurs à 2 points ou moins du maximum', () => {
    expect(dominantValues({ L: 12, C: 10, M: 13, O: 0 })).toEqual(['L', 'M']);
    expect(dominantValues({ L: 12, C: 11, M: 13, O: 0 })).toEqual(['L', 'C', 'M']);
    expect(dominantValues({ L: 20, C: 10, M: 5, O: 0 })).toEqual(['L']);
  });

  it('suit le tableau du doc des choix', () => {
    expect(orvaneState(2)).toBe('sauve');
    expect(orvaneState(-1)).toBe('incertain');
    expect(orvaneState(-2)).toBe('perdu');
    expect(openDoors({ L: 20, C: 5, M: 5, O: 3 })).toEqual(['F1']);
    expect(openDoors({ L: 20, C: 5, M: 5, O: 0 })).toEqual(['F4']);
    expect(openDoors({ L: 5, C: 20, M: 5, O: -1 })).toEqual(['F2']);
    expect(openDoors({ L: 5, C: 20, M: 19, O: -2 })).toEqual(['F5']);
    expect(openDoors({ L: 19, C: 20, M: 5, O: -3 })).toEqual(['F4', 'F5']);
  });
});

describe('simulation des fins (100 000 parties)', () => {
  const sim = simulateEndings(DECISIONS, 100_000, 42);
  it('aucune partie sans porte ouverte', () => expect(sim.noDoor).toBe(0));
  it('Fin 5 rare : 3 % au plus', () => expect(sim.endings.F5).toBeLessThanOrEqual(3));
  it('les trois fins principales restent fréquentes', () => {
    for (const f of ['F1', 'F2', 'F3'] as const) expect(sim.endings[f]).toBeGreaterThan(20);
  });
});
