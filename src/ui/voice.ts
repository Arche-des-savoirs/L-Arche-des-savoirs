// Lecture à voix haute : voix fr-FR locale en priorité (Surface Go 3 : « français France »).
import { loadFrenchVoices, speak } from '../platform/voices';
import { save } from './store';

let preferred: string | undefined;
void loadFrenchVoices(undefined, 10000).then((v) => (preferred = v[0]?.name)).catch(() => undefined);

export const say = (text: string) => speak(text, save.value.settings.voiceName ?? preferred, save.value.settings.rate);
export const stopSpeaking = () => globalThis.speechSynthesis?.cancel();
