// Illustrations des introductions de chapitre (générées par IA, compressées en WebP, précachées par le service worker).
import imageManifest from './imageManifest.json';

const pad = (n: number) => String(n).padStart(2, '0');
const base = () => import.meta.env.BASE_URL;

export const chapterImage = (chapter: number) => `${base()}images/chapitres/ch${pad(chapter)}.webp`;
export const epilogueImage = () => `${base()}images/chapitres/epilogue.webp`;
/** Noms des fichiers attendus dans public/images/chapitres (vérifiés par les tests). */
export const IMAGE_FILES = [...Array.from({ length: 30 }, (_, i) => `ch${pad(i + 1)}.webp`), 'epilogue.webp'];

/** Image par réplique (voir scripts/generate-images-lignes.mjs, même format de clé). Chantier en
 * cours chapitre par chapitre : repli sur l'illustration du chapitre tant qu'une ligne précise
 * n'a pas encore la sienne. */
function lineImageKey(chapter: number, dayN: number | string, part: string, index: number) {
  return `ch${chapter}\u0000j${dayN}\u0000${part}\u0000${index}`;
}

export function lineImages(chapter: number, dayN: number | string, part: string, count: number): string[] {
  const manifest: Record<string, string> = imageManifest;
  return Array.from({ length: count }, (_, i) => {
    const hash = manifest[lineImageKey(chapter, dayN, part, i)];
    return hash ? `${base()}images/lignes/${hash}.webp` : chapterImage(chapter);
  });
}

/** Bustes d'avatar (générés par IA, voir docs/prompts-avatars-bustes.md), plusieurs variantes par sœur. */
export const bustImage = (player: string, bust: number) => `${base()}images/avatars/${player}-${bust}.webp`;
/** Portrait illustré du compagnon (généré par IA), voir COMPANION_IMAGE_READY dans profile.ts. */
export const companionImage = (player: string) => `${base()}images/avatars/companion-${player}.webp`;
