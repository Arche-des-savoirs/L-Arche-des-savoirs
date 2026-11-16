import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ timeout: 300_000 });

const cap = (page: Page, name: string) => page.screenshot({ path: `test-results/captures/${name}.png` });

/** Écrit directement dans la sauvegarde IndexedDB (clé → valeur de la table meta), puis recharge. */
async function seed(page: Page, patch: (data: Record<string, any>) => void) {
  // L'accueil n'apparaît qu'après la première lecture : la base existe alors avec sa table meta.
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

async function createAvatars(page: Page) {
  await page.getByRole('button', { name: "Commencer l'aventure" }).click();
  await page.getByRole('button', { name: 'Une tresse' }).click();
  await page.getByRole('button', { name: 'Turquoise' }).click();
  await expect(page.getByRole('img', { name: "Avatar d'Axelle" }).or(page.getByRole('img', { name: 'Avatar de Axelle' }))).toBeVisible();
  await cap(page, 'avatar-creation');
  await page.getByRole('button', { name: "C'est moi !" }).click();
  await expect(page.getByText('Plume prend la forme de')).toBeVisible();
  await cap(page, 'avatar-compagnon');
  await page.getByRole('button', { name: /^Bienvenue/ }).click();
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: "C'est moi !" }).click();
    await page.getByRole('button', { name: /^Bienvenue/ }).click();
  }
}

const NEXT = ['Suivant →', 'Continuer', 'Commencer la manche', 'On reprend !', 'Terminer la séance', 'Voir ce qui se passe', 'Second vote', 'Commencer le vote secret', 'Voir la traduction'];

