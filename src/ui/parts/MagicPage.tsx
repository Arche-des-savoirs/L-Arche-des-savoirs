// Page de rupture pure : fond noir, texte en police manuscrite (Parisienne) qui s'écrit lettre
// après lettre, comme à la main. Utilisée pour la dédicace (tout début de l'aventure) et le mot
// de la fin (après la dernière fin). Aucune voix : ce sont des mots de Hasina, pas une réplique du conte.
import { useEffect, useState } from 'preact/hooks';

const VITESSE_BASE_MS = 100; // délai moyen par lettre
const JITTER = 0.5; // ± variation aléatoire (une main ne va jamais à vitesse constante)
const PAUSE_VIRGULE_MS = 220;
const PAUSE_POINT_MS = 480;

/** Délai avant la lettre à l'index i, en tenant compte de celle qui la précède :
 * une vraie écriture ralentit après la ponctuation et varie légèrement lettre à lettre. */
function delaiPourLettre(text: string, i: number) {
  const precedente = text[i - 1];
  let base = VITESSE_BASE_MS;
  if (precedente === '.' || precedente === '!' || precedente === '?' || precedente === '…') base += PAUSE_POINT_MS;
  else if (precedente === ',' || precedente === ';' || precedente === ':') base += PAUSE_VIRGULE_MS;
  const variation = 1 + (Math.random() * 2 - 1) * JITTER;
  return Math.max(20, Math.round(base * variation));
}

function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function MagicPage({ text, onDone, cta = 'Continuer' }: { text: string; onDone: () => void; cta?: string }) {
  const reduced = prefersReducedMotion();
  const [shown, setShown] = useState(reduced ? text.length : 0);

  useEffect(() => {
    if (reduced) return;
    setShown(0);
    let i = 0;
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      i++;
      setShown(i);
      if (i < text.length) id = setTimeout(tick, delaiPourLettre(text, i));
    };
    id = setTimeout(tick, delaiPourLettre(text, 0));
    return () => clearTimeout(id);
  }, [text, reduced]);

  const done = shown >= text.length;

  return (
    <main class="ui-magic-page">
      <p class="ui-magic-text" aria-label={text}>
        <span aria-hidden="true">
          {text.slice(0, shown)}
          {!done && <span class="ui-magic-caret" />}
        </span>
      </p>
      <button
        class={`ui-btn ui-btn-main ui-magic-cta${done ? ' ui-magic-cta-visible' : ''}`}
        onClick={onDone}
        disabled={!done}
      >
        {cta}
      </button>
    </main>
  );
}
