// Lecture à voix haute : voix fr-FR locale en priorité (Surface Go 3 : « français France »).
import { precomputedVoiceUrl } from '../content/audio';
import { loadFrenchVoices, preferredVoiceName, speak } from '../platform/voices';
import { save } from './store';

let preferred: string | undefined;
void loadFrenchVoices(undefined, 10000).then((v) => (preferred = preferredVoiceName(v))).catch(() => undefined);

let playing: HTMLAudioElement | undefined;

export const say = (text: string) => speak(text, save.value.settings.voiceName ?? preferred, save.value.settings.rate);

export const stopSpeaking = () => {
  globalThis.speechSynthesis?.cancel();
  if (playing) {
    playing.pause();
    playing.currentTime = 0;
    playing = undefined;
  }
};

/** Nombre de caractères lus par seconde à vitesse de lecture 1 : estimation de repli pour
 * la synthèse du navigateur (pas de durée connue à l'avance, contrairement à l'audio pré-généré). */
const CARACTERES_PAR_SECONDE = 15;

function estimateSpeechDurationMs(text: string): number {
  const rate = save.value.settings.rate || 1;
  return (text.length / (CARACTERES_PAR_SECONDE * rate)) * 1000;
}

/**
 * Lit une réplique de dialogue : voix pré-générée (Chirp3-HD, précachée hors ligne) si elle
 * existe pour ce personnage et ce texte exact, sinon repli sur la synthèse du navigateur.
 *
 * Retourne une promesse de durée (ms) — précise pour l'audio pré-généré (métadonnées réelles),
 * estimée pour le repli navigateur — utile pour caler un défilement sur le rythme de la lecture.
 */
export function sayLine(who: string, text: string, fallbackText: string): { durationMs: Promise<number> } {
  stopSpeaking();
  const url = precomputedVoiceUrl(who, text);
  if (!url) {
    say(fallbackText);
    return { durationMs: Promise.resolve(estimateSpeechDurationMs(fallbackText)) };
  }
  const audio = new Audio(url);
  playing = audio;
  const durationMs = new Promise<number>((resolve) => {
    if (audio.duration && Number.isFinite(audio.duration)) {
      resolve(audio.duration * 1000);
      return;
    }
    audio.addEventListener('loadedmetadata', () => resolve(audio.duration * 1000), { once: true });
  });
  audio.play().catch(() => {
    if (playing === audio) playing = undefined;
    say(fallbackText);
  });
  return { durationMs };
}
