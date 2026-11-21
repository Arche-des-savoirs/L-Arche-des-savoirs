#!/usr/bin/env node
// Génère une illustration par réplique (chapitre, jour, ouverture/clôture + scènes de décision)
// via l'API OpenAI (gpt-image-2.6, endpoint /v1/images/edits), pour un affichage captivant pendant
// la lecture : une image à chaque écran, synchronisée avec le texte lu.
//
// Cohérence des personnages (demande de Hasina) : chaque appel reçoit systématiquement, en plus
// du texte de la réplique, (1) la fiche-critères du personnage qui parle (texte fixe ci-dessous,
// répété identique à chaque fois) et (2) l'illustration déjà existante du chapitre comme ancrage
// de palette/style — voir public/images/chapitres/ch<NN>.webp (déjà précachée, cf. CLAUDE.md
// hors-ligne-d'abord). Si une fiche-portrait de référence a été générée pour ce personnage
// (voir generateReferencePortraits ci-dessous), elle est aussi fournie en entrée.
//
// Usage : node scripts/generate-images-lignes.mjs --chapitre 1 [--force]
// (Pilote volontairement limité à un chapitre à la fois tant que le rendu n'est pas validé.)

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHAPTERS_DIR = join(ROOT, 'content', 'chapters');
const CHAPTER_IMG_DIR = join(ROOT, 'public', 'images', 'chapitres');
const LINE_IMG_DIR = join(ROOT, 'public', 'images', 'lignes');
const REF_IMG_DIR = join(ROOT, 'public', 'images', 'personnages');
const MANIFEST_PATH = join(ROOT, 'src', 'content', 'imageManifest.json');
const API_KEY_PATH = join(ROOT, '.secrets', 'openai-api-key.txt');
const MODEL = 'gpt-image-2.6-sunburst'; // cohérence d'édition > vitesse (voir Flare pour des brouillons)
const FORCE = process.argv.includes('--force');
const CHAPITRE_ARG = (() => {
  const i = process.argv.indexOf('--chapitre');
  return i >= 0 ? Number(process.argv[i + 1]) : undefined;
})();

// Style global, répété à chaque appel pour ancrer le rendu sur celui des 31 illustrations de
// chapitre déjà produites par Hasina (voir public/images/chapitres/*.webp) : dessin numérique
// semi-réaliste façon livre jeunesse, couleurs chaudes et lumineuses, scènes magiques.
const STYLE_GLOBAL =
  "Style : illustration numérique façon livre jeunesse, semi-réaliste, couleurs chaudes et " +
  "lumineuses, ambiance magique et chaleureuse, dans la continuité visuelle exacte de l'image " +
  "de référence du chapitre fournie en entrée (même univers, mêmes matières, même lumière). " +
  "Aucun texte, lettre, mot ou légende dans l'image : uniquement l'illustration, le texte de la " +
  "réplique est déjà affiché séparément par l'application.";

/** Fiches-critères des personnages : texte fixe injecté identique à chaque génération, pour que
 * le même personnage garde la même apparence d'une image à l'autre (en plus de la fiche-portrait
 * de référence, quand elle existe — voir REF_IMG_DIR). Validé par Hasina le 19/11/2026, dérivé du
 * texte déjà écrit dans les chapitres (voir content/chapters/*.yaml) pour ne rien inventer qui
 * contredise ce qui existe déjà. */
