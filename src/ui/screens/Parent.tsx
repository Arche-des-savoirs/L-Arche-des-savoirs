// Mode parent : bilan, historique par séance, réponses à valider, réglages et sauvegarde.
import { useEffect, useState } from 'preact/hooks';
import { chapterOf } from '../../content/chapters';
import { dayKey } from '../../engine/calendar';
import { SUBJECTS } from '../../engine/difficulty';
import { FINAL_DAY, LAST_CHAPTER } from '../../engine/game';
import { effectiveVerdict, isValidPin, pending, sessionLine, summary } from '../../engine/parent';
import { NAMES } from '../../engine/profile';
import { PLAYERS, type Option } from '../../engine/types';
import type { Subject } from '../../content/schema';
import { loadFrenchVoices, type VoiceInfo } from '../../platform/voices';
import { fromExport, toExport } from '../../storage/save';
import { autoRead, dispatch, jumpTo, lastError, parentDecide, replaceSave, resetEverything, route, save, setAutoRead, setPin, setTestMode, setVoice, testMode } from '../store';
import { CHAPTERS } from '../../content/chapters';
import { say } from '../voice';
import { Card } from '../parts/Common';

const SUBJECT_LABELS: Record<Subject, string> = { maths: 'Maths', francais: 'Français', sciences: 'Sciences', 'histoire-geo': 'Histoire-géo', espagnol: 'Espagnol', musique: 'Musique' };
const fmtDate = (t: number) => new Date(t).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const pct = (j: number, t: number) => (t ? `${Math.round((100 * j) / t)} %` : '—');
type Tab = 'bilan' | 'historique' | 'valider' | 'reglages';

export function Parent() {
  const [tab, setTab] = useState<Tab>('bilan');
  const now = Date.now();
  const nPending = pending(save.value.history, now).length;
  const tabs: Array<[Tab, string]> = [
    ['bilan', 'Bilan'],
    ['historique', 'Historique'],
    ['valider', `À valider (${nPending})`],
    ['reglages', 'Réglages']
  ];
  return (
    <main class="ui-page ui-parent">
      <header class="ui-session-bar">
        <button class="ui-btn ui-btn-small" onClick={() => (route.value = 'accueil')}>
          ← Quitter le mode parent
        </button>
        <nav class="ui-tabs" role="tablist" aria-label="Mode parent">
          {tabs.map(([t, label]) => (
            <button key={t} role="tab" aria-selected={tab === t} class={`ui-btn ui-btn-small${tab === t ? ' ui-selected' : ''}`} onClick={() => setTab(t)}>
              {label}
            </button>
          ))}
        </nav>
      </header>
      <div class="ui-parent-body">
        {tab === 'bilan' && <Bilan now={now} />}
        {tab === 'historique' && <Historique now={now} />}
        {tab === 'valider' && <AValider now={now} />}
        {tab === 'reglages' && <Reglages now={now} />}
      </div>
    </main>
  );
}

