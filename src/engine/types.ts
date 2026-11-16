// Types du moteur de jeu. Le moteur est pur : aucune dépendance à l'UI, au stockage ni à l'horloge système.

export type PlayerId = 'axelle' | 'maelle' | 'rafaelle';
export const PLAYERS: readonly PlayerId[] = ['axelle', 'maelle', 'rafaelle'];

/** Options de décision : A = Lien, B = Courage, C = Mémoire. */
export type Option = 'A' | 'B' | 'C';
export type Value = 'L' | 'C' | 'M';
export const VALUE_OF: Record<Option, Value> = { A: 'L', B: 'C', C: 'M' };

export type Flag = 'NILO_AMI' | 'PLUME_SAIT' | 'CHANCELIER_ALLIE' | 'MACHINE_EPARGNEE' | 'CHRONO_DEBOUT' | 'SABLIER_DE_POCHE';

export type Ending = 'F1' | 'F2' | 'F3' | 'F4' | 'F5';

export interface OptionEffect {
  /** Effet sur le compteur d'Orvane (O). */
  orvane?: number;
  setFlags?: Flag[];
}

export interface DecisionDef {
  chapter: number;
  /** Carrefour majeur : +2 au lieu de +1, point de retour possible après la Fin 5. */
  major: boolean;
  effects: Partial<Record<Option, OptionEffect>>;
}

export interface Counters {
  L: number;
  C: number;
  M: number;
  /** Orvane, borné à [−3 ; +3]. */
  O: number;
}

export interface Position {
  chapter: number;
  day: number;
}
