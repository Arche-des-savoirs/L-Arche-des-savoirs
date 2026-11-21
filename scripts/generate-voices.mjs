#!/usr/bin/env node
// Génère les fichiers audio pré-calculés (narrateur + personnages principaux) via Google Cloud
// Text-to-Speech (voix Chirp3-HD), pour une lecture 100 % hors ligne en jeu.
//
// Portée exacte (voir src/ui/parts/Common.tsx, src/ui/screens/Session.tsx et
// src/ui/screens/Fin.tsx) : seules les répliques jouées via le composant <Dialogue> sont
// concernées, c'est-à-dire :
//   - day.opening (ouverture de chaque jour)
//   - day.closing (clôture de chaque jour)
//   - decision.options.{A,B,C}.scene (jouée comme le narrateur) + .line (le personnage choisi)
//   - content/fins.yaml : opening et closing de chacune des 5 fins (jour 6, chapitre 30)
//   - les questions d'exercice rédigées à la main (manche.tours[joueuse][].prompt), lues par la
//     voix dédiée EXERCICE_WHO ('exercice')
// Les répliques absurdes (Maelle), le prompt du vote, les phrases espagnoles de Rafaelle, et les
// questions générées procéduralement (gen) ou de révision (review) — texte non fixe, tiré à
// chaque partie — ne sont pas lues à voix haute pré-générée : elles restent hors périmètre.
//
// Idempotent : un fichier déjà présent sur disque n'est jamais régénéré (coûte un appel API) ;
// seule une réplique dont le texte a changé (donc un nouveau hash) relance une synthèse.
//
// extractLines() ci-dessous doit rester synchronisé avec extractVoicedLines() de
// src/content/audio.ts (même logique, dupliquée car ce script tourne en Node brut hors Vite/TS).
//
// Usage : node scripts/generate-voices.mjs [--force]

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHAPTERS_DIR = join(ROOT, 'content', 'chapters');
const FINS_PATH = join(ROOT, 'content', 'fins.yaml');
const AUDIO_DIR = join(ROOT, 'public', 'audio', 'voix');
const MANIFEST_PATH = join(ROOT, 'src', 'content', 'voiceManifest.json');
const API_KEY_PATH = join(ROOT, '.secrets', 'gcp-tts-api-key.txt');
const FORCE = process.argv.includes('--force');

// Mapping personnage -> voix Chirp3-HD fr-FR (validé par Hasina : narrateur/Charon,
// Thessaly/Despina, Nilo/Fenrir, Scribe/Rasalgethi, Dévoreuse/Gacrux ; le reste suit la même
// logique de casting, un timbre par personnage).
const VOICES = {
  narrateur: 'Charon',
  thessaly: 'Despina',
  nilo: 'Fenrir',
  scribe: 'Rasalgethi',
  devoreuse: 'Gacrux',
  plume: 'Puck',
  gardien: 'Orus',
  mouf: 'Algieba',
  epouvantail: 'Sadachbia',
  veilleur: 'Iapetus',
  trame: 'Alnilam',
  reine: 'Callirrhoe',
  habitant: 'Enceladus',
  passeur: 'Achird',
  pigeon: 'Sadaltager',
  fil: 'Algenib',
  cartea: 'Autonoe',
  albin: 'Umbriel',
  axelle: 'Aoede',
  maelle: 'Leda',
  rafaelle: 'Erinome',
  marchand: 'Schedar',
  peseur: 'Sulafat',
  rouage: 'Zephyr',
  chrono: 'Kore',
  capitaine: 'Schedar',
  vera: 'Pulcherrima',
  alambic: 'Zubenelgenubi',
  architecte: 'Rasalgethi',
  solen: 'Achernar',
  // Voix dédiée aux questions d'exercice (QuestionView.tsx) : volontairement distincte de
  // toutes les voix de personnages ci-dessus, pour bien séparer « récit » et « exercice » à l'oreille.
  exercice: 'Vindemiatrix'
};

function readApiKey() {
  if (!existsSync(API_KEY_PATH)) {
    console.error(`Clé API introuvable : ${API_KEY_PATH}`);
    process.exit(1);
  }
  return readFileSync(API_KEY_PATH, 'utf8').trim();
}

function manifestKey(who, text) {
  return `${who}\u0000${text}`;
}

function hashOf(who, text) {
  return createHash('sha1').update(manifestKey(who, text)).digest('hex').slice(0, 16);
}

/** Extrait toutes les répliques (who, text) effectivement voisées dans le jeu, pour un chapitre. */
function extractLines(chapter) {
  const lines = [];
  for (const day of chapter.days ?? []) {
    for (const l of day.opening ?? []) lines.push({ who: l.who, text: l.text });
    for (const l of day.closing ?? []) lines.push({ who: l.who, text: l.text });
  }
  if (chapter.decision) {
    for (const key of ['A', 'B', 'C']) {
      const opt = chapter.decision.options?.[key];
      if (!opt) continue;
      lines.push({ who: 'narrateur', text: opt.scene });
      lines.push({ who: opt.line.who, text: opt.line.text });
    }
  }
  return lines;
}

