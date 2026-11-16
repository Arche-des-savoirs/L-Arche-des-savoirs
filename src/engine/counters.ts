// Compteurs L/C/M, Orvane, drapeaux et portes des fins (doc des choix, réglage Fin 5 du 16/11).
import { VALUE_OF, type Counters, type DecisionDef, type Ending, type Flag, type Option, type Value } from './types';

export const O_MIN = -3;
export const O_MAX = 3;
/** Une valeur à 2 points ou moins du maximum est aussi dominante : sa porte s'ouvre. */
export const DOMINANCE_GAP = 2;

export const emptyCounters = (): Counters => ({ L: 0, C: 0, M: 0, O: 0 });
const clamp = (n: number) => Math.max(O_MIN, Math.min(O_MAX, n));

export function applyDecision(counters: Counters, flags: readonly Flag[], decision: DecisionDef, option: Option): { counters: Counters; flags: Flag[] } {
  const effect = decision.effects[option] ?? {};
  const next = { ...counters };
  next[VALUE_OF[option]] += decision.major ? 2 : 1;
  next.O = clamp(next.O + (effect.orvane ?? 0));
  const set = new Set(flags);
  effect.setFlags?.forEach((f) => set.add(f));
  return { counters: next, flags: [...set] };
}

export function dominantValues(c: Counters): Value[] {
  const max = Math.max(c.L, c.C, c.M);
  return (['L', 'C', 'M'] as const).filter((v) => max - c[v] <= DOMINANCE_GAP);
}

export type OrvaneState = 'sauve' | 'incertain' | 'perdu';
export function orvaneState(o: number): OrvaneState {
  if (o >= 2) return 'sauve';
  if (o >= -1) return 'incertain';
  return 'perdu';
}

const DOORS: Record<OrvaneState, Record<Value, Ending>> = {
  sauve: { L: 'F1', C: 'F2', M: 'F3' },
  incertain: { L: 'F4', C: 'F2', M: 'F3' },
  perdu: { L: 'F4', C: 'F5', M: 'F5' }
};

/** Portes ouvertes au vote final (une ou plusieurs, jamais zéro). */
export function openDoors(c: Counters): Ending[] {
  const table = DOORS[orvaneState(c.O)];
  return [...new Set(dominantValues(c).map((v) => table[v]))].sort();
}
