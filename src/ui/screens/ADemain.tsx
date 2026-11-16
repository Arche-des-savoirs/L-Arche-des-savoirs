// Fin de séance : bilan du jour et rendez-vous du lendemain.
import { chapterOf } from '../../content/chapters';
import { sessionSummary } from '../../engine/session';
import { PLAYERS } from '../../engine/types';
import { NAMES } from '../../engine/profile';
import { lastError, route, save } from '../store';
import { Card, PlayerAvatar } from '../parts/Common';

export function ADemain() {
  const { game, progress } = save.value;
  const done = progress && (progress.chapter !== game.position.chapter || progress.day !== game.position.day) ? progress : null;
  const summary = done ? sessionSummary(done.results) : null;
  const doneDay = done ? chapterOf(done.chapter)?.days.find((d) => d.n === done.day) : undefined;
  const next = chapterOf(game.position.chapter);
  return (
    <main class="ui-page">
      <Card title="À demain, apprenties ! 🌙" wide>
        {lastError.value && <p class="ui-line">{lastError.value}</p>}
        {summary && (
          <div class="ui-summary">
            {PLAYERS.map((p) => (
              <div key={p} class="ui-summary-cell">
                <PlayerAvatar player={p} size={110} />
                <strong>{NAMES[p]}</strong>
                <span>
                  {summary[p].justes} réussite{summary[p].justes > 1 ? 's' : ''} sur {summary[p].total}
                </span>
              </div>
            ))}
          </div>
        )}
        {doneDay?.reward && <p class="ui-reward">🏅 Gagné aujourd'hui : {doneDay.reward}</p>}
        <p class="ui-line">
          Prochaine séance : chapitre {game.position.chapter}
          {next ? ` (${next.title})` : ''}, jour {game.position.day}. L'Arche se rallume demain à partir de 5 h.
        </p>
        <button class="ui-btn ui-btn-main" onClick={() => (route.value = 'accueil')}>
          Retour à l'accueil
        </button>
      </Card>
    </main>
  );
}

export function Bientot() {
  return (
    <main class="ui-page">
      <Card title="La suite se prépare 🛠️">
        <p class="ui-line">Le chapitre {save.value.game.position.chapter} arrive bientôt dans l'Arche.</p>
        <button class="ui-btn ui-btn-main" onClick={() => (route.value = 'accueil')}>
          Retour à l'accueil
        </button>
      </Card>
    </main>
  );
}
