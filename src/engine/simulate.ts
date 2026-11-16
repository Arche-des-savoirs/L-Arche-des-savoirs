// Simulation Monte-Carlo des fins : choix aléatoires et indépendants à chaque décision.
import { applyDecision, emptyCounters, openDoors } from './counters';
import { mulberry32, pick } from './random';
import type { DecisionDef, Ending, Flag, Option } from './types';

export interface SimulationResult {
  runs: number;
  /** Part de chaque fin, en %. */
  endings: Record<Ending, number>;
  /** Part des parties où au moins deux portes s'ouvrent, en %. */
  twoDoors: number;
  /** Parties sans aucune porte (doit rester à 0). */
  noDoor: number;
}

export function simulateEndings(decisions: readonly DecisionDef[], runs: number, seed = 1, weights: [number, number, number] = [1, 1, 1]): SimulationResult {
  const rng = mulberry32(seed);
  const total = weights[0] + weights[1] + weights[2];
  const draw = (): Option => {
    const r = rng() * total;
    return r < weights[0] ? 'A' : r < weights[0] + weights[1] ? 'B' : 'C';
  };
  const count: Record<Ending, number> = { F1: 0, F2: 0, F3: 0, F4: 0, F5: 0 };
  let two = 0;
  let none = 0;
  for (let i = 0; i < runs; i++) {
    let state = { counters: emptyCounters(), flags: [] as Flag[] };
    for (const d of decisions) state = applyDecision(state.counters, state.flags, d, draw());
    const doors = openDoors(state.counters);
    if (doors.length === 0) {
      none++;
      continue;
    }
    if (doors.length > 1) two++;
    count[pick(rng, doors)]++;
  }
  const pct = (n: number) => Math.round((n / runs) * 1000) / 10;
  return {
    runs,
    endings: { F1: pct(count.F1), F2: pct(count.F2), F3: pct(count.F3), F4: pct(count.F4), F5: pct(count.F5) },
    twoDoors: pct(two),
    noDoor: none
  };
}
