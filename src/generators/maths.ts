// Générateurs de maths utilisés au chapitre 1. Chaque cellule dépend de la classe et du niveau (1-5).
import { pick } from '../engine/random';
import { clock, fr, hm, int, type Generator } from './types';

const up = (level: number) => level >= 4;

export const suite: Generator = (rng, grade, level) => {
  if (grade === 'CE1') {
    const step = pick(rng, up(level) ? [15, 25, 50] : level === 1 ? [1, 2, 10] : [5, 10, 15]);
    const start = int(rng, 1, up(level) ? 400 : 200);
    return { kind: 'nombre', prompt: `Complète la suite : ${start}, ${start + step}, ${start + 2 * step}, … Quel nombre vient ensuite ?`, answer: start + 3 * step, hint: `On ajoute ${step} à chaque fois.` };
  }
  if (grade === 'CM1') {
    const step = pick(rng, up(level) ? [0.25, 0.5, 1.5] : [25, 250, 1000]);
    const start = up(level) ? int(rng, 1, 20) : int(rng, 100, 9000);
    return { kind: 'nombre', prompt: `Complète : ${fr(start)} ; ${fr(start + step)} ; ${fr(start + 2 * step)} ; …`, answer: start + 3 * step, hint: `L'écart entre deux nombres est ${fr(step)}.` };
  }
  const r = pick(rng, up(level) ? [2, 3] : [0.1, 0.25, 0.5]);
  const start = int(rng, 1, 9);
  if (up(level)) return { kind: 'nombre', prompt: `Complète : ${start} ; ${start * r} ; ${start * r * r} ; …`, answer: start * r ** 3, hint: `On multiplie par ${r} à chaque fois.` };
  return { kind: 'nombre', prompt: `Complète : ${fr(start)} ; ${fr(start + r)} ; ${fr(start + 2 * r)} ; …`, answer: start + 3 * r, hint: `On ajoute ${fr(r)}.` };
};

export const comparer: Generator = (rng, grade, level) => {
  let a: number, b: number;
  if (grade === 'CE1') {
    a = int(rng, 100, up(level) ? 9999 : 999);
    b = a + pick(rng, [-90, -9, 9, 90, 100]);
  } else if (grade === 'CM1') {
    a = up(level) ? int(rng, 100, 999) / 100 : int(rng, 100000, 999999);
    b = up(level) ? Math.round((a + pick(rng, [-0.09, 0.1, -0.5])) * 100) / 100 : a + pick(rng, [-36000, 9000, 40000]);
  } else {
    a = int(rng, 1000, 9999) / 1000;
    b = Math.round((a + pick(rng, [-0.01, 0.1, -0.009])) * 1000) / 1000;
    if (up(level)) {
      a = -a;
      b = -b;
    }
  }
  const big = Math.max(a, b);
  return { kind: 'qcm', prompt: `Quel nombre est le plus grand ?`, choices: [fr(a), fr(b)], answer: fr(big), hint: 'Compare les chiffres de gauche à droite, rang par rang.' };
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
    return { kind: 'nombre', prompt: `Pose et calcule : ${a} + ${b}`, answer: a + b, hint: 'Additionne les unités, puis les dizaines, sans oublier la retenue.' };
  }
  if (grade === 'CM1') {
    const a = up(level) ? int(rng, 100, 999) / 10 : int(rng, 1000, 49999);
    const b = up(level) ? int(rng, 10, 999) / 100 : int(rng, 1000, 49999);
    return { kind: 'nombre', prompt: `Calcule : ${fr(a)} + ${fr(b)}`, answer: Math.round((a + b) * 100) / 100, hint: 'Aligne les virgules (ou les unités) avant de poser.' };
  }
  if (up(level)) {
    const a = -int(rng, 1, 15);
    const b = pick(rng, [-1, 1]) * int(rng, 1, 15);
    return { kind: 'nombre', prompt: `Calcule : (${fr(a)}) + (${fr(b)})`, answer: a + b, hint: 'Deux nombres négatifs : on ajoute les distances à zéro et on garde le signe moins.' };
  }
  const a = int(rng, 100, 9999) / 100;
  const b = int(rng, 100, 9999) / 100;
  return { kind: 'nombre', prompt: `Calcule : ${fr(a)} + ${fr(b)}`, answer: Math.round((a + b) * 100) / 100, hint: 'Aligne les virgules.' };
};

export const multiplication: Generator = (rng, grade, level) => {
  if (grade === 'CE1') {
    const a = int(rng, 2, up(level) ? 9 : 5);
    const b = int(rng, 2, 10);
    return { kind: 'nombre', prompt: up(level) ? `${a} caisses de ${b} livres. Combien de livres en tout ?` : `Calcule : ${a} × ${b}`, answer: a * b, hint: `C'est ${a} fois ${b}.` };
  }
  if (grade === 'CM1') {
    const a = int(rng, 12, up(level) ? 99 : 49);
    const b = int(rng, 3, 9);
    return { kind: 'nombre', prompt: `Calcule : ${a} × ${b}`, answer: a * b, hint: `Décompose : ${a} × ${b} = ${Math.floor(a / 10) * 10} × ${b} + ${a % 10} × ${b}.` };
  }
  const a = int(rng, 11, 999) / 10;
  const f = pick(rng, up(level) ? [0.01, 0.5, 0.25] : [10, 100, 0.1]);
  return { kind: 'nombre', prompt: `Calcule : ${fr(a)} × ${fr(f)}`, answer: Math.round(a * f * 1e4) / 1e4, hint: f === 0.1 || f === 0.01 ? 'Multiplier par 0,1, c\'est diviser par 10.' : 'Déplace la virgule ou pense « la moitié », « le quart ».' };
};

