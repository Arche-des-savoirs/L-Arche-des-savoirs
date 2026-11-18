// Chargement et validation des chapitres (YAML → objet typé et vérifié).
import ch01 from '../../content/chapters/ch01.yaml';
import ch02 from '../../content/chapters/ch02.yaml';
import ch03 from '../../content/chapters/ch03.yaml';
import ch04 from '../../content/chapters/ch04.yaml';
import ch05 from '../../content/chapters/ch05.yaml';
import ch06 from '../../content/chapters/ch06.yaml';
import ch07 from '../../content/chapters/ch07.yaml';
import ch08 from '../../content/chapters/ch08.yaml';
import ch09 from '../../content/chapters/ch09.yaml';
import ch10 from '../../content/chapters/ch10.yaml';
import ch11 from '../../content/chapters/ch11.yaml';
import ch12 from '../../content/chapters/ch12.yaml';
import ch13 from '../../content/chapters/ch13.yaml';
import ch14 from '../../content/chapters/ch14.yaml';
import ch15 from '../../content/chapters/ch15.yaml';
import ch16 from '../../content/chapters/ch16.yaml';
import ch17 from '../../content/chapters/ch17.yaml';
import ch18 from '../../content/chapters/ch18.yaml';
import ch19 from '../../content/chapters/ch19.yaml';
import ch20 from '../../content/chapters/ch20.yaml';
import ch21 from '../../content/chapters/ch21.yaml';
import { chapter, type Chapter } from './schema';

export const CHAPTERS: Chapter[] = [ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, ch09, ch10, ch11, ch12, ch13, ch14, ch15, ch16, ch17, ch18, ch19, ch20, ch21].map((raw, i) => {
  const parsed = chapter.safeParse(raw);
  if (!parsed.success) throw new Error(`Chapitre ${i + 1} invalide : ${parsed.error.message}`);
  return parsed.data;
});

export const chapterOf = (n: number): Chapter | undefined => CHAPTERS.find((c) => c.number === n);
