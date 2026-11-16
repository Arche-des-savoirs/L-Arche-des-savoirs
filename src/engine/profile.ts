// Profil d'avatar de chaque fille. Peau et cheveux longs noirs sont fixes ; le reste se choisit.
import type { PlayerId } from './types';

export type Hairstyle = 'laches' | 'tresse' | 'queue';
export type Accessory = 'etoile' | 'noeud' | 'fleur' | 'aucun';
export const HAIRSTYLES: Record<Hairstyle, string> = { laches: 'Cheveux lâchés', tresse: 'Une tresse', queue: 'Une queue de cheval' };
export const ACCESSORIES: Record<Accessory, string> = { etoile: 'Barrette étoile', noeud: 'Nœud', fleur: 'Fleur', aucun: 'Rien' };
export const CAPE_COLORS = { or: '#f4c95d', argent: '#e8ecf7', rose: '#f5a3c7', turquoise: '#5fd4c8', violet: '#b48cf0', vert: '#8fd16a' } as const;
export type CapeColor = keyof typeof CAPE_COLORS;
export const CAPE_LABELS: Record<CapeColor, string> = { or: 'Or', argent: 'Argent', rose: 'Rose', turquoise: 'Turquoise', violet: 'Violet', vert: 'Vert' };

export interface Profile {
  hair: Hairstyle;
  cape: CapeColor;
  accessory: Accessory;
  companionConfirmed: boolean;
}

export const NAMES: Record<PlayerId, string> = { axelle: 'Axelle', maelle: 'Maelle', rafaelle: 'Rafaelle' };
export const ROLES: Record<PlayerId, string> = { axelle: 'la Veilleuse', maelle: 'la Cartographe', rafaelle: "l'Archiviste" };
export const LUEURS: Record<PlayerId, string> = { axelle: '#f4c95d', maelle: '#f4f1ff', rafaelle: '#f5a3c7' };
export const COMPANIONS: Record<PlayerId, { name: string; emoji: string }> = {
  axelle: { name: 'le lionceau', emoji: '🦁' },
  maelle: { name: 'le louveteau', emoji: '🐺' },
  rafaelle: { name: 'le fauconneau', emoji: '🦅' }
};
export const DEFAULT_PROFILE: Record<PlayerId, Profile> = {
  axelle: { hair: 'laches', cape: 'or', accessory: 'etoile', companionConfirmed: false },
  maelle: { hair: 'tresse', cape: 'argent', accessory: 'noeud', companionConfirmed: false },
  rafaelle: { hair: 'queue', cape: 'rose', accessory: 'fleur', companionConfirmed: false }
};
