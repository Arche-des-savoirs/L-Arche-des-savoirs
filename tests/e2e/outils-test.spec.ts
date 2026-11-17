import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ timeout: 120_000 });

const cap = (page: Page, name: string) => page.screenshot({ path: `test-results/captures/${name}.png` });

/** Partie en cours : avatars faits, séance du jour déjà jouée (le calendrier bloque normalement). */
async function seedPlayedToday(page: Page) {
  await expect(page.getByRole('navigation', { name: 'Menu principal' })).toBeVisible();
  await page.evaluate(() => {
    const now = Date.now();
    const prof = (hair: string, cape: string, accessory: string) => ({ hair, cape, accessory, companionConfirmed: true });
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const data: Record<string, unknown> = {
      profiles: { axelle: prof('laches', 'or', 'etoile'), maelle: prof('tresse', 'argent', 'noeud'), rafaelle: prof('queue', 'rose', 'fleur') },
      game: {
        version: 1, position: { chapter: 1, day: 3 }, sessionsPlayed: 2, counters: { L: 0, C: 0, M: 0, O: 0 }, flags: [], checkpoints: {}, choices: [],
        calendar: { lastSessionAt: now - 1000, lastDayKey: key, extraGranted: [], extraUsed: [] }, session: null, endingsSeen: []
      },
      progress: null,
      history: [],
      settings: { pin: '1357', rate: 0.95 }
    };
    return new Promise<void>((resolve, reject) => {
      const open = indexedDB.open('arche-des-savoirs');
      open.onsuccess = () => {
        const tx = open.result.transaction('meta', 'readwrite');
        for (const [k, value] of Object.entries(data)) tx.objectStore('meta').put({ key: k, value });
        tx.oncomplete = () => (open.result.close(), resolve());
        tx.onerror = () => reject(tx.error);
      };
    });
  });
  await page.reload();
}

async function openParent(page: Page, pin: string) {
  await page.getByRole('heading', { name: "L'Arche des Savoirs" }).dispatchEvent('pointerdown');
  await page.waitForTimeout(3300);
  for (const d of pin) await page.locator('.ui-pin-keys .ui-key', { hasText: new RegExp(`^${d}$`) }).click();
  await page.getByRole('tab', { name: 'Réglages' }).click();
}

test('mode test : aller à un chapitre, avancer et revenir sur les étapes et les questions, séances illimitées', async ({ page }) => {
  page.setDefaultTimeout(5000);
  await page.goto('./');
  await seedPlayedToday(page);
  await openParent(page, '1357');

  await page.getByLabel(/Activer le mode test/).check();
  await page.getByLabel('Chapitre').selectOption('3');
  await page.getByLabel('Jour').selectOption('2');
  await page.getByRole('button', { name: 'Aller à' }).click();
  await expect(page.getByText('Partie placée au chapitre 3, jour 2.')).toBeVisible();
  await cap(page, 'test-reglages');
  await page.getByRole('button', { name: /Quitter le mode parent/ }).click();

  // Le calendrier ne bloque plus : la séance du chapitre 3 jour 2 démarre.
  await page.getByRole('button', { name: 'Séance du jour' }).click();
  const bar = page.locator('.ui-session-bar');
  await expect(bar).toContainText('Chapitre III · Jour II');
  const steps = page.getByRole('toolbar', { name: 'Mode test, étapes' });
  await expect(steps.getByRole('button', { name: '⏮ Étape' })).toBeDisabled();

  // Avancer jusqu'à la première manche, revenir d'une étape puis y retourner.
  const progress = page.getByRole('progressbar', { name: 'Avancement de la séance' });
  const questions = page.getByRole('toolbar', { name: 'Mode test', exact: true });
  const handover = page.locator('.ui-handover');
  for (let i = 0; i < 10 && !(await handover.isVisible()); i++) await steps.getByRole('button', { name: 'Étape ⏭' }).click();
  await handover.getByRole('button').last().click();
  await expect(questions).toBeVisible();
  const at = Number(await progress.getAttribute('value'));
  await steps.getByRole('button', { name: '⏮ Étape' }).click();
  await expect(progress).toHaveAttribute('value', String(at - 1));
  await steps.getByRole('button', { name: 'Étape ⏭' }).click();
  await handover.getByRole('button').last().click();

  // Sur les questions : suivante, puis précédente ramène à la même question.
  const prompt = page.locator('.ui-question-main p').first();
  const first = await prompt.innerText();
  await questions.getByRole('button', { name: '⏭ Question suivante' }).click();
  await expect(prompt).not.toHaveText(first);
  await cap(page, 'test-question');
  await questions.getByRole('button', { name: '⏮ Question précédente' }).click();
  await expect(prompt).toHaveText(first);

  // Sauter toute la séance (le Conseil est voté A d'office) : on arrive au lendemain.
  for (let i = 0; i < 30 && (await steps.isVisible()); i++) await steps.getByRole('button', { name: 'Étape ⏭' }).click();
  await expect(steps).toHaveCount(0);
  await cap(page, 'test-fin-seance');

  // Deuxième séance le même jour : autorisée en mode test, jour III.
  await page.goto('./');
  await page.getByRole('button', { name: 'Séance du jour' }).click();
  await expect(bar).toContainText('Chapitre III · Jour III');
});

test('réinitialisation : confirmation EFFACER, puis retour au tout premier lancement', async ({ page }) => {
  page.setDefaultTimeout(5000);
  await page.goto('./');
  await seedPlayedToday(page);
  await expect(page.getByRole('button', { name: 'Séance du jour' })).toBeVisible();
  await openParent(page, '1357');

  await page.getByRole('button', { name: 'Tout réinitialiser…' }).click();
  const confirm = page.getByRole('button', { name: 'Effacer définitivement' });
  await expect(confirm).toBeDisabled();
  await page.getByLabel('Écris EFFACER pour confirmer').fill('effacer');
  await expect(confirm).toBeEnabled();
  await cap(page, 'reinitialisation');
  await confirm.click();

  // Premier lancement : bouton d'aventure neuf, code parent revenu à 0000.
  await expect(page.getByRole('button', { name: "Commencer l'aventure" })).toBeVisible({ timeout: 10_000 });
  await page.reload();
  await expect(page.getByRole('button', { name: "Commencer l'aventure" })).toBeVisible();
  await openParent(page, '0000');
  await expect(page.getByLabel(/Activer le mode test/)).not.toBeChecked();
  await cap(page, 'reinitialisation-apres');
});