/** Extrait les prompts des questions d'exercice rédigées à la main (hors `gen` et `review`). */
function extractQuestionLines(chapter) {
  const lines = [];
  for (const day of chapter.days ?? []) {
    for (const manche of day.manches ?? []) {
      for (const items of Object.values(manche.tours ?? {})) {
        for (const item of items) {
          if ('kind' in item) lines.push({ who: 'exercice', text: item.prompt });
        }
      }
    }
  }
  return lines;
}

function loadChapters() {
  const files = readdirSync(CHAPTERS_DIR).filter((f) => f.endsWith('.yaml')).sort();
  const chapters = [];
  for (const f of files) {
    chapters.push(parse(readFileSync(join(CHAPTERS_DIR, f), 'utf8')));
  }
  return chapters;
}

/** Extrait les répliques des 5 fins (jour 6, chapitre 30) : même logique que pour un chapitre. */
function extractFinLines(fin) {
  const lines = [];
  for (const l of fin.opening ?? []) lines.push({ who: l.who, text: l.text });
  for (const l of fin.closing ?? []) lines.push({ who: l.who, text: l.text });
  return lines;
}

function loadFins() {
  return existsSync(FINS_PATH) ? parse(readFileSync(FINS_PATH, 'utf8')) : [];
}

/** Les voix Chirp3-HD élident mal l'apostrophe droite (ASCII, ') dans les contractions
 * françaises (n'est, j'ai, l'Arche…), la prononçant parfois comme un symbole à part au lieu
 * d'une élision. L'apostrophe typographique (’) est normalisée correctement : on la substitue
 * uniquement pour la synthèse (le texte affiché à l'écran garde l'apostrophe droite). */
function forSpeech(text) {
  return text.replace(/'/g, '’');
}

async function synthesize(apiKey, who, text) {
  const voiceName = VOICES[who];
  if (!voiceName) {
    console.warn(`  ⚠ Aucune voix assignée pour "${who}" — ligne ignorée : ${text.slice(0, 50)}…`);
    return null;
  }
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text: forSpeech(text) },
      voice: { languageCode: 'fr-FR', name: `fr-FR-Chirp3-HD-${voiceName}` },
      audioConfig: { audioEncoding: 'OGG_OPUS' }
    })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Échec synthèse (${res.status}) pour ${who}/${voiceName} : ${body.slice(0, 300)}`);
  }
  const { audioContent } = await res.json();
  return Buffer.from(audioContent, 'base64');
}

async function main() {
  mkdirSync(AUDIO_DIR, { recursive: true });
  const apiKey = readApiKey();
  const chapters = loadChapters();
  const fins = loadFins();

  const manifest = existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) : {};
  const seen = new Set();
  let toGenerate = 0;
  let totalChars = 0;

  const allLines = [...chapters.flatMap(extractLines), ...chapters.flatMap(extractQuestionLines), ...fins.flatMap(extractFinLines)];
  for (const { who, text } of allLines) {
    const key = manifestKey(who, text);
    if (seen.has(key)) continue;
    seen.add(key);
    if (!VOICES[who]) continue;
    const hash = hashOf(who, text);
    manifest[key] = hash;
    totalChars += text.length;
    const file = join(AUDIO_DIR, `${hash}.ogg`);
    if (FORCE || !existsSync(file)) toGenerate++;
  }

  console.log(`Répliques uniques repérées : ${seen.size} (${totalChars} caractères).`);
  console.log(`À générer : ${toGenerate} fichier(s) (le reste existe déjà sur disque).`);

  let done = 0;
  let failed = 0;
  for (const [key, hash] of Object.entries(manifest)) {
    const sep = key.indexOf('\u0000');
    const who = key.slice(0, sep);
    const text = key.slice(sep + 1);
    const file = join(AUDIO_DIR, `${hash}.ogg`);
    if (!FORCE && existsSync(file)) continue;
    try {
      const audio = await synthesize(apiKey, who, text);
      if (!audio) continue;
      writeFileSync(file, audio);
      done++;
      console.log(`  ✓ [${who}] ${text.slice(0, 60)}${text.length > 60 ? '…' : ''}`);
      await new Promise((r) => setTimeout(r, 150));
    } catch (err) {
      failed++;
      console.error(`  ✗ [${who}] ${err.message}`);
    }
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 0));
  console.log(`\nTerminé : ${done} généré(s), ${failed} échec(s). Manifeste : ${MANIFEST_PATH}`);
  if (failed > 0) process.exitCode = 1;
}

main();
