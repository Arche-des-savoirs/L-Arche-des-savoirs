// Création des avatars, une fille après l'autre, puis présentation du compagnon.
import { useState } from 'preact/hooks';
import { ACCESSORIES, COMPANIONS, DECORS, DEFAULT_PROFILE, EXPRESSIONS, NAMES, POSES, ROLES, type Accessory, type Decor, type Expression, type Pose, type Profile } from '../../engine/profile';
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
        <Card title={`${NAMES[p]}, ${ROLES[p]} : crée ton avatar`} wide>
          <div class="ui-avatar-editor">
            <Avatar player={p} profile={prof} size={240} label={`Avatar de ${NAMES[p]}`} />
            <div class="ui-avatar-options">
              <Picker label="Expression" options={EXPRESSIONS} value={prof.expression} onPick={(expression: Expression) => set({ expression })} />
              <Picker label="Pose" options={POSES} value={prof.pose} onPick={(pose: Pose) => set({ pose })} />
              <Picker label="Décor" options={DECORS} value={prof.decor} onPick={(decor: Decor) => set({ decor })} />
              <Picker label="Accessoire" options={ACCESSORIES} value={prof.accessory} onPick={(accessory: Accessory) => set({ accessory })} />
              <button class="ui-btn ui-btn-main" onClick={() => setPhase('compagnon')}>
                C'est moi !
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <Card title={`${NAMES[p]}, voici ton compagnon`} wide>
          <div class="ui-handover">
            <Avatar player={p} profile={prof} size={200} label={`Avatar de ${NAMES[p]}`} />
            <div>
              <p class="ui-companion" aria-hidden="true">
                {COMPANIONS[p].emoji}
              </p>
              <p class="ui-line">
                Plume prend la forme de <strong>{COMPANIONS[p].name}</strong>. Il t'accompagnera dans toute l'aventure.
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

function Picker<T extends string>({ label, options, value, onPick }: { label: string; options: Record<T, string>; value: T; onPick: (v: T) => void }) {
  return (
    <fieldset class="ui-fieldset">
      <legend>{label}</legend>
      <div class="ui-row ui-wrap">
        {(Object.keys(options) as T[]).map((o) => (
          <button key={o} class={`ui-btn ui-btn-small${value === o ? ' ui-selected' : ''}`} aria-pressed={value === o} onClick={() => onPick(o)}>
            {options[o]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
