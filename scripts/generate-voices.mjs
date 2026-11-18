#!/usr/bin/env node
// Génère les fichiers audio pré-calculés (narrateur + personnages principaux) via Google Cloud
// Text-to-Speech (voix Chirp3-HD), pour une lecture 100 % hors ligne en jeu.
//
// Portée exacte (voir src/ui/parts/Common.tsx et src/ui/screens/Session.tsx) : seules les
// répliques jouées via le composant <Dialogue> sont concernées, c'est-à-dire :
//   - day.opening (ouverture de chaque jour)
//   - day.closing (clôture de chaque jour)
//   - decision.options.{A,B,C}.scene (jouée comme le narrateur) + .line (le personnage choisi)
// Les répliques absurdes (Maelle), le prompt du vote, et les phrases espagnoles de Rafaelle
// ne sont actuellement pas lues à voix haute dans le jeu : elles restent hors périmètre.
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
  axelle: 'Aoede',
  maelle: 'Leda',
  rafaelle: 'Erinome'
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

function loadChapters() {
  const files = readdirSync(CHAPTERS_DIR).filter((f) => f.endsWith('.yaml')).sort();
  const chapters = [];
  for (const f of files) {
    chapters.push(parse(readFileSync(join(CHAPTERS_DIR, f), 'utf8')));
  }
  return chapters;
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
      input: { text },
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

  const manifest = existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) : {};
  const seen = new Set();
  let toGenerate = 0;
  let totalChars = 0;

  for (const chapter of chapters) {
    const lines = extractLines(chapter);
    for (const { who, text } of lines) {
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
