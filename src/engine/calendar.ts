// Une session par jour, nouveau jour à 5 h (heure locale). Le parent peut débloquer une session en plus.

export const RESET_HOUR = 5;
/** Tolérance avant de considérer que l'horloge a été reculée. */
const BACKWARD_TOLERANCE_MS = 60 * 60 * 1000;

export interface CalendarState {
  lastSessionAt?: number;
  lastDayKey?: string;
  /** Jours où le parent a accordé une session supplémentaire. */
  extraGranted: string[];
  extraUsed: string[];
}

export const emptyCalendar = (): CalendarState => ({ extraGranted: [], extraUsed: [] });

/** Clé du « jour de jeu » : la journée commence à 5 h. */
export function dayKey(now: Date, resetHour = RESET_HOUR): string {
  const d = new Date(now.getTime() - resetHour * 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export type CanPlay = { ok: true; extra: boolean } | { ok: false; reason: 'deja-joue' | 'horloge-reculee' };

export function canPlay(cal: CalendarState, now: Date): CanPlay {
  if (cal.lastSessionAt !== undefined && now.getTime() < cal.lastSessionAt - BACKWARD_TOLERANCE_MS) return { ok: false, reason: 'horloge-reculee' };
  const key = dayKey(now);
  if (cal.lastDayKey !== key) return { ok: true, extra: false };
  if (cal.extraGranted.includes(key) && !cal.extraUsed.includes(key)) return { ok: true, extra: true };
  return { ok: false, reason: 'deja-joue' };
}

export function recordSession(cal: CalendarState, now: Date, extra: boolean): CalendarState {
  const key = dayKey(now);
  return {
    lastSessionAt: Math.max(cal.lastSessionAt ?? 0, now.getTime()),
    lastDayKey: key,
    extraGranted: cal.extraGranted,
    extraUsed: extra ? [...cal.extraUsed, key] : cal.extraUsed
  };
}

export function grantExtraSession(cal: CalendarState, now: Date): CalendarState {
  const key = dayKey(now);
  return cal.extraGranted.includes(key) ? cal : { ...cal, extraGranted: [...cal.extraGranted, key] };
}
