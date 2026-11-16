// Illustrations des introductions de chapitre (générées par IA, compressées en WebP, précachées par le service worker).
const pad = (n: number) => String(n).padStart(2, '0');
const base = () => import.meta.env.BASE_URL;

export const chapterImage = (chapter: number) => `${base()}images/chapitres/ch${pad(chapter)}.webp`;
export const epilogueImage = () => `${base()}images/chapitres/epilogue.webp`;
/** Noms des fichiers attendus dans public/images/chapitres (vérifiés par les tests). */
export const IMAGE_FILES = [...Array.from({ length: 30 }, (_, i) => `ch${pad(i + 1)}.webp`), 'epilogue.webp'];
