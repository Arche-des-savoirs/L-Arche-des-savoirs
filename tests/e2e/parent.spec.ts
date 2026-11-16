import { expect, test, type Page } from '@playwright/test';

const cap = (page: Page, name: string) => page.screenshot({ path: `test-results/captures/${name}.png` });
const HOUR = 3600 * 1000;

/** Partie fictive : 2 séances terminées, dont une réponse « pas sûr » récente et un vote au chapitre 1. */
async function seedPlayed(page: Page) {
  await expect(page.getByRole('navigation', { name: 'Menu principal' })).toBeVisible();
  await page.evaluate((HOUR) => {
    const now = Date.now();
    const res = (o: Record<string, unknown>) => ({ questionId: 'q', player: 'axelle', subject: 'maths', level: 2, verdict: 'juste', attempts: 1, helped: false, response: '398', at: now - 30 * HOUR, prompt: 'Complète : 396, 397, …, 399.', expected: '398', ...o });
    const prof = (hair: string, cape: string, accessory: string) => ({ hair, cape, accessory, companionConfirmed: true });
    const data: Record<string, unknown> = {
      profiles: { axelle: prof('laches', 'or', 'etoile'), maelle: prof('tresse', 'argent', 'noeud'), rafaelle: prof('queue', 'rose', 'fleur') },
      game: {
        version: 1, position: { chapter: 2, day: 1 }, sessionsPlayed: 5, counters: { L: 1, C: 0, M: 0, O: 0 }, flags: ['NILO_AMI'], checkpoints: {},
        choices: [{ chapter: 1, first: { axelle: 'A', maelle: 'A', rafaelle: 'A' }, palabre: false, result: 'A' }],
        calendar: { lastSessionAt: now - 1000, lastDayKey: '2099-01-01', extraGranted: [], extraUsed: [] }, session: null, endingsSeen: []
      },
      progress: null,
      history: [
        { chapter: 1, day: 1, startedAt: now - 30 * HOUR, endedAt: now - 29.5 * HOUR, extra: false, results: [res({}), res({ player: 'maelle', verdict: 'faux', response: '12', expected: '15', prompt: 'Calcule les 3/4 de 20.' })] },
        { chapter: 1, day: 2, startedAt: now - 2 * HOUR, endedAt: now - 1.5 * HOUR, extra: false, results: [res({ player: 'rafaelle', subject: 'francais', verdict: 'pas-sur', response: 'bibliothécaire', expected: 'bibliothécaire', prompt: 'Donne un mot de la même famille que « bibliothèque ».', at: now - 2 * HOUR })] }
      ]
    };
    return new Promise<void>((resolve, reject) => {
      const open = indexedDB.open('arche-des-savoirs');
      open.onsuccess = () => {
        const tx = open.result.transaction('meta', 'readwrite');
        for (const [key, value] of Object.entries(data)) tx.objectStore('meta').put({ key, value });
        tx.oncomplete = () => (open.result.close(), resolve());
        tx.onerror = () => reject(tx.error);
      };
    });
  }, HOUR);
  await page.reload();
}

async function openParent(page: Page, pin = '0000') {
  const title = page.getByRole('heading', { name: "L'Arche des Savoirs" });
  await title.dispatchEvent('pointerdown');
  await page.waitForTimeout(1000);
  await expect(page.getByRole('dialog', { name: 'Code parent' })).toHaveCount(0); // 1 s ne suffit pas
  await page.waitForTimeout(2200);
  await expect(page.getByRole('dialog', { name: 'Code parent' })).toBeVisible();
  for (const d of pin) await page.locator('.ui-pin-keys .ui-key', { hasText: new RegExp(`^${d}$`) }).click();
}

test('accès parent : appui long de 3 s puis code ; un mauvais code est refusé', async ({ page }) => {
  await page.goto('./');
  await openParent(page, '1234');
  await expect(page.getByRole('alert')).toHaveText('Code incorrect.');
  await cap(page, 'parent-code');
  for (const d of '0000') await page.locator('.ui-pin-keys .ui-key', { hasText: new RegExp(`^${d}$`) }).click();
  await expect(page.getByRole('tab', { name: 'Bilan' })).toBeVisible();
});

test('bilan, historique par séance, validation, séance en plus, correction de vote, code et export', async ({ page }) => {
  await page.goto('./');
  await seedPlayed(page);
  await openParent(page);

  // Bilan : le « pas sûr » récent est encore à valider.
  await expect(page.getByRole('row', { name: /Français/ })).toContainText('1 à valider');
  await cap(page, 'parent-bilan');

  // Historique : la plus récente en premier, détail des questions.
  await page.getByRole('tab', { name: 'Historique' }).click();
  const rows = page.locator('.ui-history-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('Jour 2');
  await rows.nth(1).click();
  await expect(page.getByRole('cell', { name: /Calcule les 3\/4 de 20/ })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Faux', exact: true })).toBeVisible();
  await cap(page, 'parent-historique');

  // À valider : décision du parent.
  await page.getByRole('tab', { name: 'À valider (1)' }).click();
  await expect(page.getByText('Validation automatique dans 22 h')).toBeVisible();
  await cap(page, 'parent-a-valider');
  await page.getByRole('button', { name: 'Juste', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'À valider (0)' })).toBeVisible();

  // Réglages : séance en plus, correction du dernier vote, code.
  await page.getByRole('tab', { name: 'Réglages' }).click();
  await expect(page.getByText(/Chapitre 1 : Rassurer Plume/)).toBeVisible();
  await page.getByRole('button', { name: /^C — Noter la trace/ }).click();
  await page.getByRole('button', { name: 'Confirmer' }).click();
  await expect(page.getByText(/Chapitre 1 : Noter la trace/)).toBeVisible();
  await page.getByRole('button', { name: "Accorder une séance en plus aujourd'hui" }).click();
  await expect(page.getByText('Une séance en plus est accordée')).toBeVisible();
  await page.getByLabel('Nouveau code à 4 chiffres').fill('2468');
  await page.getByRole('button', { name: 'Changer le code' }).click();
  await expect(page.getByText('Nouveau code enregistré.')).toBeVisible();
  await cap(page, 'parent-reglages');

  // Export : un fichier JSON de la partie complète.
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exporter (fichier JSON)' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^arche-sauvegarde-\d{4}-\d{2}-\d{2}\.json$/);
  const json = JSON.parse(await (await file.createReadStream()).toArray().then((c) => Buffer.concat(c).toString('utf8')));
  expect(json.app).toBe('arche-des-savoirs');
  expect(json.data.game.choices[0].result).toBe('C');

  // Tout survit au rechargement ; le nouveau code est exigé.
  await page.waitForTimeout(400);
  await page.reload();
  await openParent(page, '0000');
  await expect(page.getByRole('alert')).toHaveText('Code incorrect.');
  for (const d of '2468') await page.locator('.ui-pin-keys .ui-key', { hasText: new RegExp(`^${d}$`) }).click();
  await expect(page.getByRole('tab', { name: 'À valider (0)' })).toBeVisible();
});
