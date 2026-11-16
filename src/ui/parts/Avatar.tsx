// Avatar dessiné en SVG : peau marron et longs cheveux noirs fixes ; coiffure, broderie de cape et accessoire au choix.
import { CAPE_COLORS, LUEURS, type Profile } from '../../engine/profile';
import type { PlayerId } from '../../engine/types';

const SKIN = '#8a5a3c';
const SKIN_SHADE = '#74492f';
const HAIR = '#15100e';
const SCALE: Record<PlayerId, number> = { axelle: 0.86, maelle: 0.93, rafaelle: 1 };

export function Avatar({ player, profile, size = 180, label }: { player: PlayerId; profile: Profile; size?: number; label?: string }) {
  const k = SCALE[player];
  const trim = CAPE_COLORS[profile.cape];
  const glow = LUEURS[player];
  return (
    <svg viewBox="0 0 200 240" width={size} height={size * 1.2} role="img" aria-label={label ?? 'Avatar'} class="ui-avatar">
      <defs>
        <radialGradient id={`lueur-${player}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stop-color={glow} stop-opacity=".55" />
          <stop offset="100%" stop-color={glow} stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="110" r="100" fill={`url(#lueur-${player})`} />
      <g transform={`translate(100 236) scale(${k}) translate(-100 -236)`}>
        {/* Cheveux de dos : longs, noirs */}
        {profile.hair === 'laches' && <path d="M52 92 Q44 170 60 205 L140 205 Q156 170 148 92 Z" fill={HAIR} />}
        {profile.hair === 'queue' && <path d="M128 70 Q172 96 160 190 Q152 210 140 196 Q150 140 120 90 Z" fill={HAIR} />}
        {/* Cape */}
        <path d="M58 150 Q100 128 142 150 L166 236 L34 236 Z" fill="#2a3470" />
        <path d="M58 150 Q100 128 142 150 L166 236 L156 236 L134 158 Q100 142 66 158 L44 236 L34 236 Z" fill={trim} />
        <path d="M80 236 L100 176 L120 236" fill="none" stroke={trim} stroke-width="3" stroke-dasharray="4 5" />
        {/* Cou et visage */}
        <rect x="90" y="128" width="20" height="22" rx="6" fill={SKIN_SHADE} />
        <ellipse cx="100" cy="100" rx="40" ry="44" fill={SKIN} />
        {/* Frange et dessus de la tête */}
        <path d="M58 98 Q56 52 100 50 Q144 52 142 98 Q130 72 104 70 Q88 82 62 100 Z" fill={HAIR} />
        {profile.hair === 'tresse' && (
          <g fill={HAIR}>
            <path d="M136 92 Q150 110 140 130" stroke={HAIR} stroke-width="14" fill="none" stroke-linecap="round" />
            {[138, 156, 174, 192].map((y, i) => (
              <ellipse key={y} cx={i % 2 ? 136 : 140} cy={y} rx="11" ry="10" />
            ))}
            <circle cx="138" cy="206" r="5" fill={trim} />
          </g>
        )}
        {profile.hair === 'laches' && <path d="M60 96 Q54 130 64 150 L72 148 Q64 122 68 100 Z M140 96 Q146 130 136 150 L128 148 Q136 122 132 100 Z" fill={HAIR} />}
        {/* Yeux, joues, sourire */}
        <ellipse cx="85" cy="104" rx="5.5" ry="7" fill="#1a1110" />
        <ellipse cx="115" cy="104" rx="5.5" ry="7" fill="#1a1110" />
        <circle cx="87" cy="101" r="2" fill="#fff" />
        <circle cx="117" cy="101" r="2" fill="#fff" />
        <ellipse cx="76" cy="118" rx="7" ry="4" fill="#c9705a" opacity=".55" />
        <ellipse cx="124" cy="118" rx="7" ry="4" fill="#c9705a" opacity=".55" />
        <path d="M90 124 Q100 132 110 124" stroke="#3b1f18" stroke-width="3" fill="none" stroke-linecap="round" />
        {/* Accessoire */}
        {profile.accessory === 'etoile' && <path d="M70 70 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1 Z" fill="#f4c95d" stroke="#fff3c4" stroke-width="1" />}
        {profile.accessory === 'noeud' && (
          <g fill={trim} stroke="#1a2145" stroke-width="1">
            <path d="M120 62 l-14 -10 v20 Z" />
            <path d="M120 62 l14 -10 v20 Z" />
            <circle cx="120" cy="62" r="4" />
          </g>
        )}
        {profile.accessory === 'fleur' && (
          <g>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="68" cy="66" rx="5" ry="9" fill="#f5a3c7" transform={`rotate(${a} 68 76)`} />
            ))}
            <circle cx="68" cy="76" r="4" fill="#f4c95d" />
          </g>
        )}
        {/* Lanterne */}
        <g transform="translate(150 178)">
          <line x1="0" y1="-14" x2="0" y2="-4" stroke="#c9a54a" stroke-width="2" />
          <rect x="-9" y="-4" width="18" height="24" rx="5" fill={glow} stroke="#c9a54a" stroke-width="2" />
        </g>
      </g>
    </svg>
  );
}
