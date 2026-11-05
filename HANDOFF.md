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

## T3 interface : dessins

**Fichiers modifiés** : `app/src/dessin.ts` (vuesDisponibles, vueGouvernante, coupe, planSvg), `app/src/textes.ts` (clé `vue.dessin` et `unites.m2`, FR et EN), `app/src/style.css` (règles ajoutées en fin de fichier pour les classes du dessin).

**Décisions**
- Largeur selon B : parmi `Bp` et `Lp`, celle la plus proche de `B - 2 e_B` se lit selon B, l'autre donne la longueur efficace. Nécessaire pour le test 2e (Bp du noyau) et pour le cas permuté.
- Rectangle sur B' tracé sous la base, aligné sur le bord droit de la semelle (comme la maquette), épaisseur 0,5 e. Sa hauteur n'est pas une grandeur réelle.
- Nappe au-delà de D + 2,5 m tracée à cette profondeur, libellé avec la valeur réelle et « au-delà du dessin ».
- Cas dégénérés (soulèvement, hors base, non calculable) : pas de surface efficace, messages de `vue.alertes`.

**Points douteux**
- `Bd` (2e génération) non utilisé : `semelle.ts` n'a été lu que jusqu'à la ligne 210. Le choix de la largeur ci-dessus contourne le problème sans le résoudre.
- Couleur de la nappe : le jeton `--eau` de la maquette n'existe pas dans `style.css`, j'ai pris `--compression`.
- Contrôle visuel du rendu (T3 le prévoit) non fait.

**Statut des tests**
- `dessin.test` : 49/49 réussis.
- `vue.test` 119/119, `form.test` 24/24, `page.test` 12/12 : verts.
- `typecheck` : 1 erreur, dans `app/src/note.ts:143` (`avertissements` absent de `Resultat`), donc T4. Aucune erreur dans `dessin.ts`.

## T4 interface : note et exports

**Fichiers modifiés** : `app/src/note.ts` (noteDuCalcul), `app/src/export.ts` (STYLES_TRACE), `app/src/textes.ts` (clés racine `note` et `note.alertes`, FR et EN). Rien d'autre.

**Décisions**
- Sections de la note rangées par symbole : charges (V, H, M), hypothèses (génération, approche, classe, dimensions, profondeur, D_w), géométrie (B, L, D, e_s, γ_béton), matériaux pour le reste (sol, tassement, couches).
- Calculs : `blocsResultat(r).slice(1)`, en écartant le premier bloc (« Résultats »), qui affiche des clés brutes (`portanceDrainee`) ; les coefficients partiels suivent, un bloc par combinaison, avec leur source.
- Alertes : le noyau porte `r.alertes` (clés `hors_base`, `soulevement`, `excentricite_B`, `els_permanentes`…), pas `avertissements`. Elles sont traduites en clair dans la note.
- Verifications : portance et glissement par combinaison et par analyse, pire cas des deux sens ; excentricité 2e par `permanentes` et `totales` ; 1re par le rapport e_B/(B/3).
- Hypothèses et hors périmètre : textes statiques, mention « annexe nationale » et liste du hors périmètre de PLAN-interface.md.
- `STYLES_TRACE` : classes relevées dans `dessin.ts` (terrain, sol, nappe, semelle, efficace, resultante, effort-t, losange, ellipse-service, point-application, cote, etc.).

**Points douteux**
- Le rapport e_B/(B/3) de l'excentricité 1re est recalculé dans `note.ts` : `vue.ts` ne l'exporte pas. Même formule que la carte, à garder synchronisé.
- Symboles des coefficients sans tiret bas (`γG,dst`, `γφ′`) : avec un `_` après une lettre grecque, la note affiche le tiret brut (le test « texte visible » le signale).
- Les recommandations de la note (DA1, (a)+(b), CC2) sont des textes fixes, pas des valeurs lues dans la saisie : une saisie différente ne les modifie pas.
- Le format JSON `fondations-superficielles/1` est dans `form.ts` (`serialiser`), pas dans `export.ts`.
- Rendu de la note et des classes SVG non contrôlé visuellement.

**Statut des tests**
- `lancer.mjs . note.test` : 77/77.
- `vue.test` 119/119, `form.test` 24/24, `page.test` 12/12 : verts.
- `typecheck.mjs .` : 0 erreur (TypeScript 6.0.3).
- **Audit T3 et T4 (Claude)** : la largeur efficace en plan part de la largeur de calcul (Bd = B - 0,1 m en 2e génération sans dimensions contrôlées) avant de choisir entre B' et L'. Boutons du dessin refaits dans `main.ts` : trois rangées (combinaison, sens, analyse seulement en « Les deux »), libellés en clair au lieu du JSON brut, comparaison des vues par valeur (le bouton actif restait éteint), rangées déplacées dans la section Dessin, cotes cochées par défaut comme dans la maquette. Tests : 325 réussis, seuls les 34 de `anglais.test` (T5) échouent ; typage sans erreur.
