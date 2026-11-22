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
const DRY_RUN = process.argv.includes('--dry-run'); // affiche les prompts générés, sans appel API (aucun coût)
const FROM_ARG = (() => {
  const i = process.argv.indexOf('--from');
  return i >= 0 ? Number(process.argv[i + 1]) : 0;
})(); // reprend à partir de l'index N (0-based) sans retoucher aux lignes déjà refaites avant une coupure
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
  "Tous les personnages présents dans la scène sont actifs et en mouvement (gestes, posture " +
  "dynamique, regard engagé, interaction avec le décor) : jamais de pose statique, bras ballants, " +
  "debout immobile. Ne place jamais systématiquement le même personnage, animal ou objet au centre " +
  "géométrique de l'image d'une illustration à l'autre : varie à chaque fois la position, l'échelle " +
  "et l'angle de vue, en cohérence avec le texte de la réplique, pour que chaque image soit unique. " +
  "Aucun texte, lettre, mot ou légende dans l'image : uniquement l'illustration, le texte de la " +
  "réplique est déjà affiché séparément par l'application.";

/** Pool de consignes de cadrage, choisies de façon déterministe (hash de la réplique) pour que
 * deux répliques différentes ne tombent jamais sur la même composition par défaut (le modèle
 * recentre sinon systématiquement le sujet) — demande de Hasina du 22/11 : trop de redondance,
 * animaux/personnages toujours au même endroit. */
const COMPOSITIONS = [
  "Cadrage : plan large, personnage décentré sur le tiers gauche de l'image, en plein mouvement (il court, se penche ou tend le bras).",
  "Cadrage : plan rapproché sur le haut du corps, légère contre-plongée, posture dynamique et expressive.",
  "Cadrage : vue de trois-quarts, personnage décentré à droite, en train de se déplacer ou de gesticuler.",
  "Cadrage : plan d'ensemble, personnage en hauteur ou en profondeur de champ, jamais au centre géométrique de l'image.",
  "Cadrage : légère plongée, personnage décentré, en action (saut, course, geste large).",
  "Cadrage : plan serré sur les mains ou l'objet manipulé, personnage visible en partie, dans un geste précis.",
  "Cadrage : vue latérale, personnage en mouvement vers un point d'intérêt de la scène, décentré d'un tiers.",
  "Cadrage : plan d'ensemble asymétrique, le personnage principal n'occupe qu'un tiers de l'image, le reste rempli par le décor et l'action.",
  "Cadrage : gros plan expressif sur le visage, décentré, en train de parler ou de réagir activement.",
  "Cadrage : composition en diagonale, personnage décentré, posture en élan ou en léger déséquilibre.",
  "Cadrage : vue plongeante depuis un point haut du décor, personnages décentrés, échelle réduite par rapport au décor.",
  "Cadrage : très gros plan sur un détail de l'action (regard, geste, objet), le reste de la scène suggéré en arrière-plan flou."
];

function compositionFor(hash) {
  const n = parseInt(hash.slice(0, 8), 16);
  return COMPOSITIONS[n % COMPOSITIONS.length];
}

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

/** Construit le prompt d'une ligne : critères du/des personnage(s) (si applicable) + consigne de
 * scène tirée du texte de la réplique + consigne de cadrage (varie par réplique) + style global.
 * Quand la réplique a un destinataire (`to` dans le YAML, ou déduit du voisinage immédiat dans le
 * même échange), les deux personnages sont décrits et mis en avant ensemble — demande de Hasina du
 * 22/11 : quand un personnage parle à un autre, l'accent doit être mis sur les deux. */
