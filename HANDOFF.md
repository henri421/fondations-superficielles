# HANDOFF : T5 et T6 (fondations-superficielles)

## T5 et T6 : noyau

- **Fichiers modifiés** : `src/semelle.ts`, `src/index.ts` ; `tests/audit.test.ts` ajouté à l'audit.
- **Décisions** : un seul déroulé `verifierSemelle`, configuré par génération. Facteurs nuls dans les cas dégénérés, car les tests lisent `facteurs` sans garde.
- **Terminé à la main** : l'exécutant a atteint 45 tours avec les tests verts, sans commit, sans ce fichier, avec 6 erreurs de typage.
- **Écart corrigé à l'audit** : le plafond 0,4 N_rep était appliqué sans condition ; EN 1997-3 (5.15) le réserve aux cas où de l'eau ou de l'air peut atteindre l'interface. Mon plan était ambigu.
- **Points douteux** : `verifierSaisie` ne refuse pas phi ≤ 0 ou cu ≤ 0 ; le refus vient de `sol-ec7`, et seulement quand la portance est calculée.
- **Statut des tests** : banc sans filtre et typecheck, relancés à l'audit.

## T1 interface : page, saisie, câblage

- **Fichiers modifiés** : `app/index.html`, `app/src/form.ts`, `app/src/main.ts`.
- **Décisions** : `verifier` tire les coefficients de `combinaisons1g` et `combinaisons2g`, avec le même profil que le calcul.
- **Terminé à la main** : l'exécutant s'est arrêté au 16e tour, solde DeepSeek épuisé (erreur 402), sans commit ni ce fichier. Il restait `verifier`, qui lisait `r.coefficients`, absent du noyau.
- **Points douteux** : page pas encore vue dans le navigateur ; `vue.ts`, `dessin.ts` et `note.ts` sont encore des squelettes.
- **Statut des tests** : `form.test` 24/24, `page.test` 12/12, typage sans erreur.
