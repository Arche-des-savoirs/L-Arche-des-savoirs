// Vérification des réponses : tolérante sur la forme (virgule, espaces, accents, majuscules, articles).
import type { Question } from '../content/schema';

export type Verdict = 'juste' | 'faux' | 'a-valider';

const stripAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Texte comparable : minuscules, sans accents, sans ponctuation ni article en tête. */
export function normalizeText(s: string): string {
  return stripAccents(s.toLowerCase())
    .replace(/[’']/g, "'")
    .replace(/[-–—.,;:!?«»"()]/g, ' ')
    .replace(/^(le|la|les|l'|un|une|des|du|de la|de l')\s*/u, '')
    .replace(/\s+/g, ' ')
    .replace(/(\d) ?h ?(\d)/g, '$1h$2')
    .trim();
}

/** Premier nombre lu dans la réponse (« 3,7 », « 1 229 ans », « −7 »). */
export function parseNumber(s: string): number | null {
  const m = s
    .replace(/[−–]/g, '-')
    .replace(/(\d)[\s  ](?=\d{3}\b)/g, '$1')
    .match(/-?\d+(?:[.,]\d+)?/);
  return m ? Number(m[0].replace(',', '.')) : null;
}

export function checkAnswer(q: Question, response: string | string[]): Verdict {
  if (q.kind === 'libre' || q.validation !== 'auto' || q.answer === undefined) return 'a-valider';
  if (q.kind === 'ordre') {
    const expected = Array.isArray(q.answer) ? q.answer : [];
    return Array.isArray(response) && response.length === expected.length && response.every((r, i) => r === expected[i]) ? 'juste' : 'faux';
  }
  const text = Array.isArray(response) ? response.join(' ') : response;
  if (typeof q.answer === 'number') {
    const n = parseNumber(text);
    return n !== null && Math.abs(n - q.answer) < 1e-9 ? 'juste' : 'faux';
  }
  const expected = [String(q.answer), ...(q.accept ?? [])].map(normalizeText);
  return expected.includes(normalizeText(text)) ? 'juste' : 'faux';
}
