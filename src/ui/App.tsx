import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { createWakeLock, type WakeLockState } from '../platform/wakeLock';
import { Home } from './Home';
import { Diagnostic } from './Diagnostic';

export type Screen = 'accueil' | 'diagnostic';
export const screen = signal<Screen>('accueil');
export const wakeLockState = signal<WakeLockState>('released');

const wakeLock = createWakeLock();
wakeLock.subscribe((s) => (wakeLockState.value = s));

export function App() {
  useEffect(() => {
    wakeLockState.value = wakeLock.state;
    void wakeLock.acquire();
  }, []);
  return screen.value === 'diagnostic' ? <Diagnostic onBack={() => (screen.value = 'accueil')} /> : <Home onDiagnostic={() => (screen.value = 'diagnostic')} />;
}
