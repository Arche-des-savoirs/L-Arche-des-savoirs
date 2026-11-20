// Avatar dessiné en SVG : peau marron et cheveux noirs fixes par sœur (coiffure + couleur
// cape/lanterne = canon, non modifiables — voir profile.ts). Personnalisable : expression, pose,
// décor de fond, accessoire.
import { HAIR_BY_PLAYER, LUEURS, type Decor, type Expression, type Pose, type Profile } from '../../engine/profile';
import type { PlayerId } from '../../engine/types';

const SKIN = '#8a5a3c';
const SKIN_SHADE = '#74492f';
const HAIR = '#15100e';
const SCALE: Record<PlayerId, number> = { axelle: 0.86, maelle: 0.93, rafaelle: 1 };

export function Avatar({ player, profile, size = 180, label }: { player: PlayerId; profile: Partial<Profile>; size?: number; label?: string }) {
  const k = SCALE[player];
  const hair = HAIR_BY_PLAYER[player];
  const glow = LUEURS[player]; // couleur canon : cape ET lanterne
  const expression: Expression = profile.expression ?? 'souriant';
  const pose: Pose = profile.pose ?? 'debout';
  const decor: Decor = profile.decor ?? 'aucun';
  const accessory = profile.accessory ?? 'aucun';
  const brasCroises = pose === 'bras-croises';
  const lanterneLevee = pose === 'lanterne-levee';

  return (
    <svg viewBox="0 0 200 240" width={size} height={size * 1.2} role="img" aria-label={label ?? 'Avatar'} class="ui-avatar">
      <defs>
        <radialGradient id={`lueur-${player}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stop-color={glow} stop-opacity=".55" />
          <stop offset="100%" stop-color={glow} stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="110" r="100" fill={`url(#lueur-${player})`} />
      <Decoration decor={decor} />
      <g transform={`translate(100 236) scale(${k}) translate(-100 -236)`}>
        {/* Cheveux de dos */}
        {hair === 'lisse-epaules' && <path d="M52 92 Q44 170 60 205 L140 205 Q156 170 148 92 Z" fill={HAIR} />}
        {hair === 'bouclee-epaules' && (
          <g fill={HAIR}>
            <path d="M52 94 Q44 168 60 206 L140 206 Q156 168 148 94 Z" />
            {[62, 82, 118, 138].map((x) => (
              <circle key={x} cx={x} cy={188 + (x === 82 || x === 118 ? 10 : 0)} r="13" />
            ))}
          </g>
        )}
        {hair === 'lisse-longue' && <path d="M54 92 Q40 190 58 232 L142 232 Q160 190 146 92 Z" fill={HAIR} />}
        {/* Cape (couleur = lanterne, canon par sœur) */}
        <path d="M58 150 Q100 128 142 150 L166 236 L34 236 Z" fill="#2a3470" />
        <path d="M58 150 Q100 128 142 150 L166 236 L156 236 L134 158 Q100 142 66 158 L44 236 L34 236 Z" fill={glow} />
        <path d="M80 236 L100 176 L120 236" fill="none" stroke={glow} stroke-width="3" stroke-dasharray="4 5" />
        {/* Bras croisés (pose) */}
        {brasCroises && <path d="M70 160 Q100 178 130 160 L120 186 Q100 196 80 186 Z" fill={SKIN} stroke={SKIN_SHADE} stroke-width="2" />}
        {/* Cou et visage */}
        <rect x="90" y="128" width="20" height="22" rx="6" fill={SKIN_SHADE} />
        <ellipse cx="100" cy="100" rx="40" ry="44" fill={SKIN} />
        {/* Frange et dessus de la tête */}
        <path d="M58 98 Q56 52 100 50 Q144 52 142 98 Q130 72 104 70 Q88 82 62 100 Z" fill={HAIR} />
        {hair === 'bouclee-epaules' && (
          <g fill={HAIR}>
            <circle cx="60" cy="96" r="10" />
            <circle cx="140" cy="96" r="10" />
          </g>
        )}
        {(hair === 'lisse-epaules' || hair === 'lisse-longue') && (
          <path d="M60 96 Q54 130 64 150 L72 148 Q64 122 68 100 Z M140 96 Q146 130 136 150 L128 148 Q136 122 132 100 Z" fill={HAIR} />
        )}
        {/* Expression : yeux, sourcils, sourire */}
        <Visage expression={expression} />
        {/* Accessoire */}
        {accessory === 'etoile' && <path d="M70 70 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1 Z" fill="#f4c95d" stroke="#fff3c4" stroke-width="1" />}
        {accessory === 'noeud' && (
          <g fill={glow} stroke="#1a2145" stroke-width="1">
            <path d="M120 62 l-14 -10 v20 Z" />
            <path d="M120 62 l14 -10 v20 Z" />
            <circle cx="120" cy="62" r="4" />
          </g>
        )}
        {accessory === 'fleur' && (
          <g>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="68" cy="66" rx="5" ry="9" fill="#f5a3c7" transform={`rotate(${a} 68 76)`} />
            ))}
            <circle cx="68" cy="76" r="4" fill="#f4c95d" />
          </g>
        )}
        {/* Lanterne : tenue haut si pose "lanterne levée", sinon au côté */}
        <g transform={lanterneLevee ? 'translate(150 100)' : 'translate(150 178)'}>
          <line x1="0" y1="-14" x2="0" y2="-4" stroke="#c9a54a" stroke-width="2" />
          <rect x="-9" y="-4" width="18" height="24" rx="5" fill={glow} stroke="#c9a54a" stroke-width="2" />
        </g>
      </g>
    </svg>
  );
}

