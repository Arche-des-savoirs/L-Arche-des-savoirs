// Registre des générateurs et tirage d'une question à graine fixe.
import type { Question } from '../content/schema';
import { mulberry32, seedFrom } from '../engine/random';
import { MATHS } from './maths';
import type { Generator, Grade, Level } from './types';

export const GENERATORS: Record<string, Generator> = Object.fromEntries(Object.entries(MATHS).map(([k, g]) => [`maths.${k}`, g]));

export function generate(cell: string, grade: Grade, level: Level, seedText: string): Question {
  const g = GENERATORS[cell];
  if (!g) throw new Error(`Générateur inconnu : ${cell}`);
  const seed = seedFrom(`${cell}|${grade}|${level}|${seedText}`);
  const q = g(mulberry32(seed), grade, level);
  return { validation: 'auto', ...q, id: `gen-${cell.replace('.', '-')}-${seed.toString(36)}`, subject: 'maths', level };
}
