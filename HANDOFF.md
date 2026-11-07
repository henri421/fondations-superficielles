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

## T5 interface : version anglaise

**Fichiers modifiés** : `app/en/index.html` (page complète, squelette identique à `app/index.html`), `app/src/textes.ts` (EN complété ; table `phrase` du noyau et messages de saisie), `app/src/form.ts` et `app/src/main.ts` (libellés et messages codés en dur déplacés dans `textes.ts`, voir ci-dessous). Rien d'autre : pas de logique modifiée, pas de dépendance, pas de commit.

**Décisions**
- Page EN : mêmes `id`, `data-*`, `type`, `inputmode`, `accept` et ordre que la page FR ; `html lang="en"` ; lien `barre-langue` vers `../`. Titre h1 « Shallow foundations ». Nom de l'élément par défaut « Footing » (cartouche), norme inchangée.
- `phrase` (table noyau) : entrées exactes pour les messages du noyau (`terrain`, `tassement`, `portance`, `semelle`), règles regex pour les messages « doit être un nombre … » avec `NOMS` pour les noms de grandeurs, règle `^EN ` pour les sources de coefficients (tableau → table, jeu → set, valeur recommandée → recommended value, facteur de conséquence → consequence factor, sans coefficient → no factor), et « Format inconnu » de `relire`. Aucune valeur inventée : on traduit seulement.
- **Déplacement permis (form.ts)** : les 7 messages et 2 libellés de `lireSaisie` étaient codés en dur en français. Ils sont maintenant `textes().messages.nombreAttendu / phiBornes / cuPositif / sigmaPPositif` et `textes().libelles.epaisseur / gammaBeton`, et le nom de couche vient de `textes().vue.entrees.symboleCouche(n)`. Les textes FR sont identiques au caractère près. Ajout d'un `import { textes } from './textes'`.
- **Déplacement permis (main.ts)** : le message « Élément absent de la page » de `exige()` vient de `textes().messages.elementAbsent`. Une seule ligne changée.

**Points douteux**
- La méta description FR et EN parle d'« Eurocode 3 » (« Eurocode 7 et Eurocode 3 »), alors que l'outil ne traite que l'EN 1997 et l'EN 1990. Traduit tel quel ; à trancher côté FR avant de corriger les deux.
- Les sources de coefficients sont traduites par règle mot à mot (`sourceEn`) et non par une table exhaustive : une nouvelle source avec un autre vocabulaire resterait en français sans que le test échoue si elle ne commence pas par « EN ».
- `Textes` reste `typeof FR` : aucune clé EN manquante n'est détectée par le typage hors de la forme déjà existante ; la forme a été vérifiée à la main (même clés que FR).
- Libellés de la saisie (`E_m`, `γ'`, `γsat`, `Dw`) gardés en symboles, identiques dans les deux langues.
- Rendu visuel de la page EN non contrôlé dans le navigateur (le test vérifie le texte et le squelette, pas la mise en page).

**Statut des tests**
- `lancer.mjs . anglais.test` : 36/36 (le test du squelette, de la langue, des 36 saisies, de la note et des messages du noyau).
- `lancer.mjs .` (suite complète) : 359 réussis, 0 échec (anglais 36, dessin 49, form 24, note 77, page 12, vue 119, audit 2, semelle 26, semelle2e 14).
- `typecheck.mjs .` : 0 erreur (TypeScript 6.0.3).
- **Audit T5 et contrôle visuel (Claude)** : description des pages corrigée (« Eurocode 3 » remplacé par l'EN 1990, que l'outil applique) ; ponctuation anglaise (`ponctuer` dans `textes.ts`, appliquée aux verdicts, aux volets, aux dessins et aux titres de la note) ; dans la coupe, T part du bord de la base vers l'extérieur et la cote de B s'écarte de la nappe ; bouton actif et ligne gouvernante mis en évidence (`style.css`) ; message du cas dégénéré avec majuscule. Contrôlé dans le navigateur : isolée, filante, 2e génération, résultante hors de la base, page anglaise ; ni NaN ni Infinity. Tests : 359 réussis, 0 échec ; typage sans erreur ; `tests/` et `src/` intacts.

## Lot 9.5 — feuilles

**Fichiers modifiés** (non commités, Claude audite et commite) :
- `app/index.html` et `app/en/index.html` : `<div class="feuilles" data-role="feuilles"></div>` après `</header>`.
- `app/src/style.css` : `.feuilles` ajouté à la règle `header, main, footer` ; bloc `.feuilles` / `.feuilles:empty` en fin de fichier.
- `app/src/main.ts` : import `brancherFeuilles`, `type BarreFeuilles`, `type Json` ; `let barre` après `let saisie` ; `recalculer()` remplace `memoriser()` par la branche `barre?.dansUnProjet()` ; `brancherFeuilles({...})` juste avant les appels de démarrage, `app: 'fondations-superficielles'`, `lire` et `charger` comme dans le lot (`charger` appelle `ecrireSaisie(); recalculer();`).

**Décisions** :
- `nomApp` pris dans `exige<HTMLElement>('header h1')`, avec repli sur l'identifiant si le texte est vide.
- Pas de `libelle` ni `marquer` (interdits par le lot).

**Points douteux** :
- `charger` appelle `recalculer()`, qui appelle `barre.signaler()` quand l'app est dans un projet. Le lot ne dit pas si `signaler` peut re-déclencher `charger` ; à vérifier à l'audit.
- Pas de test de l'état « dans un projet » au-delà des 6 tests de `feuilles.test.ts`.

**Tests** :
- `ELECTRON_RUN_AS_NODE=1 ".../Code.exe" _banc-local/lancer.mjs fondations-superficielles` : 365 réussis, 0 échec. `tests/app/feuilles.test.ts` 6/6.
- `ELECTRON_RUN_AS_NODE=1 ".../Code.exe" _banc-local/typecheck.mjs fondations-superficielles` : 0 erreur (TypeScript 6.0.3).