const PERSONNAGES = {
  axelle: "Axelle : jeune fille, cheveux noirs longs jusqu'aux épaules et lisses, cape dorée chatoyante, lanterne dorée, accompagnée d'un lionceau.",
  maelle: "Maelle : jeune fille, cheveux noirs longs jusqu'aux épaules et bouclés, cape blanche brodée d'étoiles dorées, lanterne blanche, accompagnée d'un louveteau.",
  rafaelle: "Rafaelle : jeune fille, cheveux noirs longs jusqu'au bas du dos et lisses, cape rose brodée d'étoiles dorées, lanterne rose, accompagnée d'un fauconneau.",
  // Répliques génériques de « Plume » (hors scène centrée sur une sœur précise) : les trois
  // compagnons ensemble, tels qu'établis dans l'illustration du chapitre 1.
  plume: "Plume (le compagnon magique) sous ses trois formes réunies : un lionceau, un louveteau et un fauconneau, jouant ensemble.",
  thessaly: "Thessaly : femme âgée, cheveux argentés relevés en chignon, robe et cape mauve brodées de motifs dorés, bijoux dorés, sourire chaleureux, posture de Grande Archiviste de l'Arche.",

  mouf: "Mouf : petite créature ronde de brouillard gris (un « Oublion »), un épi de blé dans la bouche, grands yeux étonnés.",
  nilo: "Nilo : jeune garçon conteur de légendes, une carte vivante roulée sous le bras, un renard-lanterne à ses côtés.",
  epouvantail: "L'Épouvantail-Qui-Oublie : épouvantail grisâtre, posture penchée et hésitante, garde un moulin.",
  veilleur: "Le Veilleur : vieil homme en manteau rapiécé, trousseau de clés rouillées à la main.",
  passeur: "Le Passeur Sans Rives : vieil homme assis dans une barque peinte en bleu, une lanterne éteinte à la proue, le regard perdu dans la brume.",
  pigeon: "Pigeon : pigeon gris et blanc, plumes ébouriffées, œil orange très vif.",
  fil: "Le Fil Sans Fin : pas de forme humaine — silhouette de câbles noirs emmêlés (ou, une fois apaisé, une simple corde de harpe dorée).",
  habitant: "Un habitant du Royaume des Ombres : citadin anonyme, silhouette pâle et grisée, vêtements simples et intemporels.",
  reine: "La Reine Sans Ombre : femme grande et pâle, robe de nuit étoilée, couronne d'argent, cheveux blancs, aucune ombre à ses pieds.",
  scribe: "Le Scribe : silhouette anguleuse, longue robe de papier froissé, tenant une plume immense faisant office de rame.",
  trame: "Trame : figure incomplète et fragmentaire, comme tissée de bribes et de morceaux retrouvés, inachevée.",
  cartea: "Dame Cartéa : femme grande et droite, longue robe grise semée de petites étoiles cousues, tenant une plume fine et un compas doré.",
  albin: "Albin, l'Écho du Jardin : pas de corps fixe — une brume dorée prenant peu à peu la forme d'une silhouette patiente.",
  marchand: "Le Marchand : homme chaleureux, turban haut, sourire large, étal chargé de colliers et de petites boîtes dorées.",
  peseur: "Le Peseur de Brume : petit nuage de brume argentée, une minuscule balance dorée en son centre.",
  rouage: "Rouage : automate de bronze, assis bien droit, yeux de verre à la lueur bleue.",
  chrono: "Chrono, l'Horloger : vieil homme, mains couvertes d'huile et de rouille, au milieu d'une mer d'horloges de pierre.",
  capitaine: "Le Capitaine de la Nacelle : homme robuste, visage buriné, sourire franc, conduit une nacelle d'osier au-dessus d'un gouffre.",
  vera: "Véra : femme âgée aux cheveux argentés, une lunette de cuivre patiné à la main, au sommet d'une tour ouverte sur le ciel.",
  alambic: "Dame Alambic : femme élégante, mains tachées de pigments colorés, tablier de travail, devant un alambic de cuivre poli.",
  architecte: "L'Architecte : femme en tablier de travail, un plan de construction roulé sous le bras, sourire fatigué mais sincère.",
  solen: "Solen, le Barde : homme au manteau usé par les voyages, un instrument à cordes en bois sur les genoux, sourire chaleureux."
};

/** Personnages sans forme incarnée à l'écran : décor/atmosphère pur, jamais de silhouette
 * dessinée (cohérent avec le texte — un pont qui parle, une présence dans le noir). */
const SANS_PERSONNAGE = new Set(['narrateur', 'gardien', 'devoreuse']);

function readApiKey() {
  if (!existsSync(API_KEY_PATH)) {
    console.error(`Clé API introuvable : ${API_KEY_PATH} (voir étapes de création avec Claude).`);
    process.exit(1);
  }
  return readFileSync(API_KEY_PATH, 'utf8').trim();
}

function manifestKey(chapter, dayN, part, index) {
  return `ch${chapter}\u0000j${dayN}\u0000${part}\u0000${index}`;
}

function hashOf(key, text) {
  return createHash('sha1').update(`${key}\u0000${text}`).digest('hex').slice(0, 16);
}

/** Construit le prompt d'une ligne : critères du personnage (si applicable) + consigne de scène
 * tirée du texte de la réplique + style global. */
function buildPrompt(who, text, chapterTitle, dayTitle) {
  const fiche = PERSONNAGES[who];
  const contexte = `Chapitre « ${chapterTitle} », scène : « ${dayTitle} ».`;
  if (SANS_PERSONNAGE.has(who) || !fiche) {
    return `${contexte} Illustre cette scène (sans personnage nommé si narrateur) : ${text}\n${STYLE_GLOBAL}`;
  }
  return `${contexte} ${fiche}\nIllustre cette scène avec ce personnage, dans la situation suivante : ${text}\n${STYLE_GLOBAL}`;
}

