// Générateurs de maths utilisés au chapitre 1. Chaque cellule dépend de la classe et du niveau (1-5).
// Toutes les questions sont des QCM à 5 choix (aucune saisie) sauf « ranger », qui reste un rangement tactile.
import { pick, shuffle } from '../engine/random';
import { clock, fr, hm, int, numChoices, textChoices, type Generator } from './types';

const up = (level: number) => level >= 4;

export const suite: Generator = (rng, grade, level) => {
  if (grade === 'CE1') {
    const step = pick(rng, up(level) ? [15, 25, 50] : level === 1 ? [1, 2, 10] : [5, 10, 15]);
    const start = int(rng, 1, up(level) ? 400 : 200);
    const answer = start + 3 * step;
    return { kind: 'qcm', prompt: `Complète la suite : ${start}, ${start + step}, ${start + 2 * step}, … Quel nombre vient ensuite ?`, ...numChoices(rng, answer, undefined, [step, -step, 2 * step]), hint: `On ajoute ${step} à chaque fois.` };
  }
  if (grade === 'CM1') {
    const step = pick(rng, up(level) ? [0.25, 0.5, 1.5] : [25, 250, 1000]);
    const start = up(level) ? int(rng, 1, 20) : int(rng, 100, 9000);
    const answer = start + 3 * step;
    const decimals = up(level) ? 2 : undefined;
    return { kind: 'qcm', prompt: `Complète : ${fr(start)} ; ${fr(start + step)} ; ${fr(start + 2 * step)} ; …`, ...numChoices(rng, answer, decimals, [step, -step, 2 * step]), hint: `L'écart entre deux nombres est ${fr(step)}.` };
  }
  const r = pick(rng, up(level) ? [2, 3] : [0.1, 0.25, 0.5]);
  const start = int(rng, 1, 9);
  if (up(level)) {
    const answer = start * r ** 3;
    return { kind: 'qcm', prompt: `Complète : ${start} ; ${start * r} ; ${start * r * r} ; …`, ...numChoices(rng, answer, undefined, [start * r ** 2, -start * r ** 2]), hint: `On multiplie par ${r} à chaque fois.` };
  }
  const answer = start + 3 * r;
  return { kind: 'qcm', prompt: `Complète : ${fr(start)} ; ${fr(start + r)} ; ${fr(start + 2 * r)} ; …`, ...numChoices(rng, answer, 2, [r, -r, 2 * r]), hint: `On ajoute ${fr(r)}.` };
};

export const comparer: Generator = (rng, grade, level) => {
  const genOne = (): number => {
    if (grade === 'CE1') return int(rng, 100, up(level) ? 9999 : 999);
    if (grade === 'CM1') return up(level) ? int(rng, 100, 999) / 100 : int(rng, 100000, 999999);
    const v = int(rng, 1000, 9999) / 1000;
    return up(level) ? -v : v;
  };
  const pool = new Set<number>();
  while (pool.size < 5) pool.add(genOne());
  const values = [...pool];
  const big = Math.max(...values);
  return { kind: 'qcm', prompt: `Quel nombre est le plus grand ?`, choices: shuffle(rng, values.map((v) => fr(v))), answer: fr(big), hint: 'Compare les chiffres de gauche à droite, rang par rang.' };
};

export const ranger: Generator = (rng, grade, level) => {
  const pool = new Set<number>();
  const base = grade === 'CE1' ? int(rng, 1, 5) * 100 : grade === 'CM1' ? int(rng, 1, 9) * 10000 : int(rng, 1, 9);
  while (pool.size < (up(level) ? 5 : 4)) {
    const v = grade === '6e' ? Math.round((base + int(rng, 0, 99) / 100 - 0.5) * 100) / 100 : base + pick(rng, grade === 'CE1' ? [3, 30, 33, 50, 5, 53] : [305, 3050, 350, 5030, 30500]);
    pool.add(v);
  }
  const values = [...pool];
  const sorted = [...values].sort((x, y) => x - y).map((v) => fr(v));
  return { kind: 'ordre', prompt: 'Range ces nombres du plus petit au plus grand.', choices: values.map((v) => fr(v)), answer: sorted, hint: "Regarde d'abord le nombre de chiffres avant la virgule." };
};

