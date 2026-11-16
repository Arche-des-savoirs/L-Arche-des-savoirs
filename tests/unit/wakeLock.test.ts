import { describe, expect, it, vi } from 'vitest';
import { createWakeLock } from '../../src/platform/wakeLock';

function fakeEnv(supported = true, fail = false) {
  const releaseCbs: Array<() => void> = [];
  const visCbs: Array<() => void> = [];
  const sentinel = {
    release: vi.fn(async () => releaseCbs.forEach((cb) => cb())),
    addEventListener: (_: 'release', cb: () => void) => releaseCbs.push(cb)
  };
  const request = vi.fn(async () => {
    if (fail) throw new Error('NotAllowedError');
    return sentinel;
  });
  const nav = supported ? { wakeLock: { request } } : {};
  const doc = {
    visibilityState: 'visible',
    addEventListener: (_: 'visibilitychange', cb: () => void) => visCbs.push(cb),
    removeEventListener: vi.fn()
  };
  return { nav, doc, request, sentinel, releaseCbs, visCbs };
}

describe('createWakeLock', () => {
  it('signale un navigateur sans Wake Lock', async () => {
    const env = fakeEnv(false);
    const wl = createWakeLock(env.nav, env.doc);
    expect(wl.state).toBe('unsupported');
    await wl.acquire();
    expect(wl.state).toBe('unsupported');
  });

  it("active le verrou et ne le demande qu'une fois", async () => {
    const env = fakeEnv();
    const wl = createWakeLock(env.nav, env.doc);
    await wl.acquire();
    await wl.acquire();
    expect(wl.state).toBe('active');
    expect(env.request).toHaveBeenCalledTimes(1);
  });

  it('reprend le verrou quand la page redevient visible', async () => {
    const env = fakeEnv();
    const wl = createWakeLock(env.nav, env.doc);
    await wl.acquire();
    env.releaseCbs.forEach((cb) => cb()); // le navigateur libère (onglet masqué)
    expect(wl.state).toBe('released');
    env.visCbs.forEach((cb) => cb());
    await vi.waitFor(() => expect(wl.state).toBe('active'));
    expect(env.request).toHaveBeenCalledTimes(2);
  });

  it('ne reprend pas le verrou après une libération volontaire', async () => {
    const env = fakeEnv();
    const wl = createWakeLock(env.nav, env.doc);
    await wl.acquire();
    await wl.release();
    env.visCbs.forEach((cb) => cb());
    expect(wl.state).toBe('released');
    expect(env.request).toHaveBeenCalledTimes(1);
  });

  it('signale un refus du navigateur', async () => {
    const env = fakeEnv(true, true);
    const wl = createWakeLock(env.nav, env.doc);
    await wl.acquire();
    expect(wl.state).toBe('error');
  });
});
