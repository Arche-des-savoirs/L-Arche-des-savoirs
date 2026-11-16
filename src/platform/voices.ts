// Voix françaises de la synthèse vocale (Web Speech API).
// Sur la Surface, Edge expose les voix Windows installées (Hortense, Julie, Paul),
// qui marchent hors ligne, et des voix « Natural » qui demandent le réseau.

export interface VoiceInfo {
  name: string;
  lang: string;
  local: boolean;
}

interface SynthLike {
  getVoices(): SpeechSynthesisVoice[];
  addEventListener?(type: 'voiceschanged', cb: () => void, opts?: { once: boolean }): void;
}

const toInfo = (v: SpeechSynthesisVoice): VoiceInfo => ({ name: v.name, lang: v.lang, local: v.localService });

/** Voix fr-*, voix locales (hors ligne) en premier. */
export function frenchVoices(all: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return all
    .filter((v) => v.lang.toLowerCase().startsWith('fr'))
    .sort((a, b) => Number(b.localService) - Number(a.localService) || a.name.localeCompare(b.name));
}

/** Les voix arrivent parfois après le chargement : on attend `voiceschanged` (1,5 s max). */
export function loadFrenchVoices(synth: SynthLike | undefined = globalThis.speechSynthesis): Promise<VoiceInfo[]> {
  if (!synth) return Promise.resolve([]);
  const read = () => frenchVoices(synth.getVoices()).map(toInfo);
  const now = read();
  if (now.length > 0) return Promise.resolve(now);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(read()), 1500);
    synth.addEventListener?.(
      'voiceschanged',
      () => {
        clearTimeout(timer);
        resolve(read());
      },
      { once: true }
    );
  });
}

/** Lit un texte. Hors ligne, seule une voix locale fonctionne : on la préfère. */
export function speak(text: string, voiceName?: string, rate = 0.95): boolean {
  const synth = globalThis.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return false;
  const voices = frenchVoices(synth.getVoices());
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const usable = voices.filter((v) => online || v.localService);
  const voice = usable.find((v) => v.name === voiceName) ?? usable[0];
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = voice?.lang ?? 'fr-FR';
  if (voice) u.voice = voice;
  u.rate = rate;
  synth.speak(u);
  return true;
}