export const addition: Generator = (rng, grade, level) => {
  if (grade === 'CE1') {
    const a = int(rng, 100, up(level) ? 699 : 499);
    const b = int(rng, 100, up(level) ? 299 : 399);
    const answer = a + b;
    return { kind: 'qcm', prompt: `Pose et calcule : ${a} + ${b}`, ...numChoices(rng, answer, undefined, [10, -10, 100, -100]), hint: 'Additionne les unités, puis les dizaines, sans oublier la retenue.' };
  }
  if (grade === 'CM1') {
    const a = up(level) ? int(rng, 100, 999) / 10 : int(rng, 1000, 49999);
    const b = up(level) ? int(rng, 10, 999) / 100 : int(rng, 1000, 49999);
    const answer = Math.round((a + b) * 100) / 100;
    const decimals = up(level) ? 2 : undefined;
    return { kind: 'qcm', prompt: `Calcule : ${fr(a)} + ${fr(b)}`, ...numChoices(rng, answer, decimals), hint: 'Aligne les virgules (ou les unités) avant de poser.' };
  }
  if (up(level)) {
    const a = -int(rng, 1, 15);
    const b = pick(rng, [-1, 1]) * int(rng, 1, 15);
    const answer = a + b;
    return { kind: 'qcm', prompt: `Calcule : (${fr(a)}) + (${fr(b)})`, ...numChoices(rng, answer, undefined, [-a - b + a, Math.abs(a) + Math.abs(b), -(Math.abs(a) + Math.abs(b))]), hint: 'Deux nombres négatifs : on ajoute les distances à zéro et on garde le signe moins.' };
  }
  const a = int(rng, 100, 9999) / 100;
  const b = int(rng, 100, 9999) / 100;
  const answer = Math.round((a + b) * 100) / 100;
  return { kind: 'qcm', prompt: `Calcule : ${fr(a)} + ${fr(b)}`, ...numChoices(rng, answer, 2), hint: 'Aligne les virgules.' };
};

export const multiplication: Generator = (rng, grade, level) => {
  if (grade === 'CE1') {
    const a = int(rng, 2, up(level) ? 9 : 5);
    const b = int(rng, 2, 10);
    const answer = a * b;
    return { kind: 'qcm', prompt: up(level) ? `${a} caisses de ${b} livres. Combien de livres en tout ?` : `Calcule : ${a} × ${b}`, ...numChoices(rng, answer, undefined, [a, -a, b, -b]), hint: `C'est ${a} fois ${b}.` };
  }
  if (grade === 'CM1') {
    const a = int(rng, 12, up(level) ? 99 : 49);
    const b = int(rng, 3, 9);
    const answer = a * b;
    return { kind: 'qcm', prompt: `Calcule : ${a} × ${b}`, ...numChoices(rng, answer, undefined, [a, -a, b, -b]), hint: `Décompose : ${a} × ${b} = ${Math.floor(a / 10) * 10} × ${b} + ${a % 10} × ${b}.` };
  }
  const a = int(rng, 11, 999) / 10;
  const f = pick(rng, up(level) ? [0.01, 0.5, 0.25] : [10, 100, 0.1]);
  const answer = Math.round(a * f * 1e4) / 1e4;
  return {
    kind: 'qcm',
    prompt: `Calcule : ${fr(a)} × ${fr(f)}`,
    ...numChoices(rng, answer, answer % 1 === 0 ? undefined : 4, [answer * 10, answer / 10]),
    hint: f === 0.1 || f === 0.01 ? "Multiplier par 0,1, c'est diviser par 10." : 'Déplace la virgule ou pense « la moitié », « le quart ».'
  };
};

export const fractionDe: Generator = (rng, grade, level) => {
  if (grade === 'CE1') {
    if (up(level)) {
      const n = int(rng, 2, 9) * 4;
      const answer = n / 4;
      return { kind: 'qcm', prompt: `Partage ${n} livres en 4 piles égales. Combien par pile ?`, ...numChoices(rng, answer, undefined, [n / 2, n]), hint: 'Partage en deux, puis encore en deux.' };
    }
    const n = int(rng, 6, 45) * 2;
    if (pick(rng, [true, false])) {
      const answer = n / 2;
      return { kind: 'qcm', prompt: `Quelle est la moitié de ${n} ?`, ...numChoices(rng, answer, undefined, [n, n / 4]), hint: "La moitié, c'est partager en 2 parts égales." };
    }
    const answer = n;
    return { kind: 'qcm', prompt: `Quel est le double de ${n / 2} ?`, ...numChoices(rng, answer, undefined, [n / 2, n / 4]), hint: "Le double, c'est le nombre plus lui-même." };
  }
  const den = pick(rng, grade === 'CM1' ? [2, 3, 4, 5, 10] : [3, 4, 5, 8]);
  const num = int(rng, 1, den - 1);
  const n = den * int(rng, 2, grade === 'CM1' ? 10 : 15);
  if (grade === '6e' && up(level)) {
    const pct = pick(rng, [10, 20, 25, 50, 75]);
    const total = pick(rng, [40, 60, 80, 120, 200]);
    const answer = (pct * total) / 100;
    return { kind: 'qcm', prompt: `Calcule ${pct} % de ${total}.`, ...numChoices(rng, answer, undefined, [total - answer, answer * 2]), hint: `${pct} %, c'est ${pct} sur 100.` };
  }
  const answer = (n / den) * num;
  return { kind: 'qcm', prompt: num === 1 ? `Calcule ${num}/${den} de ${n}.` : `Calcule les ${num}/${den} de ${n}.`, ...numChoices(rng, answer, undefined, [n / den, n - answer]), hint: `Divise ${n} par ${den}, puis multiplie par ${num}.` };
};

