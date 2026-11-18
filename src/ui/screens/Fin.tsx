// Jour 6 du chapitre 30 : vote final entre les portes ouvertes, puis récit de la fin obtenue,
// et pour la Fin 5 (rare), le choix du carrefour où revenir (voir src/engine/game.ts).
import { useState } from 'preact/hooks';
import { openDoors } from '../../engine/counters';
import type { Ending } from '../../engine/types';
import { finOf } from '../../content/fins';
import type { Fin as FinEntry } from '../../content/schema';
import { chapterOf } from '../../content/chapters';
import { epilogueImage } from '../../content/images';
import { dispatch, finishFinalSession, route, save } from '../store';
import { Card, Dialogue, roman } from '../parts/Common';
import { VoteFinal } from '../parts/VoteFinal';

type Phase = 'vote' | 'recit' | 'carrefour' | 'termine';

function initialPhase(): Phase {
  const g = save.value.game;
  if (!g.final) return 'vote';
  if (!g.session) return g.final.result === 'F5' ? 'carrefour' : 'termine';
  return 'recit';
}

/** Récit d'une fin : ouverture puis clôture (épilogue), à la suite l'une de l'autre. */
function Recit({ fin, onDone }: { fin: FinEntry; onDone: () => void }) {
  const [part, setPart] = useState<'opening' | 'closing'>('opening');
  return (
    <main class="ui-session">
      <img class="ui-backdrop ui-backdrop-dim" src={epilogueImage()} alt="" aria-hidden="true" />
      <div class="ui-session-body">
        <Card wide title={fin.title}>
          <Dialogue key={part} lines={part === 'opening' ? fin.opening : fin.closing} onDone={() => (part === 'opening' ? setPart('closing') : onDone())} />
        </Card>
      </div>
    </main>
  );
}

export function Fin() {
  const [phase, setPhase] = useState<Phase>(initialPhase);

  if (phase === 'vote') {
    const doors = openDoors(save.value.game.counters);
    return <VoteFinal doors={doors} onDone={() => setPhase('recit')} />;
  }

  if (phase === 'recit') {
    const result = save.value.game.final!.result;
    const fin = finOf(result)!;
    return (
      <Recit
        fin={fin}
        onDone={() => {
          finishFinalSession();
          if (save.value.game.final!.result === 'F5') setPhase('carrefour');
          else route.value = 'accueil';
        }}
      />
    );
  }

  if (phase === 'carrefour') {
    const checkpoints = Object.keys(save.value.game.checkpoints)
      .map(Number)
      .sort((a, b) => a - b);
    return (
      <main class="ui-page">
        <Card title="Retourner à un carrefour" wide>
          <p class="ui-line">Le Veilleur désigne la clé, qui scintille à nouveau. Choisissez le chapitre où revenir, pour y décider autrement.</p>
          <div class="ui-vote-options">
            {checkpoints.map((c) => (
              <button
                key={c}
                class="ui-btn ui-vote-option"
                onClick={() => {
                  dispatch({ type: 'REVENIR_AU_CARREFOUR', chapter: c });
                  route.value = 'accueil';
                }}
              >
                Chapitre {roman(c)} — {chapterOf(c)?.title}
              </button>
            ))}
          </div>
        </Card>
      </main>
    );
  }

  // phase === 'termine' : relecture de la fin déjà atteinte, le jeu est terminé.
  const ending: Ending = save.value.game.final!.result;
  return <Recit fin={finOf(ending)!} onDone={() => (route.value = 'accueil')} />;
}
