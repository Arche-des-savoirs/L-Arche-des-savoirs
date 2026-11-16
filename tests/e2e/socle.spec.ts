import { expect, test } from '@playwright/test';

test("l'accueil s'affiche avec la scène et les boutons", async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: "L'Arche des Savoirs" })).toBeVisible();
  await expect(page.getByRole('img', { name: 'La Porte des Trois Lueurs' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Diagnostic' })).toBeVisible();
  await page.screenshot({ path: 'test-results/captures/accueil.png' });
});

test('le diagnostic affiche les contrôles de la tablette', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Diagnostic' }).click();
  await expect(page.getByRole('heading', { name: 'Diagnostic de la tablette' })).toBeVisible();
  for (const label of ['Mode hors ligne', 'Mise en veille', 'Stockage persistant', 'Test de sauvegarde']) {
    await expect(page.getByRole('rowheader', { name: label })).toBeVisible();
  }
  await expect(page.getByText(/Diagnostic ouvert 1 fois/)).toBeVisible();
  await page.screenshot({ path: 'test-results/captures/diagnostic.png', fullPage: true });
  await page.getByRole('button', { name: '← Retour' }).click();
  await expect(page.getByRole('heading', { name: "L'Arche des Savoirs" })).toBeVisible();
});

test('la sauvegarde survit à un rechargement', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Diagnostic' }).click();
  await expect(page.getByText(/Diagnostic ouvert 1 fois/)).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Diagnostic' }).click();
  await expect(page.getByText(/Diagnostic ouvert 2 fois/)).toBeVisible();
});

test("l'app démarre sans réseau une fois installée", async ({ page, context }) => {
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload(); // la page est maintenant contrôlée par le service worker
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: "L'Arche des Savoirs" })).toBeVisible();
  await page.getByRole('button', { name: 'Diagnostic' }).click();
  await expect(page.getByRole('cell', { name: 'Hors ligne', exact: true })).toBeVisible();
  await expect(page.getByText('Prêt : le jeu marche sans réseau')).toBeVisible();
  await page.screenshot({ path: 'test-results/captures/hors-ligne.png', fullPage: true });
});
