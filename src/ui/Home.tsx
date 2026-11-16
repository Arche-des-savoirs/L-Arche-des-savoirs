import { chapterOf } from '../content/chapters';
import { chapterImage } from '../content/images';
import { route, save, startOrResume } from './store';

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.().catch(() => undefined);
}

export function Home() {
  const { game, profiles } = save.value;
  const ch = chapterOf(game.position.chapter);
  const fresh = !profiles || game.sessionsPlayed === 0 && !game.session;
  const label = game.session ? 'Reprendre la séance' : fresh ? "Commencer l'aventure" : 'Séance du jour';
  return (
    <main class="ui-home">
      <img class="ui-backdrop" src={chapterImage(game.position.chapter)} alt={`Illustration du chapitre ${game.position.chapter}${ch ? ` : ${ch.title}` : ''}`} />
      <div class="ui-backdrop-shade" aria-hidden="true" />
      <div class="ui-home-panel">
        <h1 class="ui-title">L'Arche des Savoirs</h1>
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
    </main>
  );
}
