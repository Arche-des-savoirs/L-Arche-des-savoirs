// État de partie et réducteur : (état, action) → nouvel état. Toutes les règles de déroulé sont ici.
import { canPlay, emptyCalendar, grantExtraSession, recordSession, type CalendarState } from './calendar';
import { applyDecision, emptyCounters, openDoors } from './counters';
import { PLAYERS, type Counters, type DecisionDef, type Ending, type Flag, type Option, type PlayerId, type Position } from './types';
import type { Ballot } from './vote';

export const LAST_CHAPTER = 30;
export const DAYS_PER_CHAPTER = 5;
/** Le chapitre 30 a un 6e jour : le vote final et la fin. */
export const FINAL_DAY = 6;
export const DECISION_DAY = 5;

export interface ChoiceRecord {
  chapter: number;
  first: Ballot<Option>;
  second?: Ballot<Option>;
  decidedBy?: PlayerId;
  palabre: boolean;
  result: Option;
}

export interface FinalRecord {
  doors: Ending[];
  first?: Ballot<Ending>;
  second?: Ballot<Ending>;
  decidedBy?: PlayerId;
  result: Ending;
}

interface Snapshot {
  counters: Counters;
  flags: Flag[];
  choicesLength: number;
}

export interface ActiveSession {
  startedAt: number;
  extra: boolean;
  turnOrder: PlayerId[];
  decider: PlayerId;
  /** La décision du jour 5 (ou le vote final) a été prise pendant cette session. */
  decided: boolean;
}

export interface GameState {
  version: 1;
  position: Position;
  sessionsPlayed: number;
  counters: Counters;
  flags: Flag[];
  choices: ChoiceRecord[];
  /** État juste avant chaque carrefour majeur : point de retour proposé après la Fin 5. */
  checkpoints: Record<number, Snapshot>;
  calendar: CalendarState;
  session: ActiveSession | null;
  final?: FinalRecord;
  /** Fins déjà vues (une Fin 5 suivie d'un retour reste dans l'historique). */
  endingsSeen: Ending[];
}

export const newGame = (): GameState => ({
  version: 1,
  position: { chapter: 1, day: 1 },
  sessionsPlayed: 0,
  counters: emptyCounters(),
  flags: [],
  choices: [],
  checkpoints: {},
  calendar: emptyCalendar(),
  session: null,
  endingsSeen: []
});

export type Action =
  | { type: 'DEMARRER_SESSION'; now: number }
  | { type: 'DECIDER'; record: Omit<ChoiceRecord, 'chapter'> }
  | { type: 'CHOISIR_FIN'; record: Omit<FinalRecord, 'doors'> }
  | { type: 'TERMINER_SESSION' }
  | { type: 'REVENIR_AU_CARREFOUR'; chapter: number }
  | { type: 'PARENT_SESSION_EN_PLUS'; now: number }
  | { type: 'PARENT_CORRIGER_DERNIER_VOTE'; result: Option };

export class GameRuleError extends Error {}

const fail = (msg: string): never => {
  throw new GameRuleError(msg);
};

/** Ordre de passage et Décideuse du jour tournent à chaque session. */
export function rotation(sessionsPlayed: number): { turnOrder: PlayerId[]; decider: PlayerId } {
  const k = sessionsPlayed % PLAYERS.length;
  const turnOrder = [...PLAYERS.slice(k), ...PLAYERS.slice(0, k)];
  return { turnOrder, decider: turnOrder[0]! };
}

export const daysIn = (chapter: number) => (chapter === LAST_CHAPTER ? FINAL_DAY : DAYS_PER_CHAPTER);
export const isDecisionDay = (p: Position) => p.day === DECISION_DAY;
export const isFinalDay = (p: Position) => p.chapter === LAST_CHAPTER && p.day === FINAL_DAY;

/** Recalcule compteurs et drapeaux depuis le journal des choix (correction de vote, retour arrière). */
export function replay(choices: readonly ChoiceRecord[], decisionOf: (chapter: number) => DecisionDef): { counters: Counters; flags: Flag[] } {
  return choices.reduce((acc, c) => applyDecision(acc.counters, acc.flags, decisionOf(c.chapter), c.result), { counters: emptyCounters(), flags: [] as Flag[] });
}

