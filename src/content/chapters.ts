// Chargement et validation des chapitres (YAML → objet typé et vérifié).
import ch01 from '../../content/chapters/ch01.yaml';
import ch02 from '../../content/chapters/ch02.yaml';
import ch03 from '../../content/chapters/ch03.yaml';
import ch04 from '../../content/chapters/ch04.yaml';
import ch05 from '../../content/chapters/ch05.yaml';
import ch06 from '../../content/chapters/ch06.yaml';
import { chapter, type Chapter } from './schema';

export const CHAPTERS: Chapter[] = [ch01, ch02, ch03, ch04, ch05, ch06].map((raw, i) => {
  const parsed = chapter.safeParse(raw);
  if (!parsed.success) throw new Error(`Chapitre ${i + 1} invalide : ${parsed.error.message}`);
  return parsed.data;
});

export const chapterOf = (n: number): Chapter | undefined => CHAPTERS.find((c) => c.number === n);
