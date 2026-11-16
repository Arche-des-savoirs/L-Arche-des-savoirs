# L'Arche des Savoirs

Jeu narratif ludo-éducatif (PWA hors ligne) pour trois joueuses (CE1, CM1, 6e), joué sur une Surface Go 3 avec Edge.

Version en ligne : https://arche-des-savoirs.github.io/L-Arche-des-savoirs/

## Développement

```bash
npm ci
npm run dev          # serveur local
npm run typecheck    # TypeScript
npm test             # tests unitaires (Vitest)
npm run test:e2e     # parcours au format Surface Go 3 (Playwright)
npm run build        # build de production (dist/)
npm run icons        # régénère les icônes PNG depuis public/icons/icon.svg
```

## Installer sur la Surface

1. Ouvrir l'adresse ci-dessus dans Edge.
2. Menu « … » → **Applications** → **Installer ce site en tant qu'application**.
3. Lancer « Arche » depuis le menu Démarrer, puis ouvrir **Diagnostic** : mode hors ligne prêt, mise en veille bloquée, stockage persistant accordé, voix françaises listées.
