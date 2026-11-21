import { existsSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { extractVoicedLines, extractVoicedLinesFin, extractVoicedLinesQuestions, manifestKey } from '../../src/content/audio';
import { CHAPTERS } from '../../src/content/chapters';
import { FINS } from '../../src/content/fins';
import manifest from '../../src/content/voiceManifest.json';

const voices = manifest as Record<string, string>;

function expectVoiced(label: string, who: string, text: string) {
  const key = manifestKey(who, text);
  const hash = voices[key];
  expect(hash, `${label} — [${who}] « ${text.slice(0, 40)}… » absent du manifeste`).toBeDefined();
  const path = `public/audio/voix/${hash}.ogg`;
  expect(existsSync(path), path).toBe(true);
  expect(statSync(path).size).toBeGreaterThan(0);
  expect(statSync(path).size).toBeLessThan(5_000_000);
}

describe('voix pré-générées (narrateur + personnages)', () => {
  it('chaque réplique voisée de chaque chapitre a une voix générée sur disque', () => {
    for (const ch of CHAPTERS) for (const { who, text } of extractVoicedLines(ch)) expectVoiced(`chapitre ${ch.number}`, who, text);
  });

  it('chaque réplique voisée de chaque fin (jour 6) a une voix générée sur disque', () => {
    for (const f of FINS) for (const { who, text } of extractVoicedLinesFin(f)) expectVoiced(`fin ${f.id}`, who, text);
  });

  it('chaque prompt de question manuscrite de chaque chapitre a une voix générée sur disque', () => {
    for (const ch of CHAPTERS) for (const { who, text } of extractVoicedLinesQuestions(ch)) expectVoiced(`chapitre ${ch.number}`, who, text);
  });
});
