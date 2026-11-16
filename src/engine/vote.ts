// Conseil de la Lanterne : vote secret, palabre obligatoire si une voix diffère,
// second vote, puis la Décideuse du jour tranche si le désaccord persiste.
import type { PlayerId } from './types';

export type Ballot<T extends string> = Record<PlayerId, T>;

export type VoteOutcome<T extends string> =
  | { status: 'resolu'; result: T; palabre: boolean; decidedBy?: PlayerId }
  | { status: 'palabre-puis-second-vote' }
  | { status: 'decideuse'; decider: PlayerId; options: T[] };

const unanimous = <T extends string>(b: Ballot<T>): T | null => {
  const values = Object.values(b) as T[];
  return values.every((v) => v === values[0]) ? (values[0] ?? null) : null;
};

export function resolveVote<T extends string>(input: { first: Ballot<T>; second?: Ballot<T>; decider: PlayerId; deciderChoice?: T }): VoteOutcome<T> {
  const one = unanimous(input.first);
  if (one) return { status: 'resolu', result: one, palabre: false };
  if (!input.second) return { status: 'palabre-puis-second-vote' };
  const two = unanimous(input.second);
  if (two) return { status: 'resolu', result: two, palabre: true };
  const options = [...new Set(Object.values(input.second) as T[])].sort();
  if (!input.deciderChoice) return { status: 'decideuse', decider: input.decider, options };
  if (!options.includes(input.deciderChoice)) throw new Error('La Décideuse doit choisir une option proposée au second vote.');
  return { status: 'resolu', result: input.deciderChoice, palabre: true, decidedBy: input.decider };
}
