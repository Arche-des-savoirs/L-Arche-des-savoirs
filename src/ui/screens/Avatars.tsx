// Création des avatars, une fille après l'autre, puis présentation du compagnon.
// L'avatar est un buste illustré par IA (voir docs/prompts-avatars-bustes.md), choisi parmi
// plusieurs variantes par sœur (BUST_COUNT) — plus de personnalisation procédurale.
import { useState } from 'preact/hooks';
import { bustImage, companionImage } from '../../content/images';
import { BUST_COUNT, COMPANION_IMAGE_READY, COMPANIONS, DEFAULT_PROFILE, NAMES, ROLES, type Profile } from '../../engine/profile';
import { PLAYERS, type PlayerId } from '../../engine/types';
import { route, save, saveProfiles, startOrResume } from '../store';
import { Avatar } from '../parts/Avatar';
import { Card } from '../parts/Common';

export function Avatars() {
  const [profiles, setProfiles] = useState<Record<PlayerId, Profile>>(save.value.profiles ?? DEFAULT_PROFILE);
  const firstTodo = PLAYERS.findIndex((p) => !profiles[p].companionConfirmed);
  const [k, setK] = useState(Math.max(0, firstTodo));
  const [phase, setPhase] = useState<'look' | 'compagnon'>('look');
  const p = PLAYERS[k]!;
  const prof = profiles[p];
  const set = (patch: Partial<Profile>) => setProfiles({ ...profiles, [p]: { ...prof, ...patch } });
  const count = BUST_COUNT[p];

  const confirm = () => {
    const next = { ...profiles, [p]: { ...prof, companionConfirmed: true } };
    setProfiles(next);
    saveProfiles(next);
    if (k + 1 < PLAYERS.length) {
      setK(k + 1);
      setPhase('look');
    } else startOrResume();
  };

  return (
    <main class="ui-page">
      <header class="ui-session-bar">
        <button class="ui-btn ui-btn-small" onClick={() => (route.value = 'accueil')}>
          ⌂ Accueil
        </button>
        <span>Les apprenties · {k + 1} sur 3</span>
      </header>
      {phase === 'look' ? (
        <Card title={`${NAMES[p]}, ${ROLES[p]} : choisis ton avatar`}>
          <div class="ui-avatar-editor">
            <Avatar player={p} profile={prof} size={130} label={`Avatar de ${NAMES[p]}`} />
            <div class="ui-avatar-options">
              {count > 0 ? (
                <fieldset class="ui-fieldset">
                  <legend>Choisis ton visage</legend>
                  <div class="ui-bust-grid">
                    {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        class={`ui-bust-option${prof.bust === n ? ' ui-selected' : ''}`}
                        aria-pressed={prof.bust === n}
                        aria-label={`Visage ${n}`}
                        onClick={() => set({ bust: n })}
                      >
                        <img src={bustImage(p, n)} alt="" />
                      </button>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <p class="ui-line">Les visages de {NAMES[p]} arrivent bientôt !</p>
              )}
              <button class="ui-btn ui-btn-main" onClick={() => setPhase('compagnon')}>
                C'est moi !
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <Card title={`${NAMES[p]}, voici ton compagnon`}>
          <div class="ui-handover">
            <Avatar player={p} profile={prof} size={110} label={`Avatar de ${NAMES[p]}`} />
            {COMPANION_IMAGE_READY[p] ? (
              <img src={companionImage(p)} alt={COMPANIONS[p].name} class="ui-companion-img" />
            ) : (
              <p class="ui-companion" aria-hidden="true">
                {COMPANIONS[p].emoji}
              </p>
            )}
            <div>
              <p class="ui-line">
                Plume prend la forme d'<strong>{COMPANIONS[p].indef}</strong>. Il t'accompagnera dans toute l'aventure.
              </p>
              <div class="ui-row">
                <button class="ui-btn" onClick={() => setPhase('look')}>
                  ← Modifier l'avatar
                </button>
                <button class="ui-btn ui-btn-main" onClick={confirm}>
                  Bienvenue, {COMPANIONS[p].name} !
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </main>
  );
}
