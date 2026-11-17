// Tour d'une fille dans une manche : passage de main, questions, échelle de placement au jour 1.
import { useMemo, useState } from 'preact/hooks';
import { resolveTour } from '../../content/picker';
import { placementDone } from '../../engine/difficulty';
import { supportRoles } from '../../engine/session';
import { NAMES, ROLES } from '../../engine/profile';
import type { PlayerId } from '../../engine/types';
import { applyPlacement, chapter, day, levelOf, nextStep, recordResult, save, testMode, useTeamCall } from '../store';
import { Card, Handover, PlayerAvatar } from './Common';
import { QuestionView, type Outcome } from './QuestionView';

const REACTIONS = ['Le Gardien pouffe dans sa barbe de sable.', 'Le Gardien éternue de rire : du sable partout !', 'Le Gardien essaie de rester sérieux… raté.', 'Même la Porte a gloussé.'];

export function Tour({ mancheIndex, player }: { mancheIndex: number; player: PlayerId }) {
  const ch = chapter.value!;
  const d = day.value!;
  const manche = d.manches[mancheIndex]!;
  const game = save.value.game;
  const order = game.session!.turnOrder;
  const roles = supportRoles(order, player);
  const questions = useMemo(() => resolveTour(ch, d.n, manche.id, player, levelOf(player, 'maths'), `s${game.sessionsPlayed}`), [manche.id, player]);
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [ladder, setLadder] = useState<Array<{ level: number; correct: boolean; helped: boolean }>>([]);
  const [placed, setPlaced] = useState<number | null>(null);
  const [absurd, setAbsurd] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const teamCallAvailable = !(save.value.progress?.teamCalls ?? []).includes(mancheIndex);

  if (!started)
    return (
      <Handover
        player={player}
        note={`Gardienne de l'indice : ${NAMES[roles.gardienne]} · Voix de l'équipe : ${NAMES[roles.voix]}`}
        onReady={() => setStarted(true)}
      />
    );

  if (placed !== null)
    return (
      <Card title="Échelle des savoirs">
        <p class="ui-line">
          {NAMES[player]} commence à la marche <strong>{placed}</strong> sur 5. Les questions suivront ton rythme !
        </p>
        <button class="ui-btn ui-btn-main" onClick={nextStep}>
          Continuer
        </button>
      </Card>
    );

  const q = questions[i]!;
  const done = (o: Outcome) => {
    recordResult({ questionId: q.id, player, subject: q.subject, level: q.level, ...o, at: Date.now(), prompt: q.prompt, expected: q.answer === undefined ? undefined : Array.isArray(q.answer) ? q.answer.join(' → ') : String(q.answer) }, !manche.placement);
    if (manche.placement) {
      const next = [...ladder, { level: q.level, correct: o.verdict === 'juste' || o.verdict === 'valide-soeurs', helped: o.helped || o.attempts > 1 }];
      setLadder(next);
      if (placementDone(next, questions.length)) return setPlaced(applyPlacement(player, q.subject, next));
    }
    if (i + 1 < questions.length) setI(i + 1);
    else nextStep();
  };

  return (
    <div class="ui-tour">
      <header class="ui-tour-head">
        <PlayerAvatar player={player} size={72} />
        <div>
          <strong>{NAMES[player]}</strong> <span class="ui-muted">{ROLES[player]}</span>
          <div class="ui-muted">
            {manche.title} · {manche.placement ? `Marche ${q.level} sur 5` : `Question ${i + 1} sur ${questions.length}`}
          </div>
        </div>
        {player === 'maelle' && ch.repliquesAbsurdes.length > 0 && (
          <div class="ui-absurd">
            <button class="ui-btn ui-btn-small" onClick={() => setMenu(!menu)}>
              🤪 Réplique au Gardien
            </button>
            {menu && (
              <ul class="ui-menu" role="menu">
                {ch.repliquesAbsurdes.map((r, k) => (
                  <li key={r}>
                    <button
                      class="ui-btn ui-btn-small"
                      role="menuitem"
                      onClick={() => {
                        setAbsurd(`« ${r} » — ${REACTIONS[k % REACTIONS.length]}`);
                        setMenu(false);
                      }}
                    >
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </header>
      {testMode() && (
        <div class="ui-test-bar" role="toolbar" aria-label="Mode test">
          <span>Mode test</span>
          <button class="ui-btn ui-btn-small" onClick={() => setI(i - 1)} disabled={i === 0}>
            ⏮ Question précédente
          </button>
          <button class="ui-btn ui-btn-small" onClick={() => (i + 1 < questions.length ? setI(i + 1) : nextStep())}>
            ⏭ Question suivante
          </button>
        </div>
      )}
      {absurd && <p class="ui-hint">{absurd}</p>}
      <QuestionView key={`${i}-${q.id}`} q={q} player={player} gardienne={roles.gardienne} voix={roles.voix} teamCallAvailable={teamCallAvailable} onTeamCall={() => useTeamCall(mancheIndex)} onDone={done} />
    </div>
  );
}
