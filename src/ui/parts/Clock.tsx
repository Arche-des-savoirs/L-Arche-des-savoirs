// Horloge à aiguilles pour les questions de durée (« 14:45 »).
export function Clock({ time, size = 170 }: { time: string; size?: number }) {
  const [h, m] = time.split(':').map(Number) as [number, number];
  const minA = m * 6;
  const hourA = ((h % 12) + m / 60) * 30;
  return (
    <svg viewBox="-60 -60 120 120" width={size} height={size} role="img" aria-label={`Horloge : ${h} h ${String(m).padStart(2, '0')}`} class="ui-clock">
      <circle r="56" fill="#f3f1e6" stroke="#f4c95d" stroke-width="4" />
      {Array.from({ length: 12 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 30})`}>
          <line y1="-50" y2={i % 3 ? -45 : -42} stroke="#1a2145" stroke-width={i % 3 ? 1.5 : 3} />
          <text y="-33" text-anchor="middle" dominant-baseline="middle" font-size="9" fill="#1a2145" transform={`rotate(${-i * 30} 0 -33)`}>
            {i === 0 ? 12 : i}
          </text>
        </g>
      ))}
      <line y2="-26" stroke="#1a2145" stroke-width="5" stroke-linecap="round" transform={`rotate(${hourA})`} />
      <line y2="-44" stroke="#c0392b" stroke-width="3" stroke-linecap="round" transform={`rotate(${minA})`} />
      <circle r="4" fill="#1a2145" />
    </svg>
  );
}
