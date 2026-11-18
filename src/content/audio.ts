// Voix pré-générées (narrateur + personnages principaux, Google Cloud TTS Chirp3-HD),
// précachées par le service worker pour une lecture 100 % hors ligne en jeu.
import manifest from './voiceManifest.json';
import type { Chapter, Fin } from './schema';

const base = () => import.meta.env.BASE_URL;
export const manifestKey = (who: string, text: string) => `${who}\u0000${text}`;

/** Chemin du fichier audio pré-généré pour cette réplique, ou undefined si aucune voix n'a été générée pour elle. */
export function precomputedVoiceUrl(who: string, text: string): string | undefined {
  const hash = (manifest as Record<string, string>)[manifestKey(who, text)];
  return hash ? `${base()}audio/voix/${hash}.ogg` : undefined;
}

/**
 * Répliques effectivement lues à voix haute en jeu (voir Common.tsx `<Dialogue>` et
 * Session.tsx `case 'convergence'`) : ouverture/clôture de chaque jour, et les 3 variantes de
 * la décision de chapitre (scène + réplique). Doit rester synchronisé avec
 * scripts/generate-voices.mjs, qui extrait les mêmes répliques pour la génération.
 */
export function extractVoicedLines(chapter: Chapter): Array<{ who: string; text: string }> {
  const lines: Array<{ who: string; text: string }> = [];
  for (const day of chapter.days) {
    for (const l of day.opening) lines.push({ who: l.who, text: l.text });
    for (const l of day.closing) lines.push({ who: l.who, text: l.text });
  }
  if (chapter.decision) {
    for (const key of ['A', 'B', 'C'] as const) {
      const opt = chapter.decision.options[key];
      lines.push({ who: 'narrateur', text: opt.scene });
      lines.push({ who: opt.line.who, text: opt.line.text });
    }
  }
  return lines;
}

/**
 * Répliques lues à voix haute pour une fin (jour 6 du chapitre 30, voir
 * src/ui/screens/Fin.tsx) : ouverture et clôture. Doit rester synchronisé avec
 * scripts/generate-voices.mjs (extractFinLines).
 */
export function extractVoicedLinesFin(fin: Fin): Array<{ who: string; text: string }> {
  return [...fin.opening, ...fin.closing].map((l) => ({ who: l.who, text: l.text }));
}
