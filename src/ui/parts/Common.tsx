// Éléments partagés : passage de main, en-tête de séance, dialogue.
import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { Line } from '../../content/schema';
import { COMPANIONS, LUEURS, NAMES, ROLES } from '../../engine/profile';
import type { PlayerId } from '../../engine/types';
import { save } from '../store';
import { Avatar } from './Avatar';
import { say, stopSpeaking } from '../voice';

const SPEAKERS: Record<string, string> = {
  narrateur: 'Le narrateur',
  thessaly: 'Thessaly',
  plume: 'Plume',
  gardien: 'Le Gardien',
  nilo: 'Nilo',
  mouf: 'Mouf',
  epouvantail: "L'Épouvantail-Qui-Oublie",
  veilleur: 'Le Veilleur',
  habitant: 'Un habitant'
};
const speaker = (who: string) => SPEAKERS[who] ?? NAMES[who as PlayerId] ?? who;

export function Card({ title, children, wide }: { title?: string; children: ComponentChildren; wide?: boolean }) {
  return (
    <div class={`ui-card${wide ? ' ui-card-wide' : ''}`}>
      {title && <h2 class="ui-card-title">{title}</h2>}
      {children}
    </div>
  );
}

export function PlayerAvatar({ player, size }: { player: PlayerId; size?: number }) {
  const p = save.value.profiles?.[player];
  return p ? <Avatar player={player} profile={p} size={size} label={NAMES[player]} /> : null;
}

/** Écran de passage : la tablette change de mains. */
export function Handover({ player, note, onReady, cta }: { player: PlayerId; note?: string; onReady: () => void; cta?: string }) {
  return (
    <Card>
      <div class="ui-handover" style={{ '--lueur': LUEURS[player] }}>
        <PlayerAvatar player={player} size={170} />
        <div>
          <p class="ui-kicker">Passe la tablette à</p>
          <p class="ui-big-name">{NAMES[player]}</p>
          <p class="ui-muted">
            {ROLES[player]} · {COMPANIONS[player].emoji} {COMPANIONS[player].name}
          </p>
          {note && <p>{note}</p>}
          <button class="ui-btn ui-btn-main" onClick={onReady}>
            {cta ?? `Je suis ${NAMES[player]}, c'est parti !`}
          </button>
        </div>
      </div>
    </Card>
  );
}

/** Dialogue ligne par ligne. Les répliques adressées à Axelle sont lues automatiquement. */
export function Dialogue({ lines, onDone, doneLabel = 'Continuer' }: { lines: Line[]; onDone: () => void; doneLabel?: string }) {
  const [i, setI] = useState(0);
  const line = lines[i]!;
  useEffect(() => {
    if (line.to === 'axelle') say(line.text);
    return stopSpeaking;
  }, [i]);
  const last = i >= lines.length - 1;
  return (
    <div class="ui-dialogue">
      <p class="ui-speaker">
        {speaker(line.who)}
        {line.to && <span class="ui-muted"> à {NAMES[line.to]}</span>}
      </p>
      <p class="ui-line">{line.text}</p>
      <div class="ui-row">
        <button class="ui-btn" onClick={() => say(line.text)}>
          🔊 Écouter
        </button>
        {i > 0 && (
          <button class="ui-btn" onClick={() => setI(i - 1)}>
            ← Retour
          </button>
        )}
        <button class="ui-btn ui-btn-main" onClick={() => (last ? onDone() : setI(i + 1))}>
          {last ? doneLabel : 'Suivant →'}
        </button>
      </div>
      <p class="ui-muted ui-progress-dots" aria-hidden="true">
        {lines.map((_, k) => (k === i ? '●' : '○')).join(' ')}
      </p>
    </div>
  );
}
