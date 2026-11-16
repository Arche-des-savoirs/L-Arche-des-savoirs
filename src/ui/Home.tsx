import { chapterOf } from '../content/chapters';
import { chapterImage } from '../content/images';
import { useRef, useState } from 'preact/hooks';
import { checkPin, route, save, startOrResume } from './store';
import { PinPad } from './parts/PinPad';

const LONG_PRESS_MS = 3000;

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.().catch(() => undefined);
}

export function Home() {
  const { game, profiles } = save.value;
  const ch = chapterOf(game.position.chapter);
  const fresh = !profiles || game.sessionsPlayed === 0 && !game.session;
  const [pinOpen, setPinOpen] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  // Appui long de 3 s sur le titre : accès discret au mode parent.
  const pressStart = () => {
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setPinError(null);
      setPinOpen(true);
    }, LONG_PRESS_MS);
  };
  const pressEnd = () => clearTimeout(timer.current);
  const label = game.session ? 'Reprendre la séance' : fresh ? "Commencer l'aventure" : 'Séance du jour';
  return (
    <main class="ui-home">
      <img class="ui-backdrop" src={chapterImage(game.position.chapter)} alt={`Illustration du chapitre ${game.position.chapter}${ch ? ` : ${ch.title}` : ''}`} />
      <div class="ui-backdrop-shade" aria-hidden="true" />
      <div class="ui-home-panel">
        <h1 class="ui-title" onPointerDown={pressStart} onPointerUp={pressEnd} onPointerLeave={pressEnd} onPointerCancel={pressEnd} onContextMenu={(e) => e.preventDefault()}>
          L'Arche des Savoirs
        </h1>
        <p class="ui-subtitle">
          Chapitre {game.position.chapter}
          {ch ? ` · ${ch.title}` : ''} · Jour {game.position.day}
        </p>
      </div>
      <nav class="ui-actions" aria-label="Menu principal">
        <button class="ui-btn ui-btn-main" onClick={() => startOrResume()}>
          {label}
        </button>
        <button class="ui-btn" onClick={() => (route.value = 'diagnostic')}>
          Diagnostic
        </button>
        <button class="ui-btn" onClick={toggleFullscreen}>
          Plein écran
        </button>
      </nav>
      {pinOpen && (
        <PinPad
          title="Code parent"
          error={pinError}
          onCancel={() => setPinOpen(false)}
          onSubmit={(pin) => {
            if (checkPin(pin)) {
              setPinOpen(false);
              route.value = 'parent';
            } else setPinError('Code incorrect.');
          }}
        />
      )}
    </main>
  );
}