function Bilan({ now }: { now: number }) {
  const { history, skills, game } = save.value;
  const sum = summary(history, skills, now);
  return (
    <Card title="Bilan par fille et par matière" wide>
      <p class="ui-muted">
        {history.length} séance{history.length > 1 ? 's' : ''} terminée{history.length > 1 ? 's' : ''} · position : chapitre {game.position.chapter}, jour {game.position.day}. Niveau = difficulté adaptative actuelle (1 à 5 ; 4 et 5 = classe supérieure).
      </p>
      <table class="ui-table ui-table-compact">
        <thead>
          <tr>
            <th scope="col">Matière</th>
            {PLAYERS.map((p) => (
              <th key={p} scope="col">
                {NAMES[p]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SUBJECTS.map((sub) => (
            <tr key={sub}>
              <th scope="row">{SUBJECT_LABELS[sub]}</th>
              {PLAYERS.map((p) => {
                const c = sum[p][sub];
                return (
                  <td key={p}>
                    <strong>niv. {c.level}</strong> · {c.justes}/{c.total} ({pct(c.justes, c.total)}){c.attente > 0 && <span class="ui-muted"> · {c.attente} à valider</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function Historique({ now }: { now: number }) {
  const history = save.value.history;
  const [open, setOpen] = useState<number | null>(null);
  if (history.length === 0)
    return (
      <Card title="Historique des séances">
        <p class="ui-line">Aucune séance terminée pour l'instant.</p>
      </Card>
    );
  return (
    <Card title="Historique des séances" wide>
      <ul class="ui-history">
        {[...history.keys()].reverse().map((i) => {
          const s = history[i]!;
          const line = sessionLine(s, now);
          const ch = chapterOf(s.chapter);
          return (
            <li key={i}>
              <button class="ui-history-row" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                <span class="ui-history-date">{fmtDate(s.startedAt)}</span>
                <span>
                  Ch. {s.chapter} · Jour {s.day}
                  {ch ? ` — ${ch.days.find((d) => d.n === s.day)?.title ?? ''}` : ''}
                  {s.extra && <span class="ui-badge">séance en plus</span>}
                </span>
                <span class="ui-history-scores">
                  {PLAYERS.map((p) => `${NAMES[p]} ${line[p].justes}/${line[p].total}`).join(' · ')}
                </span>
                <span class="ui-muted">{Math.round((s.endedAt - s.startedAt) / 60000)} min</span>
              </button>
              {open === i && (
                <table class="ui-table ui-table-compact">
                  <thead>
                    <tr>
                      <th scope="col">Fille</th>
                      <th scope="col">Question</th>
                      <th scope="col">Réponse</th>
                      <th scope="col">Attendu</th>
                      <th scope="col">Résultat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.results.map((r, ri) => {
                      const v = effectiveVerdict(r, now);
                      return (
                        <tr key={ri}>
                          <td>{NAMES[r.player]}</td>
                          <td>
                            {r.prompt ?? r.questionId}
                            <div class="ui-muted">
                              {SUBJECT_LABELS[r.subject]} · niv. {r.level}
                              {r.helped ? ' · aidée' : ''}
                              {r.attempts > 1 ? ' · 2 essais' : ''}
                            </div>
                          </td>
                          <td>{r.response || '—'}</td>
                          <td>{r.expected ?? '—'}</td>
                          <td class={v === 'juste' ? 'ui-ok' : v === 'faux' ? 'ui-ko' : ''}>
                            {v === 'juste' ? 'Juste' : v === 'faux' ? 'Faux' : 'À valider'}
                            {r.parent && <div class="ui-muted">décidé par le parent</div>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function AValider({ now }: { now: number }) {
  const list = pending(save.value.history, now);
  return (
    <Card title="Réponses à valider" wide>
      <p class="ui-muted">Réponses que la Voix de l'équipe a marquées « Pas sûr ». Sans décision, elles sont validées automatiquement au bout de 24 h.</p>
      {list.length === 0 ? (
        <p class="ui-line">Rien à valider. ✨</p>
      ) : (
        <ul class="ui-history">
          {list.map(({ session, index, result: r, remaining }) => (
            <li key={`${session}-${index}`} class="ui-validate">
              <div>
                <strong>{NAMES[r.player]}</strong> · {SUBJECT_LABELS[r.subject]} · {fmtDate(r.at)}
                <p class="ui-line">{r.prompt ?? r.questionId}</p>
                <p>
                  Réponse : <strong>{r.response || '(dite à voix haute)'}</strong>
                  {r.expected && <span class="ui-muted"> · piste : {r.expected}</span>}
                </p>
                <p class="ui-muted">Validation automatique dans {Math.max(1, Math.ceil(remaining / 3600000))} h.</p>
              </div>
              <div class="ui-row">
                <button class="ui-btn ui-btn-main" onClick={() => parentDecide(session, index, 'ok')}>
                  Juste
                </button>
                <button class="ui-btn" onClick={() => parentDecide(session, index, 'ko')}>
                  Faux
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Reglages({ now }: { now: number }) {
  const { game, settings } = save.value;
  const key = dayKey(new Date(now));
  const extraOpen = game.calendar.extraGranted.includes(key) && !game.calendar.extraUsed.includes(key);
  const last = game.choices.at(-1);
  const lastCh = last ? chapterOf(last.chapter) : undefined;
  const [voices, setVoices] = useState<VoiceInfo[] | null>(null);
  const [rate, setRate] = useState(settings.rate);
  const [newPin, setNewPin] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [importData, setImportData] = useState<ReturnType<typeof fromExport> | null>(null);
  const [fixTo, setFixTo] = useState<Option | null>(null);
  const [wipeStep, setWipeStep] = useState<0 | 1>(0);
  const [wipeWord, setWipeWord] = useState('');
  const [jump, setJump] = useState({ chapter: game.position.chapter, day: game.position.day });

  useEffect(() => {
    void loadFrenchVoices().then(setVoices);
  }, []);

  const exportFile = () => {
    const blob = new Blob([toExport(save.value)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `arche-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setMsg('Sauvegarde exportée dans Téléchargements.');
  };
  const pickFile = (f: File | undefined) => {
    if (!f) return;
    void f.text().then((t) => {
      try {
        setImportData(fromExport(t));
        setMsg(null);
      } catch (e) {
        setMsg((e as Error).message);
      }
    });
  };

  return (
    <div class="ui-settings">
      {msg && (
        <p class="ui-hint" role="status">
          {msg}
        </p>
      )}
      <Card title="Séance en plus">
        <p>{extraOpen ? "Une séance en plus est accordée aujourd'hui : elles peuvent rejouer." : 'Les filles ont droit à une séance par jour (nouveau jour à 5 h).'}</p>
        <button
          class="ui-btn ui-btn-main"
          disabled={extraOpen}
          onClick={() => {
            dispatch({ type: 'PARENT_SESSION_EN_PLUS', now: Date.now() });
            setMsg("Séance en plus accordée pour aujourd'hui.");
          }}
        >
          Accorder une séance en plus aujourd'hui
        </button>
      </Card>

      <Card title="Corriger le dernier vote">
        {!last ? (
          <p>Aucun vote enregistré pour l'instant.</p>
        ) : (
          <>
            <p>
              Chapitre {last.chapter} : <strong>{lastCh?.decision?.options[last.result].label ?? `option ${last.result}`}</strong>
              {last.decidedBy && ` (tranché par ${NAMES[last.decidedBy]})`}.
            </p>
            <div class="ui-row">
              {(['A', 'B', 'C'] as Option[]).map((o) => (
                <button key={o} class={`ui-btn ui-btn-small${fixTo === o ? ' ui-selected' : ''}`} disabled={o === last.result} onClick={() => setFixTo(o)}>
                  {o} — {lastCh?.decision?.options[o].label ?? o}
                </button>
              ))}
            </div>
            {fixTo && (
              <div class="ui-row">
                <span>Remplacer le vote par « {lastCh?.decision?.options[fixTo].label ?? fixTo} » ? Les compteurs seront recalculés.</span>
                <button
                  class="ui-btn ui-btn-main"
                  onClick={() => {
                    if (dispatch({ type: 'PARENT_CORRIGER_DERNIER_VOTE', result: fixTo })) setMsg('Vote corrigé.');
                    else setMsg(lastError.value);
                    setFixTo(null);
                  }}
                >
                  Confirmer
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      <Card title="Voix de lecture">
        {voices === null ? (
          <p class="ui-muted">Recherche des voix…</p>
        ) : voices.length === 0 ? (
          <p>Aucune voix française sur cet appareil.</p>
        ) : (
          <div class="ui-row ui-wrap">
            {voices.map((v) => {
              const selected = (settings.voiceName ?? voices[0]!.name) === v.name;
              return (
                <button key={v.name} class={`ui-btn ui-btn-small${selected ? ' ui-selected' : ''}`} aria-pressed={selected} onClick={() => setVoice(v.name, rate)}>
                  {v.name}
                  {v.local ? '' : ' (en ligne)'}
                </button>
              );
            })}
          </div>
        )}
        <label class="ui-row">
          Vitesse : {rate.toFixed(2).replace('.', ',')}
          <input type="range" min="0.7" max="1.2" step="0.05" value={rate} onInput={(e) => setRate(Number(e.currentTarget.value))} onChange={() => setVoice(settings.voiceName, rate)} />
        </label>
        <label class="ui-check">
          <input type="checkbox" checked={autoRead()} onChange={(e) => setAutoRead(e.currentTarget.checked)} /> Lecture automatique des dialogues (le conteur)
        </label>
        <button class="ui-btn" onClick={() => say('Bonjour les apprenties, bienvenue dans l’Arche des Savoirs.')}>
          🔊 Tester
        </button>
      </Card>

      <Card title="Code parent">
        <form
          class="ui-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isValidPin(newPin)) return setMsg('Le code doit faire exactement 4 chiffres.');
            setPin(newPin);
            setNewPin('');
            setMsg('Nouveau code enregistré.');
          }}
        >
          <input class="ui-input ui-input-pin" inputMode="numeric" maxLength={4} value={newPin} onInput={(e) => setNewPin(e.currentTarget.value.replace(/\D/g, ''))} aria-label="Nouveau code à 4 chiffres" placeholder="Nouveau code" type="password" />
          <button class="ui-btn" type="submit" disabled={newPin.length !== 4}>
            Changer le code
          </button>
        </form>
      </Card>

      <Card title="Mode test (pour le parent)">
        <p class="ui-muted">Pour vérifier les chapitres rapidement. À désactiver avant de rendre la tablette aux filles.</p>
        <label class="ui-check">
          <input type="checkbox" checked={testMode()} onChange={(e) => setTestMode(e.currentTarget.checked)} />
          <span>Activer le mode test : boutons Avancer et Retour sur les questions et les étapes, séances illimitées</span>
        </label>
        {testMode() && (
          <div class="ui-row">
            <label>
              Chapitre{' '}
              <select class="ui-select" value={jump.chapter} onChange={(e) => setJump({ chapter: Number(e.currentTarget.value), day: 1 })} aria-label="Chapitre">
                {CHAPTERS.map((c) => (
                  <option key={c.number} value={c.number}>
                    {c.number} — {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Jour{' '}
              <select class="ui-select" value={jump.day} onChange={(e) => setJump({ ...jump, day: Number(e.currentTarget.value) })} aria-label="Jour">
                {(CHAPTERS.find((c) => c.number === jump.chapter)?.days ?? []).map((d) => (
                  <option key={d.n} value={d.n}>
                    {d.n} — {d.title}
                  </option>
                ))}
                {/* Le chapitre 30 a un 6e jour, hors contenu YAML : le vote final entre les portes ouvertes (voir engine/game.ts). */}
                {jump.chapter === LAST_CHAPTER && (
                  <option value={FINAL_DAY}>{FINAL_DAY} — Vote final (portes ouvertes)</option>
                )}
              </select>
            </label>
            <button
              class="ui-btn"
              onClick={() => {
                jumpTo(jump.chapter, jump.day);
                setMsg(`Partie placée au chapitre ${jump.chapter}, jour ${jump.day}.`);
              }}
            >
              Aller à
            </button>
          </div>
        )}
      </Card>

      <Card title="Sauvegarde">
        <p class="ui-muted">L'export contient toute la partie : progression, votes, niveaux, historique et réglages.</p>
        <div class="ui-row">
          <button class="ui-btn ui-btn-main" onClick={exportFile}>
            Exporter (fichier JSON)
          </button>
          <label class="ui-btn ui-file">
            Importer…
            <input type="file" accept="application/json,.json" onChange={(e) => pickFile(e.currentTarget.files?.[0])} aria-label="Fichier de sauvegarde à importer" />
          </label>
        </div>
        <div class="ui-danger">
          <h3>Réinitialiser cet appareil</h3>
          <p>Efface tout sur cette tablette : progression, avatars, votes, niveaux, historique, réglages et code parent (retour à 0000). L'app repart du tout début. Pense à exporter avant.</p>
          {wipeStep === 0 ? (
            <button class="ui-btn ui-btn-danger" onClick={() => setWipeStep(1)}>
              Tout réinitialiser…
            </button>
          ) : (
            <form
              class="ui-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (wipeWord.trim().toUpperCase() === 'EFFACER') void resetEverything();
              }}
            >
              <label>
                Pour confirmer, écris EFFACER :{' '}
                <input class="ui-input ui-input-pin" value={wipeWord} onInput={(e) => setWipeWord(e.currentTarget.value)} aria-label="Écris EFFACER pour confirmer" autocomplete="off" />
              </label>
              <button class="ui-btn ui-btn-danger" type="submit" disabled={wipeWord.trim().toUpperCase() !== 'EFFACER'}>
                Effacer définitivement
              </button>
              <button class="ui-btn" type="button" onClick={() => (setWipeStep(0), setWipeWord(''))}>
                Annuler
              </button>
            </form>
          )}
        </div>
        {importData && (
          <div class="ui-hint">
            <p>
              Remplacer la partie actuelle par cette sauvegarde (chapitre {importData.game.position.chapter}, jour {importData.game.position.day}, {importData.history.length} séance(s)) ? La partie actuelle sera perdue.
            </p>
            <div class="ui-row">
              <button
                class="ui-btn ui-btn-main"
                onClick={() => {
                  void replaceSave(importData).then(() => setMsg('Sauvegarde importée.'));
                  setImportData(null);
                }}
              >
                Remplacer
              </button>
              <button class="ui-btn" onClick={() => setImportData(null)}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
