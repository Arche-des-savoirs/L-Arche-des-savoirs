// Pont entre le moteur pur et l'écran : signaux d'état + actions qui sauvegardent après chaque changement.
import { computed, signal } from '@preact/signals';
import { decisionOf } from '../content/decisions';
import { chapterOf } from '../content/chapters';
import { createReducer, GameRuleError, isFinalDay, type Action } from '../engine/game';
import { placementLevel, updateSkill, type Level } from '../engine/difficulty';
import { dayPlan, newProgress, skillSignal, type QuestionResult } from '../engine/session';
import type { Profile } from '../engine/profile';
import type { PlayerId } from '../engine/types';
import type { Subject } from '../content/schema';
import { emptySave, loadSave, wipeSave, writeSave, type SaveData } from '../storage/save';
import { decide } from '../engine/parent';

export type Route = 'chargement' | 'accueil' | 'diagnostic' | 'parent' | 'avatars' | 'seance' | 'a-demain' | 'bientot' | 'fin';
export const route = signal<Route>('chargement');
export const save = signal<SaveData>(emptySave());
export const lastError = signal<string | null>(null);

const reduce = createReducer(decisionOf);

let queue: Promise<void> = Promise.resolve();
/** Écritures en file : l'ordre des sauvegardes suit l'ordre des actions. */
function persist() {
  const snapshot = save.value;
  queue = queue.then(() => writeSave(snapshot)).catch((e) => console.error('Sauvegarde impossible', e));
  return queue;
}
export const flushSave = () => queue;

function update(fn: (s: SaveData) => SaveData) {
  save.value = fn(save.value);
  void persist();
}

export const chapter = computed(() => chapterOf(save.value.game.position.chapter));
export const day = computed(() => chapter.value?.days.find((d) => d.n === save.value.game.position.day));
export const plan = computed(() => {
  const s = save.value.game.session;
  return chapter.value && day.value && s ? dayPlan(chapter.value, day.value, s.turnOrder) : [];
});
export const currentStep = computed(() => plan.value[save.value.progress?.step ?? 0]);

export async function init() {
  save.value = await loadSave();
  route.value = 'accueil';
}

export function dispatch(action: Action): boolean {
  try {
    update((s) => ({ ...s, game: reduce(s.game, action) }));
    lastError.value = null;
    return true;
  } catch (e) {
    if (e instanceof GameRuleError) {
      lastError.value = e.message;
      return false;
    }
    throw e;
  }
}

/** Bouton « Commencer » / « Reprendre » de l'accueil. */
export function startOrResume(now = Date.now()) {
  const s = save.value;
  if (!s.profiles || Object.values(s.profiles).some((p) => !p.companionConfirmed)) {
    route.value = 'avatars';
    return;
  }
  if (!chapterOf(s.game.position.chapter)) {
    route.value = 'bientot';
    return;
  }
  // Le jour 6 du chapitre 30 (vote final) une fois tranché : plus de session à démarrer, le
  // retour au carrefour (Fin 5) ou la relecture de la fin se font depuis l'écran « fin ».
  if (s.game.final) {
    route.value = 'fin';
    return;
  }
  if (!s.game.session) {
    if (!dispatch({ type: 'DEMARRER_SESSION', now, bypassCalendar: testMode() })) {
      route.value = 'a-demain';
      return;
    }
    const p = save.value.game.position;
    update((x) => ({ ...x, progress: newProgress(p.chapter, p.day) }));
  }
  route.value = isFinalDay(save.value.game.position) ? 'fin' : 'seance';
}

/** Clôt la session du vote final (jour 6) sans router vers « à demain » : l'aventure est finie,
 * ou n'attend plus qu'un retour au carrefour (Fin 5) — géré par l'écran « fin » lui-même. */
export function finishFinalSession(now = Date.now()) {
  const before = save.value;
  if (!dispatch({ type: 'TERMINER_SESSION' })) return;
  const p = before.progress;
  const sess = before.game.session;
  if (p && sess)
    update((s) => ({ ...s, history: [...s.history, { chapter: p.chapter, day: p.day, startedAt: sess.startedAt, endedAt: now, extra: sess.extra, results: p.results }] }));
}

export function saveProfiles(profiles: Record<PlayerId, Profile>) {
  update((s) => ({ ...s, profiles }));
}

