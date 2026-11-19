// Saisie d'un code à 4 chiffres (accès parent, changement de code).
import { useState } from 'preact/hooks';

export function PinPad({ title, onSubmit, onCancel, error }: { title: string; onSubmit: (pin: string) => void; onCancel: () => void; error?: string | null }) {
  const [pin, setPin] = useState('');
  const press = (d: string) => {
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      onSubmit(next);
      setPin('');
    }
  };
  return (
    <div class="ui-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div class="ui-card ui-pin">
        <h2 class="ui-card-title">{title}</h2>
        <div class="ui-pin-dots" aria-label={`${pin.length} chiffre(s) saisi(s)`}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} class={`ui-pin-dot${i < pin.length ? ' ui-pin-dot-on' : ''}`} />
          ))}
        </div>
        {error && (
          <p class="ui-feedback ui-ko" role="alert">
            {error}
          </p>
        )}
        <div class="ui-pad-keys ui-pin-keys">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} class="ui-key" onClick={() => press(d)}>
              {d}
            </button>
          ))}
          <button class="ui-key ui-key-cancel" onClick={onCancel} aria-label="Annuler">
            ✕
          </button>
          <button class="ui-key" onClick={() => press('0')}>
            0
          </button>
          <button class="ui-key" onClick={() => setPin(pin.slice(0, -1))} aria-label="Effacer">
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