/** Joue l'étape visible avec une réponse quelconque (juste ou fausse) : sert à traverser une séance entière. */
async function autoStep(page: Page, voteIndex: { n: number }, captures: Set<string>) {
  const btn = (name: string | RegExp) => page.getByRole('button', { name, exact: typeof name === 'string' });
  const handover = page.getByRole('button', { name: /c'est parti|je vote$/ });
  if (await handover.isVisible()) return handover.click();
  if (await page.locator('.ui-vote-option').first().isVisible()) {
    const opts = page.locator('.ui-vote-option');
    const n = await opts.count();
    voteIndex.n++;
    return opts.nth(voteIndex.n % n).click();
  }
  if (await page.locator('.ui-pad').isVisible()) {
    if (!captures.has('pave')) captures.add('pave'), await cap(page, 'question-pave');
    await page.locator('.ui-key', { hasText: /^1$/ }).click();
    return page.locator('.ui-key-ok').click();
  }
  if (await page.locator('.ui-note-btn').first().isVisible()) {
    if (!captures.has('concert')) captures.add('concert'), await cap(page, 'concert');
    return page.locator('.ui-note-btn').first().click();
  }
  if (await page.locator('.ui-order').isVisible()) {
    if (!captures.has('ordre')) captures.add('ordre'), await cap(page, 'question-ordre');
    const chips = page.locator('button.ui-chip');
    while ((await chips.count()) > 0) await chips.first().click();
    return page.locator('.ui-order .ui-btn-main').click();
  }
  if (await page.locator('.ui-choice').first().isVisible()) {
    if (!captures.has('qcm')) captures.add('qcm'), await cap(page, 'question-qcm');
    return page.locator('.ui-choice').first().click();
  }
  if (await page.locator('textarea.ui-input').isVisible()) return btn("J'ai répondu").click();
  if (await page.locator('input.ui-input').isVisible()) {
    if (!captures.has('court')) captures.add('court'), await cap(page, 'question-courte');
    await page.locator('input.ui-input').fill('je ne sais pas');
    return btn('Valider').click();
  }
  if (await btn('Juste').isVisible()) {
    if (!captures.has('voix')) captures.add('voix'), await cap(page, 'voix-de-l-equipe');
    return btn('Juste').click();
  }
  for (const name of NEXT) if (await btn(name).isVisible()) return btn(name).click();
  throw new Error('Aucune action possible sur cet écran');
}

async function playUntilTomorrow(page: Page, captures = new Set<string>()) {
  const vote = { n: 0 };
  page.setDefaultTimeout(5000);
  let idle = 0;
  for (let i = 0; i < 800; i++) {
    if (await page.getByRole('heading', { name: /À demain/ }).isVisible()) return;
    try {
      await autoStep(page, vote, captures);
      idle = 0;
    } catch (e) {
      // Écran en cours de rendu : on laisse une chance avant d'échouer.
      if (++idle > 10) throw e;
      await page.waitForTimeout(100);
    }
  }
  throw new Error('La séance ne se termine pas');
}

test('première séance : avatars, ouverture, tours, aides, placement, pause, à demain', async ({ page }) => {
  await page.goto('./');
  await createAvatars(page);
  await expect(page.getByRole('heading', { name: /Jour 1 — L'arrivée à l'Arche/ })).toBeVisible();
  await cap(page, 'ouverture');
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Suivant →' }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('Bienvenida.')).toBeVisible();
  await cap(page, 'espagnol');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'Commencer la manche' }).click();
  await expect(page.getByText('Passe la tablette à')).toBeVisible();
  await cap(page, 'passage-de-main');
  await page.getByRole('button', { name: /c'est parti/ }).click();

  // Axelle, marche 1 : 396, 397, …, 399 → 398, avec l'indice de la Gardienne.
  await page.getByRole('button', { name: /Indice/ }).click();
  await expect(page.getByText(/Gardienne de l'indice, souffle/)).toBeVisible();
  for (const k of ['3', '9', '8']) await page.locator('.ui-key', { hasText: new RegExp(`^${k}$`) }).click();
  await page.locator('.ui-key-ok').click();
  await expect(page.getByText(/Bravo, Axelle/)).toBeVisible();
  await page.getByRole('button', { name: 'Continuer' }).click();

  // Marche 2 (ordre) puis deux erreurs : l'échelle s'arrête et donne la marche de départ.
  await expect(page.getByText('Marche 2 sur 5')).toBeVisible();
  for (const v of ['53', '305', '350', '503', '530']) await page.getByRole('button', { name: v, exact: true }).click();
  await cap(page, 'question-ordre');
  await page.locator('.ui-order .ui-btn-main').click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  for (let essai = 0; essai < 2; essai++) {
    await page.locator('.ui-key', { hasText: /^1$/ }).click();
    await page.locator('.ui-key-ok').click();
  }
  await expect(page.getByText('La réponse était : 382')).toBeVisible();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.locator('.ui-key', { hasText: /^1$/ }).click();
  await page.locator('.ui-key-ok').click();
  await page.locator('.ui-key', { hasText: /^1$/ }).click();
  await page.locator('.ui-key-ok').click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText(/Axelle commence à la marche 2 sur 5/)).toBeVisible();
  await cap(page, 'placement');
  await page.getByRole('button', { name: 'Continuer' }).click();

  // Reprise après fermeture : on revient au même endroit (tour de la 2e fille).
  await expect(page.locator('.ui-big-name')).toHaveText('Maelle');
  await page.waitForTimeout(500); // laisse IndexedDB terminer l'écriture, comme une vraie fermeture
  await page.reload();
  await expect(page.getByRole('button', { name: 'Reprendre la séance' })).toBeVisible();
  await page.getByRole('button', { name: 'Reprendre la séance' }).click();
  await expect(page.getByText('Passe la tablette à')).toBeVisible();
  await expect(page.locator('.ui-big-name')).toHaveText('Maelle');

  const captures = new Set<string>(['ordre']);
  await playUntilTomorrow(page, captures);
  await expect(page.getByText(/Prochaine séance : chapitre 1.*jour 2/)).toBeVisible();
  await cap(page, 'a-demain');

  // Une seule séance par jour.
  await page.getByRole('button', { name: "Retour à l'accueil" }).click();
  await page.getByRole('button', { name: 'Séance du jour' }).click();
  await expect(page.getByText('La session du jour est déjà jouée')).toBeVisible();
});

test('jour 5 : vote secret, palabre, Décideuse, Convergence et Concert', async ({ page }) => {
  await page.goto('./');
  await seed(page, (d) => {
    const prof = (hair: string, cape: string, accessory: string) => ({ hair, cape, accessory, companionConfirmed: true });
    d.profiles = { axelle: prof('laches', 'or', 'etoile'), maelle: prof('tresse', 'argent', 'noeud'), rafaelle: prof('queue', 'rose', 'fleur') };
    d.game = { version: 1, position: { chapter: 1, day: 5 }, sessionsPlayed: 4, counters: { L: 0, C: 0, M: 0, O: 0 }, flags: [], choices: [], checkpoints: {}, calendar: { extraGranted: [], extraUsed: [] }, session: null, endingsSeen: [] };
    d.progress = null;
  });
  await page.getByRole('button', { name: 'Séance du jour' }).click();
  for (let i = 0; i < 20 && !(await page.getByRole('button', { name: 'Commencer le vote secret' }).isVisible()); i++) {
    const b = page.getByRole('button', { name: /Suivant →|Continuer/ }).first();
    await b.click();
  }
  await cap(page, 'conseil');
  await page.getByRole('button', { name: 'Commencer le vote secret' }).click();
  // Trois voix différentes, deux fois : palabre puis Décideuse.
  for (let round = 0; round < 2; round++) {
    for (const o of ['A', 'B', 'C']) {
      await page.getByRole('button', { name: /je vote$/ }).click();
      if (round === 0 && o === 'A') await cap(page, 'vote-secret');
      await page.getByRole('button', { name: new RegExp(`^${o} `) }).click();
    }
    if (round === 0) {
      await expect(page.getByRole('heading', { name: 'Palabre !' })).toBeVisible();
      await cap(page, 'palabre');
      await page.getByRole('button', { name: 'Second vote' }).click();
    }
  }
  await expect(page.getByRole('heading', { name: /Décideuse du jour/ })).toBeVisible();
  await cap(page, 'decideuse');
  await page.getByRole('button', { name: /^C Noter la trace/ }).click();
  await expect(page.getByText(/Noter la trace.*tranché par/)).toBeVisible();
  await page.getByRole('button', { name: 'Voir ce qui se passe' }).click();
  await expect(page.getByRole('heading', { name: 'Convergence : Noter la trace' })).toBeVisible();
  await cap(page, 'convergence');
  await page.getByRole('button', { name: 'Suivant →' }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText(/Variante « Noter la trace »/)).toBeVisible();

  const captures = new Set<string>();
  await playUntilTomorrow(page, captures);
  expect(captures.has('concert')).toBe(true);
  await expect(page.getByText(/Prochaine séance : chapitre 2/)).toBeVisible();
  await cap(page, 'fin-chapitre-1');
});
