// Lance : npx vite-node scripts/simulate-endings.ts  (ou via le test Vitest « fins »)
import { DECISIONS } from '../src/content/decisions';
import { simulateEndings } from '../src/engine/simulate';

const profiles: Array<[string, [number, number, number]]> = [
  ['choix au hasard', [1, 1, 1]],
  ['plutôt Lien', [2, 1, 1]],
  ['plutôt Courage', [1, 2, 1]],
  ['plutôt Mémoire', [1, 1, 2]]
];
for (const [name, w] of profiles) console.log(name, simulateEndings(DECISIONS, 200_000, 7, w));
