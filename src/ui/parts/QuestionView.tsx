// Une question : consigne, aides (indice, appel à l'équipe), saisie, correction en deux essais.
import { useEffect, useState } from 'preact/hooks';
import { checkAnswer } from '../../engine/answers';
import type { Question } from '../../content/schema';
import type { FinalVerdict } from '../../engine/session';
import { NAMES } from '../../engine/profile';
import type { PlayerId } from '../../engine/types';
import { Clock } from './Clock';
import { Choices, NumberPad, Order, TextAnswer } from './Inputs';
import { say } from '../voice';

export interface Outcome {
  verdict: FinalVerdict;
  attempts: number;
  helped: boolean;
  response: string;
}

const fmt = (a: Question['answer']) => (Array.isArray(a) ? a.join(' → ') : typeof a === 'number' ? String(a).replace('.', ',') : (a ?? ''));

export function QuestionView(props: {
  q: Question;
  player: PlayerId;
  gardienne: PlayerId;
  voix: PlayerId;
  teamCallAvailable: boolean;
  onTeamCall: () => void;
  onDone: (o: Outcome) => void;
}) {
  const { q, player } = props;
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState(false);
  const [team, setTeam] = useState(false);
  const [num, setNum] = useState('');
  const [state, setState] = useState<'saisie' | 'reessai' | 'revele' | 'bravo' | 'validation'>('saisie');
  const [response, setResponse] = useState('');
  const [wrongChoice, setWrongChoice] = useState<string | undefined>(undefined);
  const helped = hint || team;

  // Le parent remonte ce composant à chaque question (key) : l'état repart de zéro sans effet de bord.
  // Lue pour les trois filles (pas seulement Axelle) : le conteur est désormais obligatoire.
  useEffect(() => {
    say(q.prompt);
  }, []);

  const submit = (r: string | string[]) => {
    const text = Array.isArray(r) ? r.join(' | ') : r;
    const n = attempts + 1;
    setAttempts(n);
    setResponse(text);
    const v = checkAnswer(q, r);
    if (v === 'a-valider') return setState('validation');
    if (v === 'juste') return setState('bravo');
    setNum('');
    if (q.kind === 'qcm' && typeof r === 'string') setWrongChoice(r);
    setState(n >= 2 ? 'revele' : 'reessai');
  };

  const finish = (verdict: FinalVerdict) => props.onDone({ verdict, attempts: Math.max(1, attempts), helped, response });

  return (
    <section class="ui-question" aria-label="Question">
      <div class="ui-question-main">
        <p class="ui-prompt">
          {q.prompt}
          <button class="ui-btn ui-btn-icon" onClick={() => say(q.prompt)} aria-label="Écouter la question">
            🔊
          </button>
        </p>
        {q.read && (
          <blockquote class="ui-parchment">
            {q.read}
            <button class="ui-btn ui-btn-small" onClick={() => say(q.read!)}>
              Écouter
            </button>
          </blockquote>
        )}
        {q.clock && <Clock time={q.clock} />}
        {hint && q.hint && (
          <p class="ui-hint" role="note">
            💡 {NAMES[props.gardienne]}, Gardienne de l'indice, souffle : « {q.hint} »
          </p>
        )}
        {team && <p class="ui-hint" role="note">📣 Appel à l'équipe : réfléchissez à trois, puis {NAMES[player]} répond.</p>}

        {state === 'saisie' || state === 'reessai' ? (
          <>
            {state === 'reessai' && <p class="ui-feedback ui-ko">Pas encore ! Encore un essai.</p>}
            {q.kind === 'nombre' && <NumberPad value={num} onChange={setNum} onSubmit={() => submit(num)} />}
            {q.kind === 'qcm' && <Choices choices={q.choices ?? []} onPick={submit} wrong={wrongChoice} />}
            {q.kind === 'ordre' && <Order key={attempts} choices={q.choices ?? []} onSubmit={submit} />}
            {q.kind === 'court' && <TextAnswer key={attempts} onSubmit={submit} />}
            {q.kind === 'libre' && <TextAnswer onSubmit={submit} multiline optional />}
          </>
        ) : state === 'bravo' ? (
          <div class="ui-feedback-box">
            <p class="ui-feedback ui-ok">Bravo, {NAMES[player]} ! ✨</p>
            <button class="ui-btn ui-btn-main" onClick={() => finish('juste')}>
              Continuer
            </button>
          </div>
        ) : state === 'revele' ? (
          <div class="ui-feedback-box">
            <p class="ui-feedback">La réponse était : <strong>{fmt(q.answer)}</strong>. On la retient pour la prochaine fois.</p>
            <button class="ui-btn ui-btn-main" onClick={() => finish('faux')}>
              Continuer
            </button>
          </div>
        ) : (
          <div class="ui-feedback-box">
            <p class="ui-feedback">{NAMES[props.voix]}, Voix de l'équipe : la réponse de {NAMES[player]} est-elle juste ?</p>
            {q.answer !== undefined && <p class="ui-muted">Piste : {fmt(q.answer)}</p>}
            <div class="ui-row">
              <button class="ui-btn ui-btn-main" onClick={() => finish('valide-soeurs')}>
                Juste
              </button>
              <button class="ui-btn" onClick={() => finish('pas-sur')}>
                Pas sûr
              </button>
            </div>
          </div>
        )}
      </div>
      {(state === 'saisie' || state === 'reessai') && (
        <aside class="ui-helpers" aria-label="Aides">
          {q.hint && (
            <button class="ui-btn" onClick={() => setHint(true)} disabled={hint}>
              💡 Indice ({NAMES[props.gardienne]})
            </button>
          )}
          <button
            class="ui-btn"
            onClick={() => {
              setTeam(true);
              props.onTeamCall();
            }}
            disabled={team || !props.teamCallAvailable}
          >
            📣 Appel à l'équipe
          </button>
        </aside>
      )}
    </section>
  );
}
