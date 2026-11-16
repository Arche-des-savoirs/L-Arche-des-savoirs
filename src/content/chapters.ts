// Chargement et validation des chapitres (YAML → objet typé et vérifié).
import ch01 from '../../content/chapters/ch01.yaml';
import { chapter, type Chapter } from './schema';

export const CHAPTERS: Chapter[] = [ch01].map((raw, i) => {
  const parsed = chapter.safeParse(raw);
  if (!parsed.success) throw new Error(`Chapitre ${i + 1} invalide : ${parsed.error.message}`);
  return parsed.data;
});

export const chapterOf = (n: number): Chapter | undefined => CHAPTERS.find((c) => c.number === n);