function Visage({ expression }: { expression: Expression }) {
  return (
    <g>
      <ellipse cx="85" cy="104" rx="5.5" ry={expression === 'emerveille' ? 9 : 7} fill="#1a1110" />
      <ellipse cx="115" cy="104" rx="5.5" ry={expression === 'emerveille' ? 9 : 7} fill="#1a1110" />
      <circle cx="87" cy="101" r="2" fill="#fff" />
      <circle cx="117" cy="101" r="2" fill="#fff" />
      {expression === 'determine' && (
        <>
          <path d="M76 92 Q85 87 94 92" stroke="#15100e" stroke-width="2.5" fill="none" stroke-linecap="round" />
          <path d="M106 92 Q115 87 124 92" stroke="#15100e" stroke-width="2.5" fill="none" stroke-linecap="round" />
        </>
      )}
      <ellipse cx="76" cy="118" rx="7" ry="4" fill="#c9705a" opacity=".55" />
      <ellipse cx="124" cy="118" rx="7" ry="4" fill="#c9705a" opacity=".55" />
      {expression === 'souriant' && <path d="M88 124 Q100 134 112 124" stroke="#3b1f18" stroke-width="3" fill="none" stroke-linecap="round" />}
      {expression === 'determine' && <path d="M90 126 L110 126" stroke="#3b1f18" stroke-width="3" fill="none" stroke-linecap="round" />}
      {expression === 'emerveille' && <ellipse cx="100" cy="126" rx="7" ry="6" fill="#3b1f18" />}
    </g>
  );
}

function Decoration({ decor }: { decor: Decor }) {
  if (decor === 'aucun') return null;
  if (decor === 'etoiles') {
    return (
      <g fill="#f4c95d" opacity=".8">
        {[[20, 30], [175, 50], [25, 190], [180, 170], [100, 14]].map(([x, y]) => (
          <path key={`${x}-${y}`} transform={`translate(${x} ${y})`} d="M0 -6 1.5 -1.5 6 0 1.5 1.5 0 6 -1.5 1.5 -6 0 -1.5 -1.5 Z" />
        ))}
      </g>
    );
  }
  if (decor === 'brume') {
    return (
      <g fill="#f4c95d" opacity=".18">
        <ellipse cx="40" cy="60" rx="50" ry="20" />
        <ellipse cx="160" cy="190" rx="60" ry="24" />
      </g>
    );
  }
  // livres flottants
  return (
    <g opacity=".85">
      {[[24, 44, -14], [172, 36, 10], [20, 196, 8], [178, 188, -10]].map(([x, y, r]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${r})`}>
          <rect x="-11" y="-8" width="22" height="16" rx="2" fill="#8c6a3f" />
          <rect x="-9" y="-6" width="18" height="12" rx="1" fill="#f4ead2" />
        </g>
      ))}
    </g>
  );
}