export const duree: Generator = (rng, grade, level) => {
  const step = grade === 'CE1' ? 30 : grade === 'CM1' ? 5 : 1;
  const start = (int(rng, 8, 17) * 60 + int(rng, 0, Math.floor(59 / step)) * step) % 1440;
  const length = grade === 'CE1' ? pick(rng, up(level) ? [90, 150] : [60, 120, 30]) : grade === 'CM1' ? int(rng, 2, up(level) ? 35 : 23) * 5 : int(rng, 25, up(level) ? 215 : 140);
  const end = start + length;
  const dur = length >= 60 ? `${Math.floor(length / 60)} h ${String(length % 60).padStart(2, '0')}` : `${length} min`;
  const distractors = [hm(end - 60), hm(end + 60), hm(start + Math.round(length / 2)), hm(end - 5)];
  return {
    kind: 'qcm',
    prompt: `Le départ est à ${hm(start)}, le trajet dure ${dur}. À quelle heure arrive-t-on ?`,
    ...textChoices(rng, hm(end), distractors),
    clock: clock(start),
    hint: "Ajoute d'abord les heures, puis les minutes. 60 minutes font 1 heure."
  };
};

export const conversion: Generator = (rng, grade, level) => {
  if (grade === 'CE1') {
    const m = int(rng, 1, 9);
    if (up(level)) {
      const cm = int(rng, 1, 9) * 10;
      const answer = m * 100 + cm;
      return { kind: 'qcm', prompt: `${m} m ${cm} cm = ? cm`, ...numChoices(rng, answer, undefined, [m, cm, -cm]), hint: '1 m = 100 cm.' };
    }
    if (pick(rng, [true, false])) {
      const answer = m * 100;
      return { kind: 'qcm', prompt: `${m} m = ? cm`, ...numChoices(rng, answer, undefined, [m, m * 10]), hint: '1 m = 100 cm.' };
    }
    return { kind: 'qcm', prompt: `${m * 100} cm = ? m`, ...numChoices(rng, m, undefined, [m * 10, m * 100]), hint: '100 cm = 1 m.' };
  }
  if (grade === 'CM1') {
    const km = up(level) ? int(rng, 11, 99) / 10 : int(rng, 1, 9);
    const answer = Math.round(km * 1000);
    return { kind: 'qcm', prompt: `${fr(km)} km = ? m`, ...numChoices(rng, answer, undefined, [km, answer / 10, answer * 10]), hint: '1 km = 1 000 m.' };
  }
  const cm = int(rng, 15, 950) / 10;
  const facteur = up(level) ? 25 : 10;
  const answer = Math.round(cm * facteur * 100) / 100;
  return { kind: 'qcm', prompt: `Sur un plan, 1 cm représente ${facteur} m. Combien de mètres pour ${fr(cm)} cm ?`, ...numChoices(rng, answer, 2, [cm, answer / facteur]), hint: "C'est une situation de proportionnalité : multiplie." };
};

export const arrondi: Generator = (rng, grade, level) => {
  if (grade === 'CE1') {
    const n = int(rng, 100, 999);
    const answer = Math.floor(n / 10);
    return { kind: 'qcm', prompt: `Combien y a-t-il de dizaines dans ${n} ?`, ...numChoices(rng, answer, undefined, [Math.floor(n / 100), n % 10]), hint: 'Cache le chiffre des unités.' };
  }
  if (grade === 'CM1') {
    const n = int(rng, 1000, 99999) / 100;
    if (up(level)) {
      const answer = Math.floor(n * 10) % 10;
      return { kind: 'qcm', prompt: `Quel est le chiffre des dixièmes dans ${fr(n, 2)} ?`, ...numChoices(rng, answer, undefined, [Math.floor(n) % 10, Math.round(n * 100) % 10]), hint: 'Les dixièmes sont juste après la virgule.' };
    }
    const answer = Math.round(n);
    return { kind: 'qcm', prompt: `Arrondis ${fr(n, 2)} à l'unité.`, ...numChoices(rng, answer, undefined, [Math.floor(n), Math.ceil(n)]), hint: 'Regarde le chiffre après la virgule : 5 ou plus, on arrondit au-dessus.' };
  }
  const n = int(rng, 1000, 99999) / 1000;
  const decimals = up(level) ? 2 : 1;
  const answer = up(level) ? Math.round(n * 100) / 100 : Math.round(n * 10) / 10;
  return { kind: 'qcm', prompt: `Arrondis ${fr(n, 3)} au ${up(level) ? 'centième' : 'dixième'}.`, ...numChoices(rng, answer, decimals), hint: `Regarde le chiffre juste après le ${up(level) ? 'centième' : 'dixième'}.` };
};

export const MATHS = { suite, comparer, ranger, addition, multiplication, 'fraction-de': fractionDe, duree, conversion, arrondi } as const;
