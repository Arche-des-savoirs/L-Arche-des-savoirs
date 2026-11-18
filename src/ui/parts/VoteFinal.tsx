// Vote final (jour 6 du chapitre 30) : les portes ouvertes par openDoors(), même mécanique
// que le Conseil de la Lanterne (vote secret, palabre si désaccord, second vote, Décideuse).
import { useState } from 'preact/hooks';
import { resolveVote, type Ballot } from '../../engine/vote';
import type { Ending } from '../../engine/types';
import { NAMES } from '../../engine/profile';
import { finOf } from '../../content/fins';
import { dispatch, save } from '../store';
import { Card, Handover } from './Common';

export function VoteFinal({ doors, onDone }: { doors: Ending[]; onDone: () => void }) {
  const session = save.value.game.session!;
  const order = session.turnOrder;
  const [round, setRound] = useState<1 | 2>(1);
  const [first, setFirst] = useState<Partial<Ballot<Ending>>>({});
  const [second, setSecond] = useState<Partial<Ballot<Ending>>>({});
  const [voter, setVoter] = useState(0);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'vote' | 'palabre' | 'decideuse' | 'fait'>('intro');

  const ballot = round === 1 ? first : second;
  const setBallot = round === 1 ? setFirst : setSecond;

  const finishRound = (b: Ballot<Ending>) => {
    const out = round === 1 ? resolveVote({ first: b, decider: session.decider }) : resolveVote({ first: first as Ballot<Ending>, second: b, decider: session.decider });
    if (out.status === 'resolu') {
      dispatch({ type: 'CHOISIR_FIN', record: { first: (round === 1 ? b : first) as Ballot<Ending>, second: round === 2 ? b : undefined, result: out.result } });
      setPhase('fait');
    } else if (out.status === 'palabre-puis-second-vote') setPhase('palabre');
    else setPhase('decideuse');
  };

  const cast = (o: Ending) => {
    const p = order[voter]!;
    const b = { ...ballot, [p]: o };
    setBallot(b);
    setReady(false);
    if (voter + 1 < order.length) setVoter(voter + 1);
    else finishRound(b as Ballot<Ending>);
  };

  if (phase === 'intro')
    return (
      <Card title="Le vote final" wide>
        <p class="ui-line">Le Veilleur s'écarte en silence, et devant les trois sœurs, la lumière d'Orvane vacille, en attente. Une ou plusieurs portes sont ouvertes :</p>
        <ul class="ui-options">
          {doors.map((d) => (
            <li key={d}>
              <strong>{d}</strong> — {finOf(d)?.title ?? d}
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
        <p class="ui-line">Quelle porte choisir, parmi celles qui sont ouvertes ?</p>
        <div class="ui-vote-options">
          {doors.map((d) => (
            <button key={d} class="ui-btn ui-vote-option" onClick={() => cast(d)}>
              <span class="ui-vote-letter">{d}</span> {finOf(d)?.title ?? d}
            </button>
          ))}
        </div>
      </Card>
    );
  }

  if (phase === 'palabre') {
    const counts = doors.map((d) => [d, Object.values(first).filter((v) => v === d).length] as const).filter(([, n]) => n > 0);
    return (
      <Card title="Palabre !" wide>
        <p class="ui-line">Les voix ne sont pas d'accord : {counts.map(([d, n]) => `${n} pour « ${finOf(d)?.title ?? d} »`).join(', ')}.</p>
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
    const out = resolveVote({ first: first as Ballot<Ending>, second: second as Ballot<Ending>, decider: session.decider });
    const options = out.status === 'decideuse' ? out.options : doors;
    const decide = (o: Ending) => {
      dispatch({ type: 'CHOISIR_FIN', record: { first: first as Ballot<Ending>, second: second as Ballot<Ending>, decidedBy: session.decider, result: o } });
      setPhase('fait');
    };
    return (
      <Card title={`${NAMES[session.decider]}, Décideuse du jour`} wide>
        <p class="ui-line">Toujours pas d'accord : c'est à {NAMES[session.decider]} de trancher parmi les choix du second vote.</p>
        <div class="ui-vote-options">
          {options.map((o) => (
            <button key={o} class="ui-btn ui-vote-option" onClick={() => decide(o)}>
              <span class="ui-vote-letter">{o}</span> {finOf(o)?.title ?? o}
            </button>
          ))}
        </div>
      </Card>
    );
  }

  const rec = save.value.game.final;
  return (
    <Card title="Le Conseil a parlé">
      <p class="ui-line">
        Porte choisie : <strong>{rec ? finOf(rec.result)?.title ?? rec.result : '—'}</strong>
        {rec?.decidedBy && ` (tranché par ${NAMES[rec.decidedBy]})`}
      </p>
      <button class="ui-btn ui-btn-main" onClick={onDone}>
        Voir ce qui se passe
      </button>
    </Card>
  );
}
