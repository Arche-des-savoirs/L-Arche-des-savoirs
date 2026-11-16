// Effets des 30 décisions (doc « Le livre dont vous êtes les héroïnes », section 9).
// A = Lien, B = Courage, C = Mémoire. Le chapitre 30 compte ici sa première partie ;
// la seconde partie est le vote final entre les portes ouvertes.
import type { DecisionDef, Flag, Option } from '../engine/types';

const MAJOR = new Set([9, 12, 20, 22, 30]);

const ORVANE: Record<number, [number, number, number]> = {
  12: [2, -1, 1],
  17: [1, 0, 1],
  18: [2, -1, 1],
  20: [2, 0, 1],
  21: [1, -1, 0],
  24: [1, -1, 0],
  30: [2, -1, 1]
};

export const DECISIONS: readonly DecisionDef[] = Array.from({ length: 30 }, (_, i) => {
  const chapter = i + 1;
  const o = ORVANE[chapter];
  const d: DecisionDef = {
    chapter,
    major: MAJOR.has(chapter),
    effects: o ? { A: { orvane: o[0] }, B: { orvane: o[1] }, C: { orvane: o[2] } } : {}
  };
  return d;
});

const byChapter = new Map(DECISIONS.map((d) => [d.chapter, d]));
const addFlags = (chapter: number, option: Option, flags: Flag[]) => {
  const d = byChapter.get(chapter)!;
  d.effects[option] = { ...d.effects[option], setFlags: flags };
};
addFlags(2, 'A', ['NILO_AMI']);
addFlags(8, 'A', ['PLUME_SAIT']);
addFlags(9, 'A', ['CHANCELIER_ALLIE']);
addFlags(15, 'A', ['MACHINE_EPARGNEE']);
addFlags(15, 'C', ['MACHINE_EPARGNEE']);
// Chapitre 22 : B confie le Sablier de Poche à Chrono (il est perdu) ; A et C le gardent.
addFlags(22, 'A', ['CHRONO_DEBOUT', 'SABLIER_DE_POCHE']);
addFlags(22, 'C', ['CHRONO_DEBOUT', 'SABLIER_DE_POCHE']);

export const decisionOf = (chapter: number): DecisionDef => {
  const d = byChapter.get(chapter);
  if (!d) throw new Error(`Aucune décision pour le chapitre ${chapter}.`);
  return d;
};

export const MAJOR_CHAPTERS = [...MAJOR].sort((a, b) => a - b);