function extractLines(chapter) {
  const lines = [];
  for (const day of chapter.days ?? []) {
    (day.opening ?? []).forEach((l, i) => lines.push({ who: l.who, text: l.text, dayN: day.n, dayTitle: day.title, part: 'opening', index: i }));
    (day.closing ?? []).forEach((l, i) => lines.push({ who: l.who, text: l.text, dayN: day.n, dayTitle: day.title, part: 'closing', index: i }));
  }
  if (chapter.decision) {
    for (const k of ['A', 'B', 'C']) {
      const opt = chapter.decision.options?.[k];
      if (!opt) continue;
      lines.push({ who: 'narrateur', text: opt.scene, dayN: 'decision', dayTitle: opt.label, part: `decision-${k}`, index: 0 });
      lines.push({ who: opt.line.who, text: opt.line.text, dayN: 'decision', dayTitle: opt.label, part: `decision-${k}`, index: 1 });
    }
  }
  return lines;
}

/** Référence au chapitre (ancrage style/palette) : l'illustration déjà existante. */
function chapterImageBuffer(chapterNumber) {
  const path = join(CHAPTER_IMG_DIR, `ch${String(chapterNumber).padStart(2, '0')}.webp`);
  return existsSync(path) ? readFileSync(path) : null;
}

/** Portrait de référence d'un personnage (généré une fois, réutilisé pour chaque réplique). */
function referencePortraitPath(who) {
  return join(REF_IMG_DIR, `${who}.webp`);
}

async function callImagesEdit(apiKey, prompt, refs) {
  const form = new FormData();
  form.append('model', MODEL);
  form.append('prompt', prompt);
  form.append('size', '1024x1024');
  form.append('quality', 'low'); // rendu tablette, image affichée à ~340×255px : low et medium quasi indiscernables à ce test (validé par Hasina le 21/11), low retenu pour le coût
  form.append('output_format', 'webp'); // cohérent avec les .webp déjà écrits sur disque (outPath en .webp)
  for (const ref of refs) {
    if (!ref) continue;
    form.append('image[]', new Blob([ref], { type: 'image/webp' }), 'reference.webp');
  }
  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Échec génération (${res.status}) : ${body.slice(0, 400)}`);
  }
  const { data } = await res.json();
  const b64 = data?.[0]?.b64_json;
  if (!b64) throw new Error('Réponse sans image (b64_json absent).');
  return Buffer.from(b64, 'base64');
}

async function main() {
  if (!CHAPITRE_ARG) {
    console.error('Usage : node scripts/generate-images-lignes.mjs --chapitre <numéro> [--force]');
    process.exit(1);
  }
  mkdirSync(LINE_IMG_DIR, { recursive: true });
  mkdirSync(REF_IMG_DIR, { recursive: true });
  const apiKey = readApiKey();

  const file = join(CHAPTERS_DIR, `ch${String(CHAPITRE_ARG).padStart(2, '0')}.yaml`);
  const chapter = parse(readFileSync(file, 'utf8'));
  const lines = extractLines(chapter);
  const chapterImg = chapterImageBuffer(CHAPITRE_ARG);

  const manifest = existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) : {};
  let done = 0, skipped = 0, failed = 0;

  console.log(`Chapitre ${CHAPITRE_ARG} — ${lines.length} image(s) à produire.`);

  for (const l of lines) {
    const key = manifestKey(CHAPITRE_ARG, l.dayN, l.part, l.index);
    const hash = hashOf(key, l.text);
    const outPath = join(LINE_IMG_DIR, `${hash}.webp`);
    // La clé n'est écrite dans le manifeste qu'une fois le fichier réellement sur le disque
    // (généré à l'instant, ou déjà présent d'un run précédent) — jamais en cas d'échec, pour ne
    // jamais pointer vers une image qui n'existe pas.
    if (!FORCE && existsSync(outPath)) { manifest[key] = hash; skipped++; continue; }
    try {
      const prompt = buildPrompt(l.who, l.text, chapter.title, l.dayTitle);
      const refPortrait = existsSync(referencePortraitPath(l.who)) ? readFileSync(referencePortraitPath(l.who)) : null;
      const image = await callImagesEdit(apiKey, prompt, [chapterImg, refPortrait]);
      writeFileSync(outPath, image);
      manifest[key] = hash;
      done++;
      console.log(`  ✓ [${l.who}] ${l.text.slice(0, 50)}…`);
      await new Promise((r) => setTimeout(r, 250));
    } catch (e) {
      failed++;
      console.error(`  ✗ [${l.who}] ${e.message}`);
    }
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 0));
  console.log(`\nTerminé : ${done} généré(s), ${skipped} déjà présent(s), ${failed} échec(s).`);
  if (failed > 0) process.exitCode = 1;
}

main();
