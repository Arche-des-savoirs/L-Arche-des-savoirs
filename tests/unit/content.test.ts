import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../../src/content/chapters';
import { GRADE_OF, resolveTour, type PlayerId } from '../../src/content/picker';
import { question, type Question } from '../../src/content/schema';
import { checkAnswer } from '../../src/engine/answers';
import { GENERATORS } from '../../src/generators';
import type { Level } from '../../src/generators/types';

const PLAYERS: PlayerId[] = ['axelle', 'maelle', 'rafaelle'];
const LEVELS: Level[] = [1, 2, 3, 4, 5];

/** Une question est cohérente si sa propre réponse est jugée juste. */
function selfCheck(q: Question) {
  question.parse(q);
  if (q.kind === 'libre' || q.validation !== 'auto') return;
  expect(q.answer, q.id).toBeDefined();
  if (q.kind === 'qcm') expect(q.choices, q.id).toContain(q.answer);
  if (q.kind === 'ordre') expect([...(q.answer as string[])].sort(), q.id).toEqual([...(q.choices ?? [])].sort());
  const resp = q.kind === 'ordre' ? (q.answer as string[]) : typeof q.answer === 'number' ? String(q.answer).replace('.', ',') : String(q.answer);
  expect(checkAnswer(q, resp), `${q.id} : ${q.prompt}`).toBe('juste');
  for (const alt of q.accept ?? []) expect(checkAnswer(q, alt), `${q.id} accepte « ${alt} »`).toBe('juste');
}

const KNOWN_SPEAKERS = ['narrateur', 'thessaly', 'plume', 'gardien', 'nilo', 'mouf', 'epouvantail', 'veilleur', 'habitant', 'passeur', 'pigeon', 'fil', 'reine', 'scribe', 'devoreuse', 'trame', 'cartea', 'albin', 'marchand', 'peseur', 'rouage', 'chrono', 'capitaine', 'axelle', 'maelle', 'rafaelle'];

describe.each(CHAPTERS.map((c) => [c.number, c] as const))('chapitre %i (tous les chapitres écrits)', (_n, ch) => {
  it('a 5 jours, 3 à 4 manches par jour et un tour par fille dans chaque manche', () => {
    expect(ch.days.map((d) => d.n)).toEqual([1, 2, 3, 4, 5]);
    for (const d of ch.days) {
      expect(d.manches.length).toBeGreaterThanOrEqual(3);
      for (const m of d.manches) expect(Object.keys(m.tours).sort()).toEqual([...PLAYERS].sort());
    }
  });
  it('a une décision A/B/C, une phrase espagnole par jour et des répliques pour Maelle', () => {
    expect(ch.decision).toBeDefined();
    expect(ch.espagnol).toHaveLength(5);
    expect(ch.repliquesAbsurdes.length).toBeGreaterThanOrEqual(4);
  });
  it('a des identifiants uniques, préfixés par son id', () => {
    const ids = ch.days.flatMap((d) => d.manches.flatMap((m) => Object.values(m.tours).flat())).flatMap((i) => ('id' in i ? [i.id] : []));
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id.startsWith(`${ch.id}-`), id).toBe(true);
  });
  it('fait parler uniquement des personnages connus', () => {
    const lines = [...ch.days.flatMap((d) => [...d.opening, ...d.closing]), ...Object.values(ch.decision!.options).map((o) => o.line)];
    for (const l of lines) expect(KNOWN_SPEAKERS, l.text).toContain(l.who);
  });
  it('chaque question accepte sa propre réponse et ses variantes, à tous les niveaux', () => {
    for (const d of ch.days)
      for (const m of d.manches)
        for (const p of PLAYERS)
          for (const lv of LEVELS) resolveTour(ch, d.n, m.id, p, lv).forEach(selfCheck);
  });
  it('les mesures du Concert font 4 temps', () => {
    for (const d of ch.days)
      for (const m of Object.values(d.concert?.measures ?? {})) expect(m.given.reduce((a, b) => a + b, 0) + m.missing).toBe(4);
  });
});

describe('enchaînement des chapitres', () => {
  it('les chapitres écrits se suivent sans trou, à partir du 1', () => {
    expect(CHAPTERS.map((c) => c.number)).toEqual(CHAPTERS.map((_, i) => i + 1));
  });
});

describe('chapitre 1', () => {
  const ch = CHAPTERS[0]!;

  it('est valide et complet (5 jours, 4 manches, 3 joueuses)', () => {
    expect(ch.days).toHaveLength(5);
    for (const d of ch.days) for (const m of d.manches) expect(Object.keys(m.tours).sort()).toEqual([...PLAYERS].sort());
    expect(ch.decision?.options.A.label).toBe('Rassurer Plume');
  });

  it('a des identifiants de questions uniques', () => {
    const ids = ch.days.flatMap((d) => d.manches.flatMap((m) => Object.values(m.tours).flat())).flatMap((i) => ('id' in i ? [i.id] : []));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("l'échelle de placement monte de 1 à 5 pour chaque fille", () => {
    const m1 = ch.days[0]!.manches[0]!;
    expect(m1.placement).toBe(true);
    for (const p of PLAYERS) expect(m1.tours[p]!.map((q) => ('level' in q ? q.level : 0))).toEqual([1, 2, 3, 4, 5]);
  });

  it('chaque question, rédigée ou générée, accepte sa propre réponse à tous les niveaux', () => {
    for (const d of ch.days)
      for (const m of d.manches)
        for (const p of PLAYERS)
          for (const lv of LEVELS) resolveTour(ch, d.n, m.id, p, lv).forEach(selfCheck);
  });

  it('les tours génèrent les mêmes questions pour la même graine', () => {
    const a = resolveTour(ch, 2, 'm4', 'maelle', 3).map((q) => q.prompt);
    const b = resolveTour(ch, 2, 'm4', 'maelle', 3).map((q) => q.prompt);
    expect(a).toEqual(b);
  });
});

describe('générateurs de maths', () => {
  it('produisent des questions valides et variées pour chaque classe et niveau', () => {
    for (const [cell, gen] of Object.entries(GENERATORS))
      for (const p of PLAYERS)
        for (const lv of LEVELS) {
          const prompts = new Set<string>();
          for (let s = 0; s < 60; s++) {
            const q = { validation: 'auto' as const, ...gen(() => Math.random(), GRADE_OF[p], lv), id: `t-${s}`, subject: 'maths' as const, level: lv };
            selfCheck(q);
            prompts.add(q.prompt + JSON.stringify(q.choices ?? ''));
          }
          expect(prompts.size, `${cell} ${p} niveau ${lv}`).toBeGreaterThanOrEqual(8);
        }
  });
});
