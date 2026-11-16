// Concert de la Porte : chaque fille complète sa mesure, puis les trois mesures sont jouées ensemble.
import { useState } from 'preact/hooks';
import { playRhythm } from '../../platform/audio';
import { NAMES } from '../../engine/profile';
import { chapter, day, nextStep, recordResult, save } from '../store';
import { Card, Handover } from './Common';
import { Note, NOTE_NAMES } from './Notes';

const VALUES = [4, 2, 1, 0.5];

export function Concert() {
  const ch = chapter.value!;
  const concert = day.value!.concert!;
  const order = save.value.game.session!.turnOrder;
  const [k, setK] = useState(0);
  const [ready, setReady] = useState(false);
  const [tries, setTries] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [state, setState] = useState<'choix' | 'reessai' | 'juste' | 'revele'>('choix');

  if (k >= order.length)
    return (
      <Card title="Le Concert de la Porte">
        <p class="ui-line">Les trois mesures sont prêtes. Jouez-les ensemble : la Porte écoute !</p>
        <div class="ui-row">
          <button class="ui-btn" onClick={() => playRhythm(order.flatMap((p) => [...concert.measures[p]!.given, concert.measures[p]!.missing]))}>
            🎵 Jouer le Concert
          </button>
          <button class="ui-btn ui-btn-main" onClick={nextStep}>
            Continuer
          </button>
        </div>
      </Card>
    );

  const p = order[k]!;
  const m = concert.measures[p]!;
  if (!ready) return <Handover player={p} note="À toi de compléter ta mesure." onReady={() => setReady(true)} />;

  const pick = (v: number) => {
    setPicked(v);
    const n = tries + 1;
    setTries(n);
    if (v === m.missing) setState('juste');
    else setState(n >= 2 ? 'revele' : 'reessai');
  };
  const next = () => {
    recordResult({ questionId: `${ch.id}-concert-${p}`, player: p, subject: 'musique', level: 2, verdict: state === 'juste' ? 'juste' : 'faux', attempts: tries, helped: false, response: NOTE_NAMES[picked ?? 0] ?? '', at: Date.now() });
    setK(k + 1), setReady(false), setTries(0), setPicked(null), setState('choix');
  };
  const shown = state === 'juste' || state === 'revele' ? m.missing : null;

  return (
    <Card title={`La mesure de ${NAMES[p]}`} wide>
      <p class="ui-line">Il manque une note pour faire 4 temps : « {m.prompt} ».</p>
      <div class="ui-measure" aria-label="Mesure">
        {m.given.map((v, i) => (
          <Note key={i} value={v} />
        ))}
        <span class={`ui-slot${shown !== null ? ' ui-slot-full' : ''}`}>{shown !== null ? <Note value={shown} /> : '?'}</span>
      </div>
      {state === 'choix' || state === 'reessai' ? (
        <>
          {state === 'reessai' && <p class="ui-feedback ui-ko">Ça ne fait pas 4 temps. Encore un essai !</p>}
          <div class="ui-choices">
            {VALUES.map((v) => (
              <button key={v} class="ui-btn ui-note-btn" onClick={() => pick(v)} aria-label={NOTE_NAMES[v]}>
                <Note value={v} size={52} />
                <span>{NOTE_NAMES[v]}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div class="ui-row">
          <p class={`ui-feedback ${state === 'juste' ? 'ui-ok' : ''}`}>{state === 'juste' ? 'Parfait, la mesure sonne juste !' : `Il fallait une ${NOTE_NAMES[m.missing]?.toLowerCase()}.`}</p>
          <button class="ui-btn" onClick={() => playRhythm([...m.given, m.missing])}>
            🎵 Écouter
          </button>
          <button class="ui-btn ui-btn-main" onClick={next}>
            Continuer
          </button>
        </div>
      )}
    </Card>
  );
}