export function nextStep() {
  const s = save.value;
  if (!s.progress) return;
  // Mode test : sauter le Conseil sans voter choisit l'option A, sinon la séance ne pourrait pas se terminer.
  if (testMode() && currentStep.value?.kind === 'conseil' && s.game.session && !s.game.session.decided)
    dispatch({ type: 'DECIDER', record: { first: { axelle: 'A', maelle: 'A', rafaelle: 'A' }, palabre: false, result: 'A' } });
  if (s.progress.step + 1 >= plan.value.length) return finishSession();
  update((x) => ({ ...x, progress: { ...x.progress!, step: x.progress!.step + 1 } }));
}

/** Mode test : revenir à l'étape précédente de la séance. */
export function prevStep() {
  const s = save.value;
  if (!s.progress || s.progress.step === 0) return;
  update((x) => ({ ...x, progress: { ...x.progress!, step: x.progress!.step - 1 } }));
}

export function finishSession(now = Date.now()) {
  const before = save.value;
  if (!dispatch({ type: 'TERMINER_SESSION' })) return;
  const p = before.progress;
  const sess = before.game.session;
  if (p && sess)
    update((s) => ({ ...s, history: [...s.history, { chapter: p.chapter, day: p.day, startedAt: sess.startedAt, endedAt: now, extra: sess.extra, results: p.results }] }));
  route.value = 'a-demain';
}

// ───────── Mode parent ─────────

export const checkPin = (pin: string) => pin === save.value.settings.pin;
export function setPin(pin: string) {
  update((s) => ({ ...s, settings: { ...s.settings, pin } }));
}
export function setVoice(voiceName: string | undefined, rate: number) {
  update((s) => ({ ...s, settings: { ...s.settings, voiceName, rate } }));
}
export const testMode = () => save.value.settings.testMode === true;
export function setTestMode(on: boolean) {
  update((s) => ({ ...s, settings: { ...s.settings, testMode: on } }));
}
/** Mode test : placer la partie sur un chapitre et un jour (la séance en cours est abandonnée). */
export function jumpTo(chapter: number, day: number) {
  if (dispatch({ type: 'TEST_ALLER_A', position: { chapter, day } })) update((s) => ({ ...s, progress: null }));
}
/** Réinitialisation complète : on vide la base puis on recharge l'app, comme au premier lancement. */
export async function resetEverything(reload: () => void = () => location.reload()) {
  await queue;
  await wipeSave();
  save.value = emptySave();
  reload();
}

export const autoRead = () => save.value.settings.autoRead !== false;
export function setAutoRead(on: boolean) {
  update((s) => ({ ...s, settings: { ...s.settings, autoRead: on } }));
}
export function parentDecide(session: number, index: number, verdict: 'ok' | 'ko') {
  update((s) => ({ ...s, history: decide(s.history, session, index, verdict) }));
}
/** Remplace toute la sauvegarde par un import (après confirmation du parent). */
export async function replaceSave(data: SaveData) {
  save.value = data;
  await persist();
}

export function useTeamCall(manche: number) {
  update((s) => ({ ...s, progress: { ...s.progress!, teamCalls: [...s.progress!.teamCalls, manche] } }));
}

/** Enregistre un résultat et ajuste le niveau de la fille dans la matière. */
export function recordResult(r: QuestionResult, adaptive = true) {
  update((s) => {
    const sig = skillSignal(r);
    const skills = adaptive && sig ? { ...s.skills, [r.player]: { ...s.skills[r.player], [r.subject]: updateSkill(s.skills[r.player][r.subject], sig.correct, sig.helped) } } : s.skills;
    return { ...s, skills, progress: s.progress && { ...s.progress, results: [...s.progress.results, r] } };
  });
}

/** Fin de l'échelle de placement : fixe le niveau de départ. */
export function applyPlacement(player: PlayerId, subject: Subject, results: Array<{ level: number; correct: boolean; helped: boolean }>): Level {
  const level = placementLevel(results);
  update((s) => ({ ...s, skills: { ...s.skills, [player]: { ...s.skills[player], [subject]: { level, streakOk: 0, streakKo: 0 } } } }));
  return level;
}

export const levelOf = (player: PlayerId, subject: Subject): Level => save.value.skills[player][subject].level;