export function createReducer(decisionOf: (chapter: number) => DecisionDef) {
  return function reduce(state: GameState, action: Action): GameState {
    switch (action.type) {
      case 'DEMARRER_SESSION': {
        if (state.session) fail('Une session est déjà en cours.');
        if (state.final) fail(state.final.result === 'F5' ? 'Choisissez d’abord le carrefour où revenir.' : "L'aventure est terminée.");
        const check = canPlay(state.calendar, new Date(action.now));
        if (!check.ok) fail(check.reason === 'deja-joue' ? 'La session du jour est déjà jouée : à demain !' : "L'horloge de la tablette a reculé : demande le code parent.");
        const extra = check.ok && check.extra;
        return {
          ...state,
          calendar: recordSession(state.calendar, new Date(action.now), extra),
          session: { startedAt: action.now, extra, decided: false, ...rotation(state.sessionsPlayed) }
        };
      }

      case 'DECIDER': {
        const s = state.session ?? fail('Aucune session en cours.');
        if (!isDecisionDay(state.position)) fail("Le Conseil de la Lanterne ne se réunit qu'au jour 5.");
        if (s.decided) fail('La décision de ce chapitre est déjà prise.');
        const chapter = state.position.chapter;
        const def = decisionOf(chapter);
        const checkpoints = def.major ? { ...state.checkpoints, [chapter]: { counters: state.counters, flags: state.flags, choicesLength: state.choices.length } } : state.checkpoints;
        const applied = applyDecision(state.counters, state.flags, def, action.record.result);
        return {
          ...state,
          ...applied,
          checkpoints,
          choices: [...state.choices, { chapter, ...action.record }],
          session: { ...s, decided: true }
        };
      }

      case 'CHOISIR_FIN': {
        const s = state.session ?? fail('Aucune session en cours.');
        if (!isFinalDay(state.position)) fail("Le vote final n'a lieu qu'au dernier jour du chapitre 30.");
        if (s.decided) fail('La fin est déjà choisie.');
        const doors = openDoors(state.counters);
        if (!doors.includes(action.record.result)) fail('Cette porte est fermée.');
        return {
          ...state,
          final: { doors, ...action.record },
          endingsSeen: [...state.endingsSeen, action.record.result],
          session: { ...s, decided: true }
        };
      }

      case 'TERMINER_SESSION': {
        const s = state.session ?? fail('Aucune session en cours.');
        const p = state.position;
        if ((isDecisionDay(p) || isFinalDay(p)) && !s.decided) fail('Il faut d’abord prendre la décision du jour.');
        let position = p;
        if (!isFinalDay(p)) position = p.day < daysIn(p.chapter) ? { chapter: p.chapter, day: p.day + 1 } : { chapter: p.chapter + 1, day: 1 };
        return { ...state, position, sessionsPlayed: state.sessionsPlayed + 1, session: null };
      }

      case 'REVENIR_AU_CARREFOUR': {
        if (state.final?.result !== 'F5') fail('Le retour au carrefour est offert seulement après la Fin 5.');
        if (state.session) fail('Termine d’abord la session en cours.');
        const snap = state.checkpoints[action.chapter] ?? fail('Ce carrefour n’a pas été franchi.');
        const checkpoints = Object.fromEntries(Object.entries(state.checkpoints).filter(([c]) => Number(c) < action.chapter));
        const { final: _final, ...rest } = state;
        return {
          ...rest,
          position: { chapter: action.chapter, day: DECISION_DAY },
          counters: snap.counters,
          flags: snap.flags,
          choices: state.choices.slice(0, snap.choicesLength),
          checkpoints
        };
      }

      case 'PARENT_SESSION_EN_PLUS':
        return { ...state, calendar: grantExtraSession(state.calendar, new Date(action.now)) };

      case 'PARENT_CORRIGER_DERNIER_VOTE': {
        const last = state.choices.at(-1) ?? fail('Aucun vote à corriger.');
        if (state.final) fail('Le vote final ne se corrige pas : utilise le retour au carrefour.');
        const choices = [...state.choices.slice(0, -1), { ...last, result: action.result }];
        return { ...state, choices, ...replay(choices, decisionOf) };
      }
    }
  };
}