function buildPrompt(l, chapterTitle, hash) {
  const { who, text, dayTitle, interlocutor } = l;
  const fiche = PERSONNAGES[who];
  const contexte = `Chapitre « ${chapterTitle} », scène : « ${dayTitle} ».`;
  const cadrage = compositionFor(hash);
  if (SANS_PERSONNAGE.has(who) || !fiche) {
    return `${contexte} Illustre cette scène (sans personnage nommé si narrateur) : ${text}\n${cadrage}\n${STYLE_GLOBAL}`;
  }
  const ficheInterlocuteur = interlocutor && interlocutor !== who ? PERSONNAGES[interlocutor] : null;
  const duo = ficheInterlocuteur
    ? `\n${ficheInterlocuteur}\nScène de dialogue entre ${who} et ${interlocutor} : montre les deux personnages ensemble, tous deux visibles et actifs dans l'échange (regards, gestes, postures vivantes) — ne cadre pas uniquement celui qui parle, aucun des deux relégué à l'arrière-plan.`
    : '';
  return `${contexte} ${fiche}${duo}\nIllustre cette scène avec ce(s) personnage(s), dans la situation suivante : ${text}\n${cadrage}\n${STYLE_GLOBAL}`;
}

/** Associe à chaque réplique son interlocuteur : le champ `to` du YAML quand il est renseigné,
 * sinon le personnage nommé le plus proche (réplique suivante, puis précédente) dans le même
 * échange (opening/closing), pour couvrir aussi les dialogues sans `to` explicite. */
function withInterlocutors(entries) {
  return entries.map((l, i) => {
    if (l.to) return { ...l, interlocutor: l.to };
    const candidats = [entries[i + 1]?.who, entries[i - 1]?.who];
    const interlocutor = candidats.find((w) => w && w !== l.who && PERSONNAGES[w] && !SANS_PERSONNAGE.has(w));
    return { ...l, interlocutor };
  });
}

function extractLines(chapter) {
  const lines = [];
  for (const day of chapter.days ?? []) {
    const opening = withInterlocutors(day.opening ?? []);
    const closing = withInterlocutors(day.closing ?? []);
    opening.forEach((l, i) => lines.push({ who: l.who, text: l.text, interlocutor: l.interlocutor, dayN: day.n, dayTitle: day.title, part: 'opening', index: i }));
    closing.forEach((l, i) => lines.push({ who: l.who, text: l.text, interlocutor: l.interlocutor, dayN: day.n, dayTitle: day.title, part: 'closing', index: i }));
  }
  if (chapter.decision) {
    for (const k of ['A', 'B', 'C']) {
      const opt = chapter.decision.options?.[k];
      if (!opt) continue;
      lines.push({ who: 'narrateur', text: opt.scene, dayN: 'decision', dayTitle: opt.label, part: `decision-${k}`, index: 0 });
      lines.push({ who: opt.line.who, text: opt.line.text, interlocutor: opt.line.to, dayN: 'decision', dayTitle: opt.label, part: `decision-${k}`, index: 1 });
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
  const apiKey = DRY_RUN ? null : readApiKey();

  const file = join(CHAPTERS_DIR, `ch${String(CHAPITRE_ARG).padStart(2, '0')}.yaml`);
  const chapter = parse(readFileSync(file, 'utf8'));
  const lines = extractLines(chapter);
  const chapterImg = chapterImageBuffer(CHAPITRE_ARG);

  const manifest = existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) : {};
  let done = 0, skipped = 0, failed = 0;

  console.log(`Chapitre ${CHAPITRE_ARG} — ${lines.length} image(s) à produire${FROM_ARG ? ` (reprise à partir de l'index ${FROM_ARG})` : ''}.`);

  for (let idx = 0; idx < lines.length; idx++) {
    if (idx < FROM_ARG) continue;
    const l = lines[idx];
    const key = manifestKey(CHAPITRE_ARG, l.dayN, l.part, l.index);
    const hash = hashOf(key, l.text);
    const outPath = join(LINE_IMG_DIR, `${hash}.webp`);
    // La clé n'est écrite dans le manifeste qu'une fois le fichier réellement sur le disque
    // (généré à l'instant, ou déjà présent d'un run précédent) — jamais en cas d'échec, pour ne
    // jamais pointer vers une image qui n'existe pas.
    if (!DRY_RUN && !FORCE && existsSync(outPath)) { manifest[key] = hash; skipped++; continue; }
    const prompt = buildPrompt(l, chapter.title, hash);
    if (DRY_RUN) {
      console.log(`\n--- [${l.who}${l.interlocutor ? ' → ' + l.interlocutor : ''}] ${l.dayTitle} / ${l.part}#${l.index} ---`);
      console.log(prompt);
      continue;
    }
    try {
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
