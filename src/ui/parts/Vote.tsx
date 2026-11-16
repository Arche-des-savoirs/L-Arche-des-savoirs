// Conseil de la Lanterne (jour 5) : vote secret, palabre, second vote, puis la Décideuse du jour.
import { useState } from 'preact/hooks';
import { resolveVote, type Ballot } from '../../engine/vote';
import type { Option, PlayerId } from '../../engine/types';
import { NAMES } from '../../engine/profile';
import { chapter, dispatch, nextStep, save } from '../store';
import { Card, Handover } from './Common';

const OPTIONS: Option[] = ['A', 'B', 'C'];

export function Vote() {
  const ch = chapter.value!;
  const decision = ch.decision!;
  const session = save.value.game.session!;
  const order = session.turnOrder;
  const [round, setRound] = useState<1 | 2>(1);
  const [first, setFirst] = useState<Partial<Ballot<Option>>>({});
  const [second, setSecond] = useState<Partial<Ballot<Option>>>({});
  const [voter, setVoter] = useState(0);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'vote' | 'palabre' | 'decideuse' | 'fait'>(session.decided ? 'fait' : 'intro');

  const ballot = round === 1 ? first : second;
  const setBallot = round === 1 ? setFirst : setSecond;

  const finishRound = (b: Ballot<Option>) => {
    const out = round === 1 ? resolveVote({ first: b, decider: session.decider }) : resolveVote({ first: first as Ballot<Option>, second: b, decider: session.decider });
    if (out.status === 'resolu') {
      dispatch({ type: 'DECIDER', record: { first: (round === 1 ? b : first) as Ballot<Option>, second: round === 2 ? b : undefined, palabre: out.palabre, result: out.result } });
      setPhase('fait');
    } else if (out.status === 'palabre-puis-second-vote') setPhase('palabre');
    else setPhase('decideuse');
  };

  const cast = (o: Option) => {
    const p = order[voter]!;
    const b = { ...ballot, [p]: o };
    setBallot(b);
    setReady(false);
    if (voter + 1 < order.length) setVoter(voter + 1);
    else finishRound(b as Ballot<Option>);
  };

  if (phase === 'intro')
    return (
      <Card title="Le Conseil de la Lanterne" wide>
        <p class="ui-line">{decision.prompt}</p>
        <ul class="ui-options">
          {OPTIONS.map((o) => (
            <li key={o}>
              <strong>{o}</strong> — {decision.options[o].label}
            </li>
          ))}
        </ul>
        <p class="ui-muted">Chacune vote en secret. Si une voix diffère, on palabre puis on revote. {NAMES[session.decider]} est la Décideuse du jour.</p>
        <button class="ui-btn ui-btn-main" onClick={() => setPhase('vote')}>
          Commencer le vote secret
        </button>
      </Card>
    );

  if (phase === 'vote') {
    const p = order[voter]!;
    if (!ready) return <Handover player={p} note="Les deux autres ferment les yeux ! 🙈" cta={`Je suis ${NAMES[p]}, je vote`} onReady={() => setReady(true)} />;
    return (
      <Card title={`${round === 2 ? 'Second vote' : 'Vote secret'} — ${NAMES[p]}`} wide>
        <p class="ui-line">{decision.prompt}</p>
        <div class="ui-vote-options">
          {OPTIONS.map((o) => (
            <button key={o} class="ui-btn ui-vote-option" onClick={() => cast(o)}>
              <span class="ui-vote-letter">{o}</span> {decision.options[o].label}
            </button>
          ))}
        </div>
      </Card>
    );
  }

  if (phase === 'palabre') {
    const counts = OPTIONS.map((o) => [o, Object.values(first).filter((v) => v === o).length] as const).filter(([, n]) => n > 0);
    return (
      <Card title="Palabre !" wide>
        <p class="ui-line">Les voix ne sont pas d'accord : {counts.map(([o, n]) => `${n} pour « ${decision.options[o].label} »`).join(', ')}.</p>
        <p>Chacune explique son choix à voix haute, sans se couper. Puis on revote en secret.</p>
        <button
          class="ui-btn ui-btn-main"
          onClick={() => {
            setRound(2);
            setVoter(0);
            setReady(false);
            setPhase('vote');
          }}
        >
          Second vote
        </button>
      </Card>
    );
  }

  if (phase === 'decideuse') {
    const out = resolveVote({ first: first as Ballot<Option>, second: second as Ballot<Option>, decider: session.decider });
    const options = out.status === 'decideuse' ? out.options : OPTIONS;
    const decide = (o: Option) => {
      dispatch({ type: 'DECIDER', record: { first: first as Ballot<Option>, second: second as Ballot<Option>, palabre: true, decidedBy: session.decider, result: o } });
      setPhase('fait');
    };
    return (
      <Card title={`${NAMES[session.decider]}, Décideuse du jour`} wide>
        <p class="ui-line">Toujours pas d'accord : c'est à {NAMES[session.decider]} de trancher parmi les choix du second vote.</p>
        <div class="ui-vote-options">
          {options.map((o) => (
            <button key={o} class="ui-btn ui-vote-option" onClick={() => decide(o)}>
              <span class="ui-vote-letter">{o}</span> {decision.options[o].label}
            </button>
          ))}
        </div>
      </Card>
    );
  }

  const rec = save.value.game.choices.findLast((c) => c.chapter === ch.number);
  return (
    <Card title="Le Conseil a parlé">
      <p class="ui-line">
        Choix : <strong>{rec ? decision.options[rec.result].label : '—'}</strong>
        {rec?.decidedBy && ` (tranché par ${NAMES[rec.decidedBy as PlayerId]})`}
      </p>
      <button class="ui-btn ui-btn-main" onClick={nextStep}>
        Voir ce qui se passe
      </button>
    </Card>
  );
}
