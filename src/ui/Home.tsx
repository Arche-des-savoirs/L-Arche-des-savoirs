import scene from '../assets/scenes/porte-trois-lueurs.svg?raw';

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.().catch(() => undefined);
}

export function Home({ onDiagnostic }: { onDiagnostic: () => void }) {
  return (
    <main class="ui-home">
      <div class="ui-scene" dangerouslySetInnerHTML={{ __html: scene }} />
      <div class="ui-home-panel">
        <h1 class="ui-title">L'Arche des Savoirs</h1>
        <p class="ui-subtitle">La Porte des Trois Lueurs s'ouvrira bientôt.</p>
      </div>
      <nav class="ui-actions" aria-label="Menu principal">
          <button class="ui-btn ui-btn-main" disabled title="Disponible avec le chapitre 1">
            Commencer l'aventure
          </button>
          <button class="ui-btn" onClick={onDiagnostic}>
            Diagnostic
          </button>
          <button class="ui-btn" onClick={toggleFullscreen}>
            Plein écran
          </button>
      </nav>
    </main>
  );
}
