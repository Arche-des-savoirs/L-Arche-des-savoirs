import { describe, expect, it } from 'vitest';
import { initialSkills, placementDone, placementLevel, updateSkill } from '../../src/engine/difficulty';

describe('difficulté adaptative', () => {
  it('monte après 3 réussites sans aide', () => {
    let s = initialSkills(2).maths;
    s = updateSkill(updateSkill(updateSkill(s, true, false), true, false), true, false);
    expect(s.level).toBe(3);
  });
  it("une réussite aidée ne compte pas pour monter", () => {
    let s = initialSkills(2).maths;
    s = updateSkill(updateSkill(updateSkill(s, true, false), true, true), true, false);
    expect(s.level).toBe(2);
  });
  it('descend après 2 échecs, sans passer sous 1', () => {
    let s = initialSkills(1).maths;
    s = updateSkill(updateSkill(s, false, false), false, false);
    expect(s.level).toBe(1);
    let t = initialSkills(4).maths;
    t = updateSkill(updateSkill(t, false, false), false, false);
    expect(t.level).toBe(3);
  });
});

describe('échelle de placement', () => {
  it('prend le plus haut niveau réussi avant le 2e échec', () => {
    const r = [
      { level: 1, correct: true, helped: false },
      { level: 2, correct: true, helped: false },
      { level: 3, correct: false, helped: false },
      { level: 4, correct: true, helped: false },
      { level: 5, correct: false, helped: false }
    ];
    expect(placementLevel(r)).toBe(4);
    expect(placementDone(r.slice(0, 4), 5)).toBe(false);
    expect(placementDone(r, 5)).toBe(true);
  });
  it("une réussite aidée n'arrête pas l'échelle mais ne compte pas pour le niveau", () => {
    const r = [
      { level: 1, correct: true, helped: true },
      { level: 2, correct: true, helped: false },
      { level: 3, correct: false, helped: false }
    ];
    expect(placementDone(r, 5)).toBe(false);
    expect(placementLevel(r)).toBe(2);
  });
  it('vaut 1 si rien n’est réussi', () => {
    expect(placementLevel([{ level: 1, correct: false, helped: false }, { level: 2, correct: false, helped: false }])).toBe(1);
  });
});
