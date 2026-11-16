import { useEffect, useState } from 'preact/hooks';
import { loadVoices, speak, type VoiceInfo } from '../platform/voices';
import { bumpOpenCount, ensurePersistentStorage, type StorageStatus } from '../storage/db';
import { offlineReady, swStatus } from '../pwa';
import { wakeLockState } from './App';

const wakeLabel: Record<string, string> = {
  active: 'Actif : l\'écran ne se mettra pas en veille',
  released: 'Inactif',
  unsupported: 'Non pris en charge par ce navigateur',
  error: 'Refusé par le navigateur'
};

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean | null }) {
  const cls = ok === true ? 'ui-ok' : ok === false ? 'ui-ko' : 'ui-neutral';
  return (
    <tr>
      <th scope="row">{label}</th>
      <td class={cls}>{value}</td>
    </tr>
  );
}

export function Diagnostic({ onBack }: { onBack: () => void }) {
  const [voices, setVoices] = useState<VoiceInfo[] | null>(null);
  const refreshVoices = () => {
    setVoices(null);
    void loadVoices().then(setVoices);
  };
  const [storage, setStorage] = useState<StorageStatus | null>(null);
  const [opens, setOpens] = useState<number | null>(null);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    void loadVoices().then(setVoices);
    void ensurePersistentStorage().then(setStorage);
    void bumpOpenCount().then(setOpens);
    const on = () => setOnline(navigator.onLine);
    addEventListener('online', on);
    addEventListener('offline', on);
    return () => {
      removeEventListener('online', on);
      removeEventListener('offline', on);
    };
  }, []);

  const fr = (voices ?? []).filter((v) => v.lang.toLowerCase().startsWith('fr'));
  const scr = `${screen.width} × ${screen.height} (échelle ${devicePixelRatio}), fenêtre ${innerWidth} × ${innerHeight}`;

  return (
    <main class="ui-diag">
      <header class="ui-diag-head">
        <button class="ui-btn" onClick={onBack}>
          ← Retour
        </button>
        <h1>Diagnostic de la tablette</h1>
      </header>
      <table class="ui-table">
        <tbody>
          <Row label="Version" value={__APP_VERSION__} />
          <Row label="Réseau" value={online ? 'En ligne' : 'Hors ligne'} />
          <Row label="Mode hors ligne" value={offlineReady.value ? 'Prêt : le jeu marche sans réseau' : `En préparation (service worker ${swStatus.value})`} ok={offlineReady.value} />
          <Row label="Mise en veille" value={wakeLabel[wakeLockState.value] ?? wakeLockState.value} ok={wakeLockState.value === 'active'} />
          <Row
            label="Stockage persistant"
            value={storage === null ? 'Vérification…' : storage.persisted === null ? 'Inconnu' : storage.persisted ? 'Accordé : Edge ne l\'effacera pas' : 'Non accordé (installer l\'app aide à l\'obtenir)'}
            ok={storage?.persisted ?? null}
          />
          <Row label="Espace utilisé" value={storage?.usageMB != null ? `${storage.usageMB} Mo sur ${storage.quotaMB} Mo` : '—'} />
          <Row label="Test de sauvegarde" value={opens === null ? '…' : `Diagnostic ouvert ${opens} fois (le nombre doit augmenter après fermeture de l'app)`} ok={opens !== null} />
          <Row label="Écran" value={scr} />
        </tbody>
      </table>
      <h2>Voix vues par Edge</h2>
      <div class="ui-voice-actions">
        <button class="ui-btn ui-btn-small" onClick={refreshVoices}>
          Rafraîchir
        </button>
        <button class="ui-btn ui-btn-small" onClick={() => speak("Bonjour ! Je suis la voix par défaut de l'Arche des Savoirs.")}>
          Tester la voix par défaut
        </button>
      </div>
      {voices === null ? (
        <p>Recherche des voix (jusqu'à 10 secondes)…</p>
      ) : (
        <>
          <p class={fr.length > 0 ? 'ui-ok' : 'ui-ko'}>
            {'speechSynthesis' in globalThis ? `${voices.length} voix au total, dont ${fr.length} en français.` : 'Synthèse vocale absente de ce navigateur.'}
          </p>
          <ul class="ui-voices">
            {(fr.length > 0 ? fr : voices).map((v) => (
              <li key={v.name}>
                <span>
                  {v.name} <small>({v.lang}, {v.local ? 'hors ligne' : 'en ligne seulement'})</small>
                </span>
                <button class="ui-btn ui-btn-small" onClick={() => speak("Bonjour ! Je suis la voix de l'Arche des Savoirs.", v.name)}>
                  Écouter
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
