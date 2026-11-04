# Fondations superficielles : plan de l'interface

Rédigé le 2026-11-04. **Brouillon** : les tests d'acceptation s'écrivent une fois la maquette validée, car ils fixent
ses noms de champs. Rien n'est à lancer avant.

Le noyau (`src/`, `sol-ec7`) est écrit et audité. Reste la page, sur le gabarit de `cisaillement-interface` et du mur
en L. Maquette : `plan-webaedificium/maquette-fondations-superficielles.html`.

## Spécifications

Entrées du calcul : `verifierSemelle1g(d, approche, profil1g())` et `verifierSemelle2g(d, options, profil2g())`.
L'interface ne calcule rien, sauf le rapport e/(B/3) de la carte d'excentricité en 1re génération, tiré du résultat.

- **Semelle** : isolée ou filante, B, L, D, épaisseur, γ béton. Épaisseur 0 : poids propre non compté.
- **Actions à la base** : tableau G et Q pour V, H et M selon B, H et M selon L. Les deux lignes « selon L » disparaissent
  en filante, et tout passe par mètre.
- **Sol** : trois boutons, Drainé (par défaut), Non drainé, Les deux. Drainé : φ'k, c'k. Non drainé : c_u,k et la case
  « eau ou air peut atteindre l'interface », cochée par défaut. Toujours : γ, γsat, base rugueuse, nappe facultative. γw = 10.
- **Génération** : 1re par défaut, les données restent au basculement. 1re : DA1, DA2, DA3. 2e : (a) + (b), (c), (d), CC2
  par défaut, cases « dimensions contrôlées » et « compter la profondeur ». Valeurs recommandées annoncées à l'écran et
  dans la note.
- **Tassement** : volet replié et vide par défaut. Pression nette ou brute, méthode élastique (E_m, ν, rigide ou souple),
  couches (h, γ', Cc, Cs, e0, σ'p). σ'p absent : refus, jamais de valeur inventée.
- **Dessin** : coupe (terrain, nappe, semelle, N_d, T_d, rectangle sur B', cotes) et plan (surface efficace, point
  d'application, losange et ellipse de service). Boutons de combinaison et de sens, le cas gouvernant affiché d'abord.
  Échelle réelle, B et L quelconques. Les cas dégénérés (soulèvement, hors base) se dessinent sans planter.
- **Verdicts**, en trois groupes : états limites ultimes, excentricité, tassement. Le tassement n'a ni jauge ni seuil.
  Soulèvement et résultante hors base s'affichent en refus. Les excentricités ne changent pas la conformité.
- **Volets** : portance et glissement par combinaison et sens, facteurs du cas gouvernant, tranches de tassement,
  coefficients avec leur source et hypothèses.
- **Sorties** : note commune d'aedificium-ui, SVG, CSV, JSON (format `fondations-superficielles/1`), version anglaise
  sous `/en/`.

Hors périmètre annoncé à l'écran : fondation circulaire, base ou terrain inclinés, couche faible sous la base,
soulèvement UPL, butée sur le front, stabilité générale, annexe nationale.

## Contrat des modules

Noms imposés une fois les tests écrits.

- `app/src/form.ts` : `Saisie`, `saisieParDefaut`, `lireSaisie` (rend `{ ok, calcul }`), `Calcul`, `verifier`, `serialiser`,
  `relire`. Champs : `generation`, `approche1`, `approche2`, `consequences`, `dimensionsControlees`, `profondeurComptee`,
  `forme`, `B`, `L`, `D`, `ep`, `gammaBeton`, `VG`, `VQ`, `HBG`, `HBQ`, `MBG`, `MBQ`, `HLG`, `HLQ`, `MLG`, `MLQ`, `comportement`,
  `phi`, `c`, `cu`, `gamma`, `gammaSat`, `baseRugueuse`, `eauInterface`, `avecNappe`, `Dw`, `avecTassement`, `pNette`,
  `avecElastique`, `Em`, `nu`, `raideur`, `couches`. Les champs masqués ne sont pas lus : `comportement` décide de φ et c_u.
- `app/src/vue.ts` : `verdictsHtml(r)`, `voletsHtml(r)`, `blocEntrees(calcul)`, `blocsResultat(r)`, `messageDErreur(e)`.
- `app/src/dessin.ts` : `vuesDisponibles(r)`, `coupe(calcul, r, vue, options)`, `planSvg(calcul, r, vue)`.
- `app/src/note.ts` : `noteDuCalcul(calcul, r, cartouche)`. `app/src/export.ts` : `STYLES_TRACE`.
- `app/src/textes.ts` : `textes()`, `phrase`.

## Tâches

| Tâche | Fichiers | Gabarit | Filtre de test | Dépend de | Qui |
| --- | --- | --- | --- | --- | --- |
| T0 | `tests/app/*`, `vite.config.ts`, modules vides | | | maquette validée | Claude |
| T1 | `app/index.html`, `form.ts`, `main.ts`, `pwa.ts`, `style.css` | `mur-en-l/app/` | `form.test`, `page.test` | T0 | exécutant |
| T2 | `vue.ts`, `textes.ts` | `mur-en-l/app/src/` | `vue.test` | T1 | exécutant |
| T3 | `dessin.ts` | la maquette | `dessin.test` | T1 | exécutant, contrôle visuel par Claude |
| T4 | `note.ts`, `export.ts` | `mur-en-l/app/src/` | `note.test` | T2, T3 | exécutant |
| T5 | `app/en/index.html`, `textes.ts` | `mur-en-l/app/en/` | `anglais.test` | T4 | exécutant |
| T6 | icônes, README, `serveur.mjs` du banc, lock, publication | | | T5 | Claude et l'utilisateur |
| T7 | carte et menu du hub, bandeau « non audité » de Fondbis avec les deux erreurs de portance | | | T6 | Claude |

Pour T6, l'utilisateur crée les dépôts GitHub `sol-ec7` et `fondations-superficielles`. Le tag `v0.1.0` de `sol-ec7`
se pose avant le lock de l'outil.

## Coût

Un lancement par tâche, consigne nommant les fichiers et les lignes de la maquette, 30 à 45 tours, heures creuses.
Plafond et estimation annoncés avant le premier lancement, à partir du noyau : 72 tours pour environ 3,2 M de tokens.

## Interdits pour l'exécutant

Modifier `src/`, `tests/`, `sol-ec7`, `mur-en-l`, `_banc-local` ; calculer dans `app/` ; `git push`, `git tag`. Pas de fond noir
ni d'interface façon tableur. Si un test paraît faux, s'arrêter sur cette tâche et le signaler dans `HANDOFF.md`.
