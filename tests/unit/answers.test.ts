import { describe, expect, it } from 'vitest';
import { checkAnswer, normalizeText, parseNumber } from '../../src/engine/answers';
import type { Question } from '../../src/content/schema';

const q = (o: Partial<Question>): Question => ({ id: 'x', subject: 'maths', level: 2, kind: 'nombre', prompt: '???', validation: 'auto', ...o }) as Question;

describe('vérification des réponses', () => {
  it('lit les nombres à la française', () => {
    expect(parseNumber('3,7')).toBe(3.7);
    expect(parseNumber('1 229 ans')).toBe(1229);
    expect(parseNumber('−7')).toBe(-7);
    expect(parseNumber('8 000 000 000')).toBe(8e9);
  });
  it('accepte une réponse numérique avec unité', () => {
    expect(checkAnswer(q({ answer: 45 }), '45 m')).toBe('juste');
    expect(checkAnswer(q({ answer: 31.4 }), '31,4')).toBe('juste');
    expect(checkAnswer(q({ answer: 31.4 }), '31')).toBe('faux');
  });
  it('ignore majuscules, accents, tirets et article de tête', () => {
    expect(normalizeText("L'Océan Atlantique")).toBe('ocean atlantique');
    expect(checkAnswer(q({ kind: 'court', answer: 'quatre cent sept mille deux cent cinq' }), 'Quatre-cent-sept-mille-deux-cent-cinq')).toBe('juste');
    expect(checkAnswer(q({ kind: 'court', answer: 'la fusion' }), 'fusion')).toBe('juste');
  });
  it('accepte les écritures usuelles des heures', () => {
    const h = q({ kind: 'court', answer: '15 h 05' });
    expect(checkAnswer(h, '15h05')).toBe('juste');
    expect(checkAnswer(h, '15 h 05')).toBe('juste');
    expect(checkAnswer(h, '15 h 50')).toBe('faux');
  });
  it('laisse les réponses libres à valider', () => {
    expect(checkAnswer(q({ kind: 'libre', validation: 'soeurs' }), 'parce que…')).toBe('a-valider');
  });
});
