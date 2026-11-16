import { describe, expect, it } from 'vitest';
import { frenchVoices, loadFrenchVoices, loadVoices } from '../../src/platform/voices';

const v = (name: string, lang: string, localService: boolean) => ({ name, lang, localService }) as SpeechSynthesisVoice;
const all = [
  v('Microsoft Denise Online (Natural) - French (France)', 'fr-FR', false),
  v('Microsoft Paul - French (France)', 'fr-FR', true),
  v('Microsoft David - English (United States)', 'en-US', true),
  v('Microsoft Hortense - French (France)', 'fr-FR', true),
  v('Microsoft Julie - French (France)', 'fr-FR', true)
];

describe('voix françaises', () => {
  it('garde le français et met les voix hors ligne en premier', () => {
    const names = frenchVoices(all).map((x) => x.name);
    expect(names).toEqual([
      'Microsoft Hortense - French (France)',
      'Microsoft Julie - French (France)',
      'Microsoft Paul - French (France)',
      'Microsoft Denise Online (Natural) - French (France)'
    ]);
  });

  it('attend voiceschanged quand la liste arrive en retard', async () => {
    let ready = false;
    let cb: (() => void) | undefined;
    const synth = {
      getVoices: () => (ready ? all : []),
      addEventListener: (_: 'voiceschanged', f: () => void) => (cb = f)
    };
    const p = loadFrenchVoices(synth);
    ready = true;
    cb?.();
    const res = await p;
    expect(res).toHaveLength(4);
    expect(res[0]).toEqual({ name: 'Microsoft Hortense - French (France)', lang: 'fr-FR', local: true });
  });

  it('renvoie une liste vide sans synthèse vocale', async () => {
    expect(await loadFrenchVoices(undefined)).toEqual([]);
  });
});

describe('chargement tardif des voix', () => {
  it("trouve les voix par interrogation même sans voiceschanged", async () => {
    let ready = false;
    const synth = { getVoices: () => (ready ? all : []) };
    setTimeout(() => (ready = true), 300);
    const res = await loadVoices(synth, 3000);
    expect(res).toHaveLength(5);
    expect(res.filter((x) => x.lang.startsWith('fr'))).toHaveLength(4);
  });

  it('abandonne proprement après le délai', async () => {
    const res = await loadVoices({ getVoices: () => [] }, 300);
    expect(res).toEqual([]);
  });
});
