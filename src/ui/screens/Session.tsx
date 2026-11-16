// Séance du jour : aiguille vers l'écran de l'étape courante. Chaque étape terminée est sauvegardée.
import { useEffect, useState } from 'preact/hooks';
import scene from '../../assets/scenes/porte-trois-lueurs.svg?raw';
import { NAMES } from '../../engine/profile';
import { chapter, currentStep, day, finishSession, nextStep, plan, route, save } from '../store';
import { Card, Dialogue } from '../parts/Common';
import { Tour } from '../parts/Tour';
import { Vote } from '../parts/Vote';
import { Concert } from '../parts/Concert';

function Pause({ text }: { text: string }) {
  const [left, setLeft] = useState(60);
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <Card title="⚡ Pause Éclair">
      <p class="ui-line">{text}</p>
      <p class="ui-timer" aria-live="polite">{left > 0 ? `${left} s` : 'Prêtes ?'}</p>
      <button class="ui-btn ui-btn-main" onClick={nextStep}>
        On reprend !
      </button>
    </Card>
  );
}

export function Session() {
  const ch = chapter.value;
  const d = day.value;
  const step = currentStep.value;
  const progress = save.value.progress;
  if (!ch || !d || !step || !progress) return null;
  const key = `${progress.step}`;
  const choice = save.value.game.choices.findLast((c) => c.chapter === ch.number);
  const phrase = ch.espagnol[(d.n - 1) % Math.max(1, ch.espagnol.length)];

  let body;
  switch (step.kind) {
    case 'ouverture':
      body = (
        <Card wide>
          <p class="ui-kicker">
            Chapitre {ch.number} · {ch.title}
          </p>
          <h2 class="ui-card-title">
            Jour {d.n} — {d.title}
          </h2>
          <p class="ui-decor">{d.decor}</p>
          <Dialogue lines={d.opening} onDone={nextStep} />
        </Card>
      );
      break;
    case 'espagnol':
      body = <Spanish key={key} es={phrase!.es} fr={phrase!.fr} />;
      break;
    case 'conseil':
      body = <Vote key={key} />;
      break;
    case 'convergence': {
      const opt = choice && ch.decision ? ch.decision.options[choice.result] : null;
      body = opt ? (
        <Card title={`Convergence : ${opt.label}`} wide>
          <Dialogue lines={[{ who: 'narrateur', text: opt.scene }, { who: opt.line.who, text: opt.line.text }]} onDone={nextStep} />
        </Card>
      ) : null;
      if (!opt) queueMicrotask(nextStep);
      break;
    }
    case 'manche': {
      const m = d.manches[step.manche]!;
      const opt = d.n === 5 && choice && ch.decision ? ch.decision.options[choice.result] : null;
      body = (
        <Card title={`Manche ${step.manche + 1} — ${m.title}`} wide>
          {m.intro && <p class="ui-line">{m.intro}</p>}
          {opt && <p class="ui-hint">Variante « {opt.label} » : {opt.habillage}</p>}
          <p class="ui-muted">Ordre de passage : {save.value.game.session!.turnOrder.map((p) => NAMES[p]).join(', ')}.</p>
          <button class="ui-btn ui-btn-main" onClick={nextStep}>
            Commencer la manche
          </button>
        </Card>
      );
      break;
    }
    case 'tour':
      body = <Tour key={key} mancheIndex={step.manche} player={step.player} />;
      break;
    case 'pause':
      body = <Pause key={key} text={d.pause} />;
      break;
    case 'concert':
      body = <Concert key={key} />;
      break;
    case 'cloture':
      body = (
        <Card wide>
          <h2 class="ui-card-title">Fin du jour {d.n}</h2>
          <Dialogue lines={d.closing} onDone={finishSession} doneLabel="Terminer la séance" />
          {d.reward && <p class="ui-reward">🏅 Récompense : {d.reward}</p>}
        </Card>
      );
      break;
  }

  return (
    <main class="ui-session">
      <div class="ui-scene ui-scene-dim" dangerouslySetInnerHTML={{ __html: scene }} />
      <header class="ui-session-bar">
        <button class="ui-btn ui-btn-small" onClick={() => (route.value = 'accueil')}>
          ⌂ Accueil
        </button>
        <span>
          Chapitre {ch.number} · Jour {d.n}
        </span>
        <progress max={plan.value.length} value={progress.step + 1} aria-label="Avancement de la séance" />
      </header>
      <div class="ui-session-body">{body}</div>
    </main>
  );
}

function Spanish({ es, fr }: { es: string; fr: string }) {
  const [shown, setShown] = useState(false);
  return (
    <Card title="La phrase de Rafaelle 🇪🇸">
      <p class="ui-muted">Rafaelle, l'Archiviste, lit la phrase des anciens à voix haute.</p>
      <p class="ui-spanish" lang="es">
        {es}
      </p>
      {shown ? <p class="ui-line">« {fr} »</p> : <p class="ui-muted">Ses sœurs devinent ce que ça veut dire !</p>}
      <div class="ui-row">
        {!shown && (
          <button class="ui-btn" onClick={() => setShown(true)}>
            Voir la traduction
          </button>
        )}
        <button class="ui-btn ui-btn-main" onClick={nextStep}>
          Continuer
        </button>
      </div>
    </Card>
  );
}
