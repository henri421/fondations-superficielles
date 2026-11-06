# Fondations superficielles : plan de l'interface

Rédigé le 2026-11-04. Le noyau (`src/`, `sol-ec7`) est écrit et audité. Reste la page, sur le gabarit du mur en L.
Maquette validée le 2026-11-04 : `plan-webaedificium/maquette-fondations-superficielles.html`. Les tests d'acceptation sont
dans `tests/app/`, le squelette de `app/` et sa configuration sont en place (T0).

## Spécifications

Entrées du calcul : `verifierSemelle1g(d, approche, profil1g())` et `verifierSemelle2g(d, options, profil2g())`, appelées
par `verifier` dans `form.ts`. L'interface ne calcule rien d'autre que des présentations tirées du résultat : le rapport
e/(B/3) de la carte d'excentricité en 1re génération, et les proportions des dessins.

- **Semelle** : isolée ou filante, B, L, D, épaisseur, γ béton. Épaisseur 0 : poids propre non compté.
- **Actions à la base** : tableau G et Q pour V, H et M selon B, H et M selon L. Les deux lignes « selon L » disparaissent
  en filante, et tout passe par mètre.
- **Sol** : trois boutons, Drainé (par défaut), Non drainé, Les deux. Drainé : φ'k, c'k. Non drainé : c_u,k et la case
  « eau ou air peut atteindre l'interface », cochée par défaut. Toujours : γ, γsat, base rugueuse, nappe facultative. γw = 10.
- **Refus à la saisie** : φ'k hors de ]0, 90[, c_u ≤ 0, σ'p absent ou ≤ 0 (jamais de valeur inventée).
- **Génération** : 1re par défaut, les données restent au basculement. 1re : DA1, DA2, DA3. 2e : (a) + (b), (c), (d), CC2
  par défaut, cases « dimensions contrôlées » et « compter la profondeur ». Valeurs recommandées annoncées à l'écran et
  dans la note.
- **Tassement** : volet replié et vide par défaut. Pression nette ou brute, méthode élastique (E_m, ν, rigide ou souple),
  couches (h, γ', Cc, Cs, e0, σ'p). Aucune méthode renseignée : pas de tassement.
- **Dessin** : coupe (terrain, nappe, semelle, N, T, rectangle sur B', cotes) et plan (surface efficace, point d'application,
  losange et ellipse de service). Boutons de combinaison, de sens et, en « Les deux », d'analyse. Le cas gouvernant s'ouvre
  d'abord. Échelle réelle. Cas dégénérés dessinés sans surface efficace, avec un message en clair.
- **Verdicts**, en groupes `elu`, `excentricite`, `tassement`, sans verdict global. Le tassement n'a ni jauge ni seuil.
  Soulèvement et résultante hors de la base : marqués `depasse`, dits en clair, jamais « Infinity ». Clauses : 1re §6.5.3,
  annexe D, §6.5.4 ; 2e §5.6.3, annexe B.4, §5.6.4, tableau 5.3.
- **Volets** : portance et glissement par combinaison et sens, facteurs du cas gouvernant, tranches de tassement,
  coefficients avec leur source (`Resultat.coefficients`) et hypothèses.
- **Sorties** : note commune d'aedificium-ui, SVG, CSV, JSON (format `fondations-superficielles/1`), version anglaise
  sous `/en/`.

Hors périmètre annoncé à l'écran : fondation circulaire, base ou terrain inclinés, couche faible sous la base,
soulèvement UPL, butée sur le front, stabilité générale, annexe nationale.

## Contrat des modules

Les tests lisent ces noms, qui ne se négocient pas. Les types sont déjà dans les squelettes.

- `app/src/form.ts` : `Saisie`, `saisieParDefaut`, `lireSaisie`, `Calcul`, `Resultat`, `verifier`, `serialiser`, `relire`. Les valeurs
  par défaut sont celles de la maquette, sauf le tassement (`avecTassement: false`, `couches: []`), et `cu: '60'`.
- `app/src/vue.ts` : `verdictsHtml(r)`, `voletsHtml(r)`, `blocEntrees(calcul)`, `blocsResultat(r)`, `messageDErreur(e)`. Chaque carte
  porte `data-verification` (clé de `tauxMax`), chaque tranche `data-tranche`.
- `app/src/dessin.ts` : `Vue`, `vuesDisponibles(r)`, `vueGouvernante(r)`, `coupe(calcul, r, vue, options)`, `planSvg(calcul, r, vue)`.
  Classes imposées en tête de `tests/app/dessin.test.ts`. Attention : le noyau rend B' ≤ L', donc en plan la largeur dessinée
  vaut B - 2 e_B (ou B_d - 2 e_B), pas `Bp`, quand les dimensions sont permutées.
