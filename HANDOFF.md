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

## T2 interface : verdicts, volets, textes

- **Fichiers modifiés** : `app/src/vue.ts`, `app/src/textes.ts`.
- **Décisions** : cartes ELU prises sur `tauxMax` (ordre de `Object.keys`), pire cas par verification ; `depasse` dès qu'un taux dépasse 1, est non fini, ou qu'une analyse a une résultante hors base ou un N' ≤ 0 (soulèvement, dit en clair) ; tassement sans jauge ; coefficients affichés depuis `r.coefficients` avec leur source.
- **Points douteux** :
  - Excentricité 1re : B reconstruit comme B' + 2 e_B, exact en général mais faux si les dimensions sont permutées (B' ≤ L'), car `Resultat` ne porte pas B.
  - Pression du tassement : libellé « Pression », sans distinguer nette et brute (non portée par `Resultat`).
  - Forme de `r.coefficients` et des tranches de tassement (`sCentre_mm`, `sCoin_mm`, `regime`) vérifiée par sondage, pas dans les sources lues ; le typage passe.
  - Phrases du noyau : `phrase` est l'identité, aucune traduction anglaise (T5).
  - `D_lower` retiré : aucun champ équivalent dans le noyau de fondations.
- **Statut des tests** :
  - `lancer.mjs . vue.test` : 119/119.
  - Sans filtre : 25 réussis, 69 échecs ; `form.test` échoue seulement sur les stubs `a ecrire` de `dessin.ts` (T3) ; `anglais.test` (T5) échoue ; `page.test` vert.
  - `typecheck.mjs .` : 0 erreur (TypeScript 6.0.3).
- **Audit (Claude)** : excentricité corrigée, `Resultat` porte maintenant la largeur nominale `B` (ajoutée par `verifier`), et la carte l'utilise. Le bilan sans filtre est faussé tant que `dessin.ts` lève au chargement : les fichiers lancés un par un sont verts (`vue.test` 119, `form.test` 24, `page.test` 12, noyau 40).
