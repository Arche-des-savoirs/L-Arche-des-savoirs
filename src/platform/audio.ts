// Petits sons synthétisés (aucun fichier, aucun réseau) : jouer une mesure au métronome.
let ctx: AudioContext | null = null;
const audio = () => (ctx ??= typeof AudioContext !== 'undefined' ? new AudioContext() : null);

/** Joue une suite de durées (en temps) ; renvoie la durée totale en ms. */
export function playRhythm(durations: number[], bpm = 76, pitch = 660): number {
  const c = audio();
  const beat = 60 / bpm;
  if (!c) return durations.reduce((a, d) => a + d, 0) * beat * 1000;
  void c.resume();
  let t = c.currentTime + 0.05;
  for (const d of durations) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = pitch;
    const len = Math.min(d * beat * 0.9, 1.2);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + len);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + len + 0.05);
    t += d * beat;
  }
  return durations.reduce((a, d) => a + d, 0) * beat * 1000;
}
