// Éléments partagés : passage de main, en-tête de séance, dialogue.
import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { Line } from '../../content/schema';
import { COMPANIONS, LUEURS, NAMES, ROLES } from '../../engine/profile';
import type { PlayerId } from '../../engine/types';
import { autoRead, save, setAutoRead } from '../store';
import { Avatar } from './Avatar';
import { sayLine, stopSpeaking } from '../voice';

const SPEAKERS: Record<string, string> = {
  narrateur: 'Le narrateur',
  thessaly: 'Thessaly',
  plume: 'Plume',
  gardien: 'Le Gardien',
  nilo: 'Nilo',
  mouf: 'Mouf',
  epouvantail: "L'Épouvantail-Qui-Oublie",
  veilleur: 'Le Veilleur',
  habitant: 'Un habitant',
  passeur: 'Le Passeur Sans Rives',
  pigeon: 'Pigeon',
  fil: 'Le Fil Sans Fin',
  reine: 'La Reine Sans Ombre',
  scribe: 'Le Scribe',
  devoreuse: 'La Dévoreuse',
  trame: 'Trame',
  cartea: 'Dame Cartéa',
  albin: "Albin, l'Écho du Jardin",
  marchand: 'Le Marchand',
  peseur: 'Le Peseur de Brume',
  rouage: 'Rouage',
  chrono: "Chrono, l'Horloger",
  capitaine: 'Le Capitaine de la Nacelle',
  vera: 'Véra'
};
const speaker = (who: string) => SPEAKERS[who] ?? NAMES[who as PlayerId] ?? who;
/** Texte réellement lu à voix haute : annonce le personnage avant sa réplique, sauf pour le narrateur (prose, pas une citation). */
const spoken = (line: Line) => (line.who === 'narrateur' ? line.text : `${speaker(line.who)} dit : ${line.text}`);

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

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
/** Chiffres romains jusqu'à 39 (chapitres et jours). */
export const roman = (n: number) => 'X'.repeat(Math.floor(n / 10)) + ROMAN[n % 10];

/** En-tête de grimoire : chapitre, titre, puis jour gravé dans un cartouche. */
export function ChapterHeading({ chapter, title, day, dayTitle }: { chapter: number; title: string; day?: number; dayTitle?: string }) {
  return (
    <header class="ui-grimoire-head">
      <p class="ui-grimoire-kicker">
        <span aria-hidden="true">✦ ─── </span>Chapitre {roman(chapter)}<span aria-hidden="true"> ─── ✦</span>
      </p>
      <h2 class="ui-grimoire-title">{title}</h2>
      {day !== undefined && (
        <p class="ui-grimoire-day">
          Jour {roman(day)}
          {dayTitle && <span class="ui-grimoire-sep"> · </span>}
          {dayTitle}
        </p>
      )}
    </header>
  );
}

/** Dialogue ligne par ligne, lu à voix haute automatiquement (le conteur), avec bouton pour couper la voix. */
export function Dialogue({ lines, onDone, doneLabel = 'Continuer' }: { lines: Line[]; onDone: () => void; doneLabel?: string }) {
  const [i, setI] = useState(0);
  const voiceOn = autoRead();
  const line = lines[i]!;
  useEffect(() => {
    if (voiceOn) sayLine(line.who, line.text, spoken(line));
    return stopSpeaking;
  }, [i, voiceOn]);
  const last = i >= lines.length - 1;
  const narrator = line.who === 'narrateur';
  return (
    <div class={`ui-dialogue${narrator ? ' ui-dialogue-narrator' : ''}`}>
      <p class="ui-speaker">
        {speaker(line.who)}
        {line.to && <span class="ui-speaker-to"> à {NAMES[line.to]}</span>}
      </p>
      <p class={`ui-line ui-tale${narrator ? ' ui-tale-narrator' : ' ui-tale-voice'}`} key={i}>
        {line.text}
      </p>
      <div class="ui-row">
        <button class="ui-btn" onClick={() => sayLine(line.who, line.text, spoken(line))}>
          🔊 Réécouter
        </button>
        <button class="ui-btn ui-btn-small" aria-pressed={!voiceOn} onClick={() => (voiceOn ? (stopSpeaking(), setAutoRead(false)) : setAutoRead(true))}>
          {voiceOn ? '🔇 Couper le conteur' : '🗣️ Activer le conteur'}
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
