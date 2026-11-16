// Empêche la mise en veille de l'écran pendant le jeu (Wake Lock API).
// Le verrou est perdu quand la page est masquée : on le reprend au retour.

export type WakeLockState = 'unsupported' | 'released' | 'active' | 'error';

interface SentinelLike {
  release(): Promise<void>;
  addEventListener(type: 'release', cb: () => void): void;
}
interface NavLike {
  wakeLock?: { request(type: 'screen'): Promise<SentinelLike> };
}
interface DocLike {
  visibilityState: string;
  addEventListener(type: 'visibilitychange', cb: () => void): void;
  removeEventListener(type: 'visibilitychange', cb: () => void): void;
}

export function createWakeLock(nav: NavLike = navigator as NavLike, doc: DocLike = document) {
  let sentinel: SentinelLike | null = null;
  let wanted = false;
  let state: WakeLockState = nav.wakeLock ? 'released' : 'unsupported';
  const listeners = new Set<(s: WakeLockState) => void>();
  const emit = (s: WakeLockState) => {
    state = s;
    listeners.forEach((l) => l(s));
  };

  async function acquire(): Promise<void> {
    wanted = true;
    if (!nav.wakeLock) return emit('unsupported');
    if (sentinel) return;
    try {
      const s = await nav.wakeLock.request('screen');
      sentinel = s;
      s.addEventListener('release', () => {
        if (sentinel === s) sentinel = null;
        if (state === 'active') emit('released');
      });
      emit('active');
    } catch {
      emit('error');
    }
  }

  async function release(): Promise<void> {
    wanted = false;
    const s = sentinel;
    sentinel = null;
    if (s) await s.release();
    if (state !== 'unsupported') emit('released');
  }

  const onVisibility = () => {
    if (wanted && doc.visibilityState === 'visible' && !sentinel) void acquire();
  };
  doc.addEventListener('visibilitychange', onVisibility);

  return {
    acquire,
    release,
    get state() {
      return state;
    },
    subscribe(listener: (s: WakeLockState) => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      doc.removeEventListener('visibilitychange', onVisibility);
    }
  };
}
