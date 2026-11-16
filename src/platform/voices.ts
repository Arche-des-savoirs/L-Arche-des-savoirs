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
  addEventListener?(type: 'voiceschanged', cb: () => void): void;
}

const toInfo = (v: SpeechSynthesisVoice): VoiceInfo => ({ name: v.name, lang: v.lang, local: v.localService });

/** Voix fr-*, voix locales (hors ligne) en premier. */
export function frenchVoices(all: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return all
    .filter((v) => v.lang.toLowerCase().startsWith('fr'))
    .sort((a, b) => Number(b.localService) - Number(a.localService) || a.name.localeCompare(b.name));
}

/**
 * Toutes les voix vues par le navigateur. Edge remplit parfois la liste tard,
 * et `voiceschanged` peut partir avant qu'on l'écoute : on interroge aussi
 * la liste toutes les 250 ms, jusqu'à `timeoutMs`.
 */
export function loadVoices(synth: SynthLike | undefined = globalThis.speechSynthesis, timeoutMs = 10000): Promise<VoiceInfo[]> {
  if (!synth) return Promise.resolve([]);
  const read = () =>
    [...synth.getVoices()]
      .sort((a, b) => Number(b.localService) - Number(a.localService) || a.name.localeCompare(b.name))
      .map(toInfo);
  const now = read();
  if (now.length > 0) return Promise.resolve(now);
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearInterval(poll);
      clearTimeout(timer);
      resolve(read());
    };
    const poll = setInterval(() => {
      if (synth.getVoices().length > 0) finish();
    }, 250);
    const timer = setTimeout(finish, timeoutMs);
    synth.addEventListener?.('voiceschanged', () => {
      if (synth.getVoices().length > 0) finish();
    });
  });
}

/** Voix françaises seulement, voix hors ligne en premier. */
export async function loadFrenchVoices(synth: SynthLike | undefined = globalThis.speechSynthesis, timeoutMs = 10000): Promise<VoiceInfo[]> {
  return (await loadVoices(synth, timeoutMs)).filter((v) => v.lang.toLowerCase().startsWith('fr'));
}

/** Lit un texte. Hors ligne, seule une voix locale fonctionne : on la préfère. */
export function speak(text: string, voiceName?: string, rate = 0.95): boolean {
  const synth = globalThis.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return false;
  const all = synth.getVoices();
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const usable = frenchVoices(all).filter((v) => online || v.localService);
  const voice = all.find((v) => v.name === voiceName) ?? usable[0];
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = voice?.lang ?? 'fr-FR';
  if (voice) u.voice = voice;
  u.rate = rate;
  synth.speak(u);
  return true;
}
