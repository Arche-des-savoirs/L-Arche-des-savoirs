import { existsSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { extractVoicedLines, manifestKey } from '../../src/content/audio';
import { CHAPTERS } from '../../src/content/chapters';
import manifest from '../../src/content/voiceManifest.json';

const voices = manifest as Record<string, string>;

describe('voix pré-générées (narrateur + personnages)', () => {
  it('chaque réplique voisée de chaque chapitre a une voix générée sur disque', () => {
    for (const ch of CHAPTERS) {
      for (const { who, text } of extractVoicedLines(ch)) {
        const key = manifestKey(who, text);
        const hash = voices[key];
        expect(hash, `chapitre ${ch.number} — [${who}] « ${text.slice(0, 40)}… » absent du manifeste`).toBeDefined();
        const path = `public/audio/voix/${hash}.ogg`;
        expect(existsSync(path), path).toBe(true);
        expect(statSync(path).size).toBeGreaterThan(0);
        expect(statSync(path).size).toBeLessThan(5_000_000);
      }
    }
  });
});
