import { existsSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { IMAGE_FILES, chapterImage } from '../../src/content/images';
import { CHAPTERS } from '../../src/content/chapters';

describe('illustrations des chapitres', () => {
  it('les 31 images existent en WebP, chacune sous 500 Ko', () => {
    expect(IMAGE_FILES).toHaveLength(31);
    for (const f of IMAGE_FILES) {
      const path = `public/images/chapitres/${f}`;
      expect(existsSync(path), path).toBe(true);
      expect(statSync(path).size).toBeLessThan(500_000);
    }
  });
  it('chaque chapitre écrit pointe vers son image', () => {
    for (const ch of CHAPTERS) expect(chapterImage(ch.number)).toMatch(new RegExp(`ch${String(ch.number).padStart(2, '0')}\\.webp$`));
  });
});
