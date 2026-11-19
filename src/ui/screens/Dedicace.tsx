// Page de dédicace : montrée une seule fois, juste avant le tout premier jour de l'aventure
// (après la création des avatars, voir startOrResume dans ../store). Fond noir, texte doré,
// fondu lent — voir src/ui/parts/MagicPage.tsx.
import { startOrResume } from '../store';
import { MagicPage } from '../parts/MagicPage';

export function Dedicace() {
  return <MagicPage text="À mes filles Rafaelle, Maelle et Axelle…" onDone={() => startOrResume()} />;
}
