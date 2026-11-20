// Avatar = buste illustré par IA (voir docs/prompts-avatars-bustes.md), choisi parmi plusieurs
// variantes par sœur. Remplace l'ancien dessin SVG procédural.
import { bustImage } from '../../content/images';
import { LUEURS, type Profile } from '../../engine/profile';
import type { PlayerId } from '../../engine/types';

export function Avatar({ player, profile, size = 180, label }: { player: PlayerId; profile: Partial<Profile>; size?: number; label?: string }) {
  const glow = LUEURS[player];
  const bust = profile.bust ?? 1;
  return (
    <span class="ui-avatar-bust" style={{ width: `${size}px`, height: `${size}px`, boxShadow: `0 0 0 3px ${glow}, 0 0 24px ${glow}66` }}>
      <img src={bustImage(player, bust)} width={size} height={size} alt={label ?? 'Avatar'} class="ui-avatar" />
    </span>
  );
}
