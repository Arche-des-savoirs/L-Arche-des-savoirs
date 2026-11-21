// Jour 6 du chapitre 30 : vote final entre les portes ouvertes, puis récit de la fin obtenue.
import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ timeout: 120_000 });

const cap = (page: Page, name: string) => page.screenshot({ path: `test-results/captures/${name}.png` });

/** Écrit directement dans la sauvegarde IndexedDB (clé → valeur de la table meta), puis recharge. */
async function seed(page: Page, patch: (data: Record<string, any>) => void) {
  await expect(page.getByRole('navigation', { name: 'Menu principal' })).toBeVisible();
  await page.evaluate(
    (src) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('arche-des-savoirs');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          if (!open.result.objectStoreNames.contains('meta')) return reject(new Error('Base pas encore créée'));
          const tx = open.result.transaction('meta', 'readwrite');
          const store = tx.objectStore('meta');
          const all = store.getAll();
          all.onsuccess = () => {
            const data: Record<string, any> = Object.fromEntries(all.result.map((r: { key: string; value: unknown }) => [r.key, r.value]));
            new Function('data', src)(data);
            for (const [key, value] of Object.entries(data)) store.put({ key, value });
          };
          tx.onerror = () => reject(tx.error);
          tx.oncomplete = () => {
            open.result.close();
            resolve();
          };
        };
      }),
    `(${patch.toString()})(data)`
  );
  await page.reload();
}

/** Place la partie au jour 6 du chapitre 30 (vote final), avec des compteurs n'ouvrant qu'une seule porte (F1), pour un vote sans ambiguïté. */
function seedFinalDay(data: Record<string, any>) {
  const prof = (hair: string, cape: string, accessory: string) => ({ hair, cape, accessory, companionConfirmed: true });
  data.profiles = { axelle: prof('laches', 'or', 'etoile'), maelle: prof('tresse', 'argent', 'noeud'), rafaelle: prof('queue', 'rose', 'fleur') };
  data.game = {
    version: 1,
    position: { chapter: 30, day: 6 },
    sessionsPlayed: 5,
    counters: { L: 3, C: -3, M: -3, O: 3 },
    flags: [],
    checkpoints: { 9: { counters: { L: 0, C: 0, M: 0, O: 0 }, flags: [], choicesLength: 0 } },
    choices: [],
    calendar: { lastSessionAt: 0, lastDayKey: '2000-01-01', extraGranted: [], extraUsed: [] },
    session: null,
    endingsSeen: []
  };
  data.progress = null;
  data.settings = { pin: '0000', rate: 0.95, testMode: true };
}

/** Traverse le vote secret (une seule porte ouverte, donc unanime dès le premier tour) puis le récit de la fin. */
async function playFinalVote(page: Page) {
  page.setDefaultTimeout(5000);
  for (let i = 0; i < 60; i++) {
    if (await page.getByRole('button', { name: 'Revoir la fin' }).isVisible()) return;
    const handover = page.getByRole('button', { name: /je vote$/ });
    if (await handover.isVisible()) {
      await handover.click();
      continue;
    }
    const opt = page.locator('.ui-vote-option').first();
    if (await opt.isVisible()) {
      await opt.click();
      continue;
    }
    let clicked = false;
    for (const name of ['Commencer le vote secret', 'Voir ce qui se passe', 'Suivant →', 'Continuer']) {
      const btn = page.getByRole('button', { name, exact: true });
      if (await btn.isVisible()) {
        // « Continuer » du mot de la fin reste désactivé tant que le texte manuscrit s'écrit encore.
        await btn.click({ timeout: name === 'Continuer' ? 15_000 : 5_000 });
        clicked = true;
        break;
      }
    }
    if (!clicked) await page.waitForTimeout(100);
  }
  throw new Error('Le vote final ne se termine pas');
}

test('chapitre 30, jour 6 : vote final (porte unique), récit, puis retour à l’accueil', async ({ page }) => {
  await page.goto('./');
  await seed(page, seedFinalDay);
  await page.getByRole('button', { name: 'Séance du jour' }).click();
  await expect(page.getByRole('heading', { name: 'Le vote final' })).toBeVisible();
  await cap(page, 'vote-final-intro');
  await playFinalVote(page);
  await expect(page.getByRole('button', { name: 'Revoir la fin' })).toBeVisible();
  await cap(page, 'fin-atteinte');

  // La relecture (depuis l'accueil, le jeu étant terminé) rejoue le récit sans redéclencher le vote.
  await page.getByRole('button', { name: 'Revoir la fin' }).click();
  await expect(page.getByRole('heading', { name: 'La Lumière Partagée' })).toBeVisible();
});
