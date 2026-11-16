import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { createWakeLock, type WakeLockState } from '../platform/wakeLock';
import { Home } from './Home';
import { Diagnostic } from './Diagnostic';
import { init, route } from './store';
import { Session } from './screens/Session';
import { Avatars } from './screens/Avatars';
import { ADemain, Bientot } from './screens/ADemain';
import { Parent } from './screens/Parent';

export const wakeLockState = signal<WakeLockState>('released');

const wakeLock = createWakeLock();
wakeLock.subscribe((s) => (wakeLockState.value = s));

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
    case 'a-demain':
      return <ADemain />;
    case 'parent':
      return <Parent />;
    case 'bientot':
      return <Bientot />;
    default:
      return <Home />;
  }
}