- `app/src/note.ts` : `noteDuCalcul(calcul, r, cartouche)`. `app/src/export.ts` : `STYLES_TRACE`.
- `app/src/textes.ts` : `textes()`, `phrase`.

Dessin et mise en page suivent la maquette, lue par morceaux : styles lignes 7 à 89, saisie 101 à 171, coupe 184 à 247,
plan 253 à 277, volets 280 à 326, verdicts 329 à 350.

## Tâches

| Tâche | Fichiers | Gabarit à lire | Filtre de test | Dépend de | Qui |
| --- | --- | --- | --- | --- | --- |
| T0 | `tests/app/*`, `vite.config.ts`, squelettes | | | | fait |
| T1 | `app/index.html`, `form.ts`, `main.ts` | `mur-en-l/app/index.html`, `form.ts`, `main.ts` | `form.test`, `page.test` | T0 | exécutant |
| T2 | `vue.ts`, `textes.ts` | `mur-en-l/app/src/vue.ts`, `textes.ts` | `vue.test` | T1 | exécutant |
| T3 | `dessin.ts` | la maquette | `dessin.test` | T1 | exécutant, contrôle visuel par Claude |
| T4 | `note.ts`, `export.ts` | `mur-en-l/app/src/note.ts`, `export.ts` | `note.test` | T2, T3 | exécutant |
| T5 | `app/en/index.html`, `textes.ts` | `mur-en-l/app/en/index.html` | `anglais.test` | T4 | exécutant |
| T6 | icônes, README, lock, publication | | | T5 | local fait (5f8daf2, c852b41) ; publication en attente des dépôts |
| T7 | carte et menu du hub, bandeau « non audité » de Fondbis avec les deux erreurs de portance | | | T6 | local fait (hub 8173eb2, Fondbis 31086ee), non poussé |

`app/src/style.css` et `pwa.ts` sont déjà copiés du mur : n'ajouter à la fin de `style.css` que les règles manquantes.
`page.test` lit `main.ts` tel qu'il sera à la fin : ses tests « main.ts » ne passent qu'après T4. Pour T6, l'utilisateur crée les
dépôts GitHub `sol-ec7` et `fondations-superficielles` ; le tag `v0.1.0` de `sol-ec7` se pose avant le lock de l'outil.

## Commandes

Depuis le dépôt, une tâche (remplacer le filtre), puis tout, puis le typage :

```bash
export ELECTRON_RUN_AS_NODE=1; "/c/Users/henri/AppData/Local/Programs/Microsoft VS Code/Code.exe" ../_banc-local/lancer.mjs . form.test
```

```bash
export ELECTRON_RUN_AS_NODE=1; "/c/Users/henri/AppData/Local/Programs/Microsoft VS Code/Code.exe" ../_banc-local/lancer.mjs .
```

```bash
export ELECTRON_RUN_AS_NODE=1; "/c/Users/henri/AppData/Local/Programs/Microsoft VS Code/Code.exe" ../_banc-local/typecheck.mjs .
```

Résultat attendu à la fin de T5 : tous les tests réussis, 0 erreur de typage. Les tests d'interface n'ont encore jamais
tourné sur du code : un test qui paraît faux se signale, il ne se corrige pas.

## Coût

Un lancement par tâche, consigne nommant les fichiers et les lignes de la maquette, 45 tours au plus, heures creuses.

## Interdits pour l'exécutant

Modifier `src/`, `tests/`, `sol-ec7`, `mur-en-l`, `_banc-local` ; calculer dans `app/` ; ajouter une dépendance ; `git push`, `git tag`.
Pas de fond noir ni d'interface façon tableur. Si un test paraît faux, s'arrêter sur cette tâche et le signaler dans `HANDOFF.md`.

## Publication (à faire dans cet ordre)

1. L'utilisateur crée, vides et publics, `henri421/sol-ec7` et `henri421/fondations-superficielles`.
2. `sol-ec7` : ajouter le dépôt distant, pousser `main` puis le tag `v0.1.0` (déjà posé en local sur b1d5d28 ;
   le lock de l'outil pointe sur ce commit).
3. `fondations-superficielles` : pousser `main` ; l'utilisateur active Pages (source GitHub Actions) ; le
   workflow `pages.yml` vérifie, construit et publie.
4. Une fois la page en ligne : pousser le hub (8173eb2) et Fondbis (31086ee), puis lancer à la main le
   workflow de publication de Fondbis.