export const fractionDe: Generator = (rng, grade, level) => {
  if (grade === 'CE1') {
    if (up(level)) {
      const n = int(rng, 2, 9) * 4;
      return { kind: 'nombre', prompt: `Partage ${n} livres en 4 piles égales. Combien par pile ?`, answer: n / 4, hint: 'Partage en deux, puis encore en deux.' };
    }
    const n = int(rng, 6, 45) * 2;
    return pick(rng, [true, false])
      ? { kind: 'nombre', prompt: `Quelle est la moitié de ${n} ?`, answer: n / 2, hint: 'La moitié, c\'est partager en 2 parts égales.' }
      : { kind: 'nombre', prompt: `Quel est le double de ${n / 2} ?`, answer: n, hint: 'Le double, c\'est le nombre plus lui-même.' };
  }
  const den = pick(rng, grade === 'CM1' ? [2, 3, 4, 5, 10] : [3, 4, 5, 8]);
  const num = int(rng, 1, den - 1);
  const n = den * int(rng, 2, grade === 'CM1' ? 10 : 15);
  if (grade === '6e' && up(level)) {
    const pct = pick(rng, [10, 20, 25, 50, 75]);
    const total = pick(rng, [40, 60, 80, 120, 200]);
    return { kind: 'nombre', prompt: `Calcule ${pct} % de ${total}.`, answer: (pct * total) / 100, hint: `${pct} %, c'est ${pct} sur 100.` };
  }
  return { kind: 'nombre', prompt: num === 1 ? `Calcule ${num}/${den} de ${n}.` : `Calcule les ${num}/${den} de ${n}.`, answer: (n / den) * num, hint: `Divise ${n} par ${den}, puis multiplie par ${num}.` };
};

export const duree: Generator = (rng, grade, level) => {
  const step = grade === 'CE1' ? 30 : grade === 'CM1' ? 5 : 1;
  const start = (int(rng, 8, 17) * 60 + int(rng, 0, Math.floor(59 / step)) * step) % 1440;
  const length = grade === 'CE1' ? pick(rng, up(level) ? [90, 150] : [60, 120, 30]) : grade === 'CM1' ? int(rng, 2, up(level) ? 35 : 23) * 5 : int(rng, 25, up(level) ? 215 : 140);
  const end = start + length;
  const dur = length >= 60 ? `${Math.floor(length / 60)} h ${String(length % 60).padStart(2, '0')}` : `${length} min`;
  return {
    kind: 'court',
    prompt: `Le départ est à ${hm(start)}, le trajet dure ${dur}. À quelle heure arrive-t-on ?`,
    answer: hm(end),
    accept: [clock(end), clock(end).replace(':', 'h'), `${Math.floor(end / 60) % 24}h${String(end % 60).padStart(2, '0')}`],
    clock: clock(start),
    hint: "Ajoute d'abord les heures, puis les minutes. 60 minutes font 1 heure."
  };
};

export const conversion: Generator = (rng, grade, level) => {
  if (grade === 'CE1') {
    const m = int(rng, 1, 9);
    if (up(level)) {
      const cm = int(rng, 1, 9) * 10;
      return { kind: 'nombre', prompt: `${m} m ${cm} cm = ? cm`, answer: m * 100 + cm, hint: '1 m = 100 cm.' };
    }
    return pick(rng, [true, false])
      ? { kind: 'nombre', prompt: `${m} m = ? cm`, answer: m * 100, hint: '1 m = 100 cm.' }
      : { kind: 'nombre', prompt: `${m * 100} cm = ? m`, answer: m, hint: '100 cm = 1 m.' };
  }
  if (grade === 'CM1') {
    const km = up(level) ? int(rng, 11, 99) / 10 : int(rng, 1, 9);
    return { kind: 'nombre', prompt: `${fr(km)} km = ? m`, answer: Math.round(km * 1000), hint: '1 km = 1 000 m.' };
  }
  const cm = int(rng, 15, 950) / 10;
  return { kind: 'nombre', prompt: `Sur un plan, 1 cm représente ${up(level) ? 25 : 10} m. Combien de mètres pour ${fr(cm)} cm ?`, answer: Math.round(cm * (up(level) ? 25 : 10) * 100) / 100, hint: "C'est une situation de proportionnalité : multiplie." };
};

export const arrondi: Generator = (rng, grade, level) => {
  if (grade === 'CE1') {
    const n = int(rng, 100, 999);
    return { kind: 'nombre', prompt: `Combien y a-t-il de dizaines dans ${n} ?`, answer: Math.floor(n / 10), hint: 'Cache le chiffre des unités.' };
  }
  if (grade === 'CM1') {
    const n = int(rng, 1000, 99999) / 100;
    return up(level)
      ? { kind: 'nombre', prompt: `Quel est le chiffre des dixièmes dans ${fr(n, 2)} ?`, answer: Math.floor(n * 10) % 10, hint: 'Les dixièmes sont juste après la virgule.' }
      : { kind: 'nombre', prompt: `Arrondis ${fr(n, 2)} à l'unité.`, answer: Math.round(n), hint: 'Regarde le chiffre après la virgule : 5 ou plus, on arrondit au-dessus.' };
  }
  const n = int(rng, 1000, 99999) / 1000;
  return { kind: 'nombre', prompt: `Arrondis ${fr(n, 3)} au ${up(level) ? 'centième' : 'dixième'}.`, answer: up(level) ? Math.round(n * 100) / 100 : Math.round(n * 10) / 10, hint: `Regarde le chiffre juste après le ${up(level) ? 'centième' : 'dixième'}.` };
};

export const MATHS = { suite, comparer, ranger, addition, multiplication, 'fraction-de': fractionDe, duree, conversion, arrondi } as const;
