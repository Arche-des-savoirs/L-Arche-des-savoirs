// Widgets de réponse, tous utilisables au doigt (cibles ≥ 56 px).
import { useState } from 'preact/hooks';

/** Pavé numérique : évite le clavier Windows pour les réponses en nombre. */
export function NumberPad({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit: () => void }) {
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '−', '0', ','];
  return (
    <div class="ui-pad">
      <output class="ui-pad-screen" aria-label="Ta réponse">{value || ' '}</output>
      <div class="ui-pad-keys">
        {keys.map((k) => (
          <button key={k} class="ui-key" onClick={() => onChange(k === '−' ? (value.startsWith('−') ? value.slice(1) : '−' + value) : value + k)}>
            {k}
          </button>
        ))}
        <button class="ui-key ui-key-wide" onClick={() => onChange(value.slice(0, -1))} aria-label="Effacer">
          ⌫ Effacer
        </button>
        <button class="ui-key ui-key-wide ui-key-ok" onClick={onSubmit} disabled={!value}>
          Valider
        </button>
      </div>
    </div>
  );
}

/** QCM à 5 réponses. Au 2e essai, `wrong` signale le choix déjà tenté : il reste visible, barré et désactivé. */
export function Choices({ choices, onPick, disabled, wrong }: { choices: string[]; onPick: (c: string) => void; disabled?: boolean; wrong?: string }) {
  return (
    <div class="ui-choices">
      {choices.map((c) => (
        <button
          key={c}
          class={`ui-btn ui-choice${c === wrong ? ' ui-choice-barre' : ''}`}
          onClick={() => onPick(c)}
          disabled={disabled || c === wrong}
          aria-disabled={c === wrong}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

/** Ranger : on touche les étiquettes dans l'ordre voulu. */
export function Order({ choices, onSubmit }: { choices: string[]; onSubmit: (order: string[]) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const left = choices.filter((c) => !picked.includes(c));
  return (
    <div class="ui-order">
      <div class="ui-order-row" aria-label="Ton rangement">
        {picked.length === 0 ? <span class="ui-muted">Touche les étiquettes dans l'ordre.</span> : picked.map((c, i) => <span key={c} class="ui-chip ui-chip-set">{i + 1}. {c}</span>)}
      </div>
      <div class="ui-order-row">
        {left.map((c) => (
          <button key={c} class="ui-btn ui-chip" onClick={() => setPicked([...picked, c])}>
            {c}
          </button>
        ))}
      </div>
      <div class="ui-row">
        <button class="ui-btn" onClick={() => setPicked([])} disabled={picked.length === 0}>
          Recommencer
        </button>
        <button class="ui-btn ui-btn-main" onClick={() => onSubmit(picked)} disabled={left.length > 0}>
          Valider
        </button>
      </div>
    </div>
  );
}

export function TextAnswer({ onSubmit, multiline, optional }: { onSubmit: (v: string) => void; multiline?: boolean; optional?: boolean }) {
  const [v, setV] = useState('');
  return (
    <form
      class="ui-text-answer"
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim() || optional) onSubmit(v.trim());
      }}
    >
      {multiline ? (
        <textarea class="ui-input" rows={3} value={v} onInput={(e) => setV(e.currentTarget.value)} placeholder="Écris ta réponse ou dis-la à voix haute" aria-label="Ta réponse" />
      ) : (
        <input class="ui-input" value={v} onInput={(e) => setV(e.currentTarget.value)} aria-label="Ta réponse" autocomplete="off" autocapitalize="off" spellcheck={false} />
      )}
      <button class="ui-btn ui-btn-main" type="submit" disabled={!v.trim() && !optional}>
        {optional ? "J'ai répondu" : 'Valider'}
      </button>
    </form>
  );
}
