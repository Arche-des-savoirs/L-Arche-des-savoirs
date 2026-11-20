// Profil d'avatar de chaque fille.
// Peau, cheveux (longueur/texture) et couleur cape+lanterne sont fixes par sœur — canon partagé
// avec les fiches-critères du générateur d'illustrations (scripts/generate-images-lignes.mjs) :
// Axelle = lanterne et cape dorées ; Maelle = lanterne et cape blanches ; Rafaelle = lanterne et
// cape roses. Ces deux attributs ne sont donc plus des choix du joueur (voir HAIR_BY_PLAYER et
// LUEURS, utilisés directement par Avatar.tsx) : un avatar ne peut plus contredire l'univers
// visuel du jeu. Restent personnalisables : expression, pose et accessoire.
import type { PlayerId } from './types';

export type Hairstyle = 'lisse-epaules' | 'bouclee-epaules' | 'lisse-longue';
export type Expression = 'souriant' | 'determine' | 'emerveille';
export type Pose = 'debout' | 'bras-croises' | 'lanterne-levee';
export type Decor = 'etoiles' | 'brume' | 'livres' | 'aucun';
export type Accessory = 'etoile' | 'noeud' | 'fleur' | 'aucun';

export const EXPRESSIONS: Record<Expression, string> = { souriant: 'Souriante', determine: 'Déterminée', emerveille: 'Émerveillée' };
export const POSES: Record<Pose, string> = { debout: 'Debout, fière', 'bras-croises': 'Bras croisés', 'lanterne-levee': 'Lanterne levée' };
export const DECORS: Record<Decor, string> = { etoiles: 'Étoiles', brume: 'Brume dorée', livres: 'Livres flottants', aucun: 'Aucun' };
export const ACCESSORIES: Record<Accessory, string> = { etoile: 'Barrette étoile', noeud: 'Nœud', fleur: 'Fleur', aucun: 'Rien' };

export interface Profile {
  expression: Expression;
  pose: Pose;
  decor: Decor;
  accessory: Accessory;
  companionConfirmed: boolean;
}

export const NAMES: Record<PlayerId, string> = { axelle: 'Axelle', maelle: 'Maelle', rafaelle: 'Rafaelle' };
export const ROLES: Record<PlayerId, string> = { axelle: 'la Veilleuse', maelle: 'la Cartographe', rafaelle: "l'Archiviste" };
/** Couleur canon de la lanterne ET de la cape (identiques) — voir note en tête de fichier. */
export const LUEURS: Record<PlayerId, string> = { axelle: '#f4c95d', maelle: '#fbfaff', rafaelle: '#f5a3c7' };
/** Coiffure canon par sœur (fixe, non modifiable) — voir note en tête de fichier. */
export const HAIR_BY_PLAYER: Record<PlayerId, Hairstyle> = { axelle: 'lisse-epaules', maelle: 'bouclee-epaules', rafaelle: 'lisse-longue' };
export const COMPANIONS: Record<PlayerId, { name: string; emoji: string }> = {
  axelle: { name: 'le lionceau', emoji: '🦁' },
  maelle: { name: 'le louveteau', emoji: '🐺' },
  rafaelle: { name: 'le fauconneau', emoji: '🦅' }
};
export const DEFAULT_PROFILE: Record<PlayerId, Profile> = {
  axelle: { expression: 'souriant', pose: 'debout', decor: 'etoiles', accessory: 'etoile', companionConfirmed: false },
  maelle: { expression: 'determine', pose: 'bras-croises', decor: 'livres', accessory: 'noeud', companionConfirmed: false },
  rafaelle: { expression: 'emerveille', pose: 'lanterne-levee', decor: 'brume', accessory: 'fleur', companionConfirmed: false }
};
