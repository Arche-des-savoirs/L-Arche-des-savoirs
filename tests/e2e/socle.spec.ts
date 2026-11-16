import { expect, test } from '@playwright/test';

test("l'accueil s'affiche avec la scène et les boutons", async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: "L'Arche des Savoirs" })).toBeVisible();
  const img = page.getByRole('img', { name: /Illustration du chapitre 1/ });
  await expect(img).toBeVisible();
  await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(1000);
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
  // Les illustrations sont dans le cache : elles s'affichent sans réseau.
  const ok = await page.evaluate(async () => (await Promise.all(['ch01', 'ch15', 'ch30', 'epilogue'].map((n) => fetch(`images/chapitres/${n}.webp`).then((r) => r.ok && r.headers.get('content-type')?.includes('image'))))).every(Boolean));
  expect(ok).toBe(true);
  await page.screenshot({ path: 'test-results/captures/hors-ligne.png', fullPage: true });
});
