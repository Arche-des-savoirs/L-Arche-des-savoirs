// Éléments partagés : passage de main, en-tête de séance, dialogue.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { Line } from '../../content/schema';
import { COMPANIONS, LUEURS, NAMES, ROLES } from '../../engine/profile';
import type { PlayerId } from '../../engine/types';
import { save } from '../store';
import { Avatar } from './Avatar';
import { sayLine, stopSpeaking } from '../voice';

function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Défilement de `.ui-dialogue-text` (colonne de texte, seule zone défilante) calé sur la durée
 * de la réplique (approximatif : vitesse constante sur toute la durée, pas de synchronisation
 * mot-à-mot). Remonte en haut au départ, puis descend jusqu'en bas du débordement pile quand la
 * voix se termine. L'image, elle, occupe toute la hauteur de sa colonne et ne fait partie
 * d'aucune zone de scroll : elle ne bouge jamais (demande du 21/11, après test en jeu — le
 * `position: sticky` utilisé avant dérivait encore un peu avant de se figer).
 */
function scrollAlongSpeech(container: HTMLElement | null, durationMs: Promise<number>): () => void {
  let cancelled = false;
  let raf = 0;
  if (container) container.scrollTop = 0;
  if (container && !prefersReducedMotion()) {
    void durationMs.then((ms) => {
      if (cancelled || !ms) return;
      const overflow = container.scrollHeight - container.clientHeight;
      if (overflow <= 0) return;
      const start = performance.now();
      const step = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / ms);
        container.scrollTop = overflow * t;
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
  }
  return () => {
    cancelled = true;
    if (raf) cancelAnimationFrame(raf);
  };
}

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
  vera: 'Véra',
  alambic: 'Dame Alambic',
  architecte: "L'Architecte",
  solen: 'Solen, le Barde'
};
const speaker = (who: string) => SPEAKERS[who] ?? NAMES[who as PlayerId] ?? who;
/** Texte réellement lu à voix haute : annonce le personnage avant sa réplique, sauf pour le narrateur (prose, pas une citation). */
const spoken = (line: Line) => (line.who === 'narrateur' ? line.text : `${speaker(line.who)} dit : ${line.text}`);

export function Card({ title, children, wide, fill }: { title?: string; children: ComponentChildren; wide?: boolean; fill?: boolean }) {
  return (
    <div class={`ui-card${wide ? ' ui-card-wide' : ''}${fill ? ' ui-card-fill' : ''}`}>
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

/**
 * Dialogue ligne par ligne, lu à voix haute automatiquement (le conteur, toujours actif).
 * Mise en page scindée image/texte (50/50), le côté de l'image basculant à chaque ligne —
 * `images` donne une image par ligne (voir src/content/images.ts:lineImages, chantier en cours
 * chapitre par chapitre ; repli sur l'illustration du chapitre tant qu'une ligne n'a pas la sienne).
 * L'image occupe toute la hauteur de sa colonne et est totalement statique ; `header`/`footer`
 * (titre de carte, en-tête de chapitre, décor, récompense…) sont rendus À L'INTÉRIEUR de la
 * colonne de texte pour qu'ils défilent avec elle plutôt que de rester au-dessus de l'image.
 * Utiliser avec <Card fill> côté appelant pour que la colonne défilante ait une hauteur définie.
 */
export function Dialogue({
  lines,
  onDone,
  doneLabel = 'Continuer',
  images,
  header,
  footer
}: {
  lines: Line[];
  onDone: () => void;
  doneLabel?: string;
  images: string[];
  header?: ComponentChildren;
  footer?: ComponentChildren;
}) {
  const [i, setI] = useState(0);
  const line = lines[i]!;
  const textRef = useRef<HTMLDivElement>(null);
  const cancelScrollRef = useRef<() => void>(() => undefined);
  const jouer = () => {
    cancelScrollRef.current();
    const { durationMs } = sayLine(line.who, line.text, spoken(line));
    cancelScrollRef.current = scrollAlongSpeech(textRef.current, durationMs);
  };
  useEffect(() => {
    jouer();
    return () => {
      cancelScrollRef.current();
      stopSpeaking();
    };
  }, [i]);
  const last = i >= lines.length - 1;
  const narrator = line.who === 'narrateur';
  const inverse = i % 2 === 1;
  return (
    <div class={`ui-dialogue-split${inverse ? ' ui-dialogue-inverse' : ''}`}>
      <div class="ui-dialogue-image" aria-hidden="true">
        <img src={images[i]} alt="" />
      </div>
      <div class={`ui-dialogue-text${narrator ? ' ui-dialogue-narrator' : ''}`} ref={textRef}>
        {header}
        <p class="ui-speaker">
          {speaker(line.who)}
          {line.to && <span class="ui-speaker-to"> à {NAMES[line.to]}</span>}
        </p>
        <p class={`ui-line ui-tale${narrator ? ' ui-tale-narrator' : ' ui-tale-voice'}`} key={i}>
          {line.text}
        </p>
        <div class="ui-row ui-dialogue-actions">
          <button class="ui-btn ui-btn-icon" onClick={jouer} aria-label="Réécouter">
            🔊
          </button>
          {i > 0 && (
            <button class="ui-btn ui-btn-icon" onClick={() => setI(i - 1)} aria-label="Retour">
              ←
            </button>
          )}
          <button class="ui-btn ui-btn-main" onClick={() => (last ? onDone() : setI(i + 1))}>
            {last ? doneLabel : 'Suivant →'}
          </button>
        </div>
        <p class="ui-muted ui-progress-dots" aria-hidden="true">
          {lines.map((_, k) => (k === i ? '●' : '○')).join(' ')}
        </p>
        {footer}
      </div>
    </div>
  );
}
