// Profil d'avatar de chaque fille : un buste illustré (généré par IA, voir docs/prompts-avatars-bustes.md)
// choisi parmi plusieurs variantes par sœur — plus de personnalisation procédurale (SVG). Voir
// public/images/avatars/<joueur>-<n>.webp et BUST_COUNT ci-dessous pour le nombre de variantes
// disponibles par sœur (mis à jour au fur et à mesure que les images sont livrées).
import type { PlayerId } from './types';

export interface Profile {
  bust: number; // 1-based, voir BUST_COUNT[joueur] pour la plage valide
  companionConfirmed: boolean;
}

export const NAMES: Record<PlayerId, string> = { axelle: 'Axelle', maelle: 'Maelle', rafaelle: 'Rafaelle' };
export const ROLES: Record<PlayerId, string> = { axelle: 'la Veilleuse', maelle: 'la Cartographe', rafaelle: "l'Archiviste" };
/** Couleur canon de la lanterne (et de la cape sur les bustes) — utilisée ailleurs pour les badges/accents de couleur par joueuse. */
export const LUEURS: Record<PlayerId, string> = { axelle: '#f4c95d', maelle: '#fbfaff', rafaelle: '#f5a3c7' };
/** Nombre de bustes illustrés disponibles par sœur (public/images/avatars/<joueur>-1..N.webp). */
export const BUST_COUNT: Record<PlayerId, number> = { axelle: 5, maelle: 5, rafaelle: 5 };
export const COMPANIONS: Record<PlayerId, { name: string; emoji: string }> = {
  axelle: { name: 'le lionceau', emoji: '🦁' },
  maelle: { name: 'le louveteau', emoji: '🐺' },
  rafaelle: { name: 'le fauconneau', emoji: '🦅' }
};
/** Portrait illustré du compagnon disponible (public/images/avatars/companion-<joueur>.webp) ;
 * tant que false, l'écran affiche l'emoji de repli (COMPANIONS[joueur].emoji). */
export const COMPANION_IMAGE_READY: Record<PlayerId, boolean> = { axelle: false, maelle: false, rafaelle: false };
export const DEFAULT_PROFILE: Record<PlayerId, Profile> = {
  axelle: { bust: 1, companionConfirmed: false },
  maelle: { bust: 1, companionConfirmed: false },
  rafaelle: { bust: 1, companionConfirmed: false }
};
