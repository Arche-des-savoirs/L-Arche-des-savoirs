// Génère les icônes PNG de la PWA à partir de public/icons/icon.svg (via Chromium de Playwright).
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const svg = await readFile(new URL('../public/icons/icon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
const render = async (size, file, pad = 0) => {
  await page.setViewportSize({ width: size, height: size });
  const inner = size - 2 * pad;
  await page.setContent(`<html><body style="margin:0;background:#1a2145;display:grid;place-items:center;width:${size}px;height:${size}px">
    <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`);
  await page.screenshot({ path: new URL(`../public/icons/${file}`, import.meta.url).pathname, omitBackground: false });
};
await render(192, 'icon-192.png');
await render(512, 'icon-512.png');
await render(512, 'icon-512-maskable.png', 56);
await browser.close();
console.log('Icônes générées.');
