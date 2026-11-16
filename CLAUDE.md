# Règles du dépôt — L'Arche des Savoirs

- Langue : français partout (code commenté, UI, commits, PR).
- Aucun merge sans la phrase explicite de Hasina « merge la #N ». Une PR = un sujet, testée et accompagnée de captures.
- Cible : Surface Go 3, Windows 11 Famille en mode S, Edge, fenêtre CSS mesurée 1239 × 775 à l'échelle 1,55 (app installée), tactile.
- Hors ligne d'abord : aucune requête réseau pendant une partie. Contenu et images précachés par le service worker.
- Architecture : `src/engine` est un moteur pur sans UI ni stockage ; `src/ui` affiche l'état ; `src/storage` (Dexie) ; `src/platform` (Wake Lock, voix, horloge).
- Avant toute PR : `npm run typecheck`, `npm test`, `npm run test:e2e` verts.
- Référence de conception : doc « Architecture technique v1 » et Plan narratif v2 (docs Claude du projet).
