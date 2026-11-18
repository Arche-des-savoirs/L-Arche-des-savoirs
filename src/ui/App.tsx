import { signal } from '@preact/signals';
import { useEffect, useState } from 'preact/hooks';
import type { ComponentType } from 'preact';
import { createWakeLock, type WakeLockState } from '../platform/wakeLock';
import { Home } from './Home';
import { Diagnostic } from './Diagnostic';
import { init, route } from './store';
import { Session } from './screens/Session';
import { Avatars } from './screens/Avatars';
import { ADemain, Bientot } from './screens/ADemain';
import { Fin } from './screens/Fin';

export const wakeLockState = signal<WakeLockState>('released');

const wakeLock = createWakeLock();
wakeLock.subscribe((s) => (wakeLockState.value = s));

/** Mode parent chargé à la demande (appui long + code) : jamais nécessaire en jeu, pas de poids sur le chargement initial. */
function ParentLazy() {
  const [Comp, setComp] = useState<ComponentType | null>(null);
  useEffect(() => {
    void import('./screens/Parent').then((m) => setComp(() => m.Parent));
  }, []);
  return Comp ? <Comp /> : <main class="ui-page" aria-busy="true" />;
}

export function App() {
  useEffect(() => {
    wakeLockState.value = wakeLock.state;
    void wakeLock.acquire();
    void init();
  }, []);
  switch (route.value) {
    case 'chargement':
      return <main class="ui-page" aria-busy="true" />;
    case 'diagnostic':
      return <Diagnostic onBack={() => (route.value = 'accueil')} />;
    case 'avatars':
      return <Avatars />;
    case 'seance':
      return <Session />;
    case 'fin':
      return <Fin />;
    case 'a-demain':
      return <ADemain />;
    case 'parent':
      return <ParentLazy />;
    case 'bientot':
      return <Bientot />;
    default:
      return <Home />;
  }
}
