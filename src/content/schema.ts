// Schéma du contenu (chapitres en YAML). Une erreur ici fait échouer le build et les tests, jamais une partie.
import { z } from 'zod';

export const playerId = z.enum(['axelle', 'maelle', 'rafaelle']);
export const subject = z.enum(['maths', 'francais', 'sciences', 'histoire-geo', 'espagnol', 'musique']);
export type Subject = z.infer<typeof subject>;

/** Question rédigée à la main (doc du chapitre ou banques). */
export const question = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  subject,
  /** 1 à 3 : niveau de la classe ; 4 à 5 : classe supérieure. */
  level: z.number().int().min(1).max(5),
  kind: z.enum(['nombre', 'qcm', 'court', 'ordre', 'libre']),
  prompt: z.string().min(3),
  choices: z.array(z.string()).min(2).optional(),
  /** Réponse attendue : un nombre, un texte, ou une liste ordonnée. */
  answer: z.union([z.number(), z.string(), z.array(z.string())]).optional(),
  /** Autres réponses acceptées (formulations, unités). */
  accept: z.array(z.string()).optional(),
  /** Indice donné par la Gardienne de l'indice. */
  hint: z.string().optional(),
  /** Horloge visuelle affichée (ex. « 14:45 »), surtout pour Maelle. */
  clock: z.string().regex(/^\d{1,2}:\d{2}$/).optional(),
  /** Phrase à lire à voix haute par la fille (affiche le bouton Écouter). */
  read: z.string().optional(),
  /** Réponse libre ou orale : validée par les sœurs puis contrôlable en mode parent. */
  validation: z.enum(['auto', 'soeurs', 'parent']).default('auto')
});
export type Question = z.infer<typeof question>;

/** Question produite par un générateur à graine fixe. */
export const generated = z.object({ gen: z.string(), count: z.number().int().min(1).max(5).default(1) });
export const tourItem = z.union([question, generated]);
export type TourItem = z.infer<typeof tourItem>;

const line = z.object({ who: z.string(), text: z.string().min(1), to: playerId.optional() });
export type Line = z.infer<typeof line>;

export const manche = z.object({
  id: z.string(),
  title: z.string(),
  intro: z.string().optional(),
  /** Échelle de placement (jour 1) : on monte d'un cran à chaque réussite, arrêt après 2 échecs. */
  placement: z.boolean().default(false),
  tours: z.record(playerId, z.array(tourItem).min(1))
});
export type Manche = z.infer<typeof manche>;

const rhythm = z.object({
  /** Durées en temps : 4 = ronde, 2 = blanche, 1 = noire, 0.5 = croche. */
  measures: z.record(playerId, z.object({ given: z.array(z.number()), missing: z.number(), prompt: z.string() }))
});

export const day = z.object({
  n: z.number().int().min(1).max(6),
  title: z.string(),
  decor: z.string(),
  opening: z.array(line).min(1),
  manches: z.array(manche).min(1).max(4),
  pause: z.string(),
  closing: z.array(line).min(1),
  reward: z.string().optional(),
  /** Jour 5 du chapitre 1 : le Concert de la Porte (mini-jeu de rythme). */
  concert: rhythm.optional()
});
export type Day = z.infer<typeof day>;

const variant = z.object({
  label: z.string(),
  /** Scène de Convergence jouée au jour 5 si cette option l'emporte. */
  scene: z.string(),
  line: z.object({ who: z.string(), text: z.string() }),
  /** Habillage des épreuves du jour 5 dans cette variante. */
  habillage: z.string()
});

/** Décision du chapitre : votée au début du jour 5, elle choisit la variante de Convergence. */
export const decision = z.object({
  prompt: z.string(),
  options: z.object({ A: variant, B: variant, C: variant })
});
export type Decision = z.infer<typeof decision>;

export const chapter = z.object({
  id: z.string().regex(/^ch\d{2}$/),
  number: z.number().int().min(1).max(30),
  act: z.number().int().min(1).max(3),
  title: z.string(),
  /** Image IA d'introduction (facultative : le décor SVG la remplace). */
  introImage: z.string().optional(),
  scene: z.string(),
  days: z.array(day).min(5).max(6),
  decision: decision.optional(),
  /** Phrases en espagnol de Rafaelle (une par séance) avec leur traduction. */
  espagnol: z.array(z.object({ es: z.string(), fr: z.string() })).default([]),
  /** Répliques absurdes proposées à Maelle face au Gardien. */
  repliquesAbsurdes: z.array(z.string()).default([])
});
export type Chapter = z.infer<typeof chapter>;
