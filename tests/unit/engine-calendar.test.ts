import { describe, expect, it } from 'vitest';
import { canPlay, dayKey, emptyCalendar, grantExtraSession, recordSession } from '../../src/engine/calendar';

const at = (s: string) => new Date(s);

describe('calendrier', () => {
  it('le jour de jeu commence à 5 h', () => {
    expect(dayKey(at('2027-01-10T04:59:00'))).toBe('2027-01-09');
    expect(dayKey(at('2027-01-10T05:00:00'))).toBe('2027-01-10');
  });
  it('une seule session par jour', () => {
    const cal = recordSession(emptyCalendar(), at('2027-01-10T17:00:00'), false);
    expect(canPlay(cal, at('2027-01-10T20:00:00'))).toEqual({ ok: false, reason: 'deja-joue' });
    expect(canPlay(cal, at('2027-01-11T06:00:00'))).toEqual({ ok: true, extra: false });
  });
  it('le parent peut accorder une session en plus, utilisable une fois', () => {
    let cal = recordSession(emptyCalendar(), at('2027-01-10T17:00:00'), false);
    cal = grantExtraSession(cal, at('2027-01-10T18:00:00'));
    expect(canPlay(cal, at('2027-01-10T18:05:00'))).toEqual({ ok: true, extra: true });
    cal = recordSession(cal, at('2027-01-10T18:05:00'), true);
    expect(canPlay(cal, at('2027-01-10T19:00:00'))).toEqual({ ok: false, reason: 'deja-joue' });
  });
  it("bloque si l'horloge a été reculée", () => {
    const cal = recordSession(emptyCalendar(), at('2027-01-10T17:00:00'), false);
    expect(canPlay(cal, at('2027-01-08T17:00:00'))).toEqual({ ok: false, reason: 'horloge-reculee' });
  });
});
