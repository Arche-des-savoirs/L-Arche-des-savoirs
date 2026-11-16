// Notes de musique en SVG (pas de police musicale sur la tablette) : 4 ronde, 2 blanche, 1 noire, 0,5 croche.
export const NOTE_NAMES: Record<number, string> = { 4: 'Ronde', 2: 'Blanche', 1: 'Noire', 0.5: 'Croche' };

export function Note({ value, size = 64 }: { value: number; size?: number }) {
  const hollow = value >= 2;
  return (
    <svg viewBox="0 0 40 60" width={size * 0.66} height={size} role="img" aria-label={NOTE_NAMES[value] ?? 'Note'}>
      <ellipse cx="16" cy="48" rx="10" ry="7" transform="rotate(-20 16 48)" fill={hollow ? 'none' : 'currentColor'} stroke="currentColor" stroke-width="3" />
      {value < 4 && <line x1="25" y1="45" x2="25" y2="6" stroke="currentColor" stroke-width="3" />}
      {value === 0.5 && <path d="M25 6 Q38 16 34 30" fill="none" stroke="currentColor" stroke-width="3" />}
    </svg>
  );
}
