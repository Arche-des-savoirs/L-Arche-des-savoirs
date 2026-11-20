// Page de rupture pure : fond noir, texte en police manuscrite (Parisienne) qui s'écrit lettre
// après lettre, comme à la main. Utilisée pour la dédicace (tout début de l'aventure) et le mot
// de la fin (après la dernière fin). Aucune voix : ce sont des mots de Hasina, pas une réplique du conte.
import { useEffect, useState } from 'preact/hooks';

const VITESSE_MS = 45; // par caractère

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
    const id = setInterval(() => {
      i++;
      setShown(i);
      if (i >= text.length) clearInterval(id);
    }, VITESSE_MS);
    return () => clearInterval(id);
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
