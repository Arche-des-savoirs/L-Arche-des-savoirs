// Page de rupture pure : fond noir, texte doré en fondu lent, police « épique » (Cinzel) pour un
// rendu magique. Utilisée pour la dédicace (tout début de l'aventure) et le mot de la fin (après
// la dernière fin). Aucune voix : ce sont des mots de Hasina, pas une réplique du conte.
export function MagicPage({ text, onDone, cta = 'Continuer' }: { text: string; onDone: () => void; cta?: string }) {
  return (
    <main class="ui-magic-page">
      <p class="ui-magic-text">{text}</p>
      <button class="ui-btn ui-btn-main ui-magic-cta" onClick={onDone}>
        {cta}
      </button>
    </main>
  );
}
