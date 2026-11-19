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

/**
 * Lit une réplique de dialogue : voix pré-générée (Chirp3-HD, précachée hors ligne) si elle
 * existe pour ce personnage et ce texte exact, sinon repli sur la synthèse du navigateur.
 */
export function sayLine(who: string, text: string, fallbackText: string): void {
  stopSpeaking();
  const url = precomputedVoiceUrl(who, text);
  if (!url) {
    say(fallbackText);
    return;
  }
  const audio = new Audio(url);
  playing = audio;
  audio.play().catch(() => {
    if (playing === audio) playing = undefined;
    say(fallbackText);
  });
}
