# fondations-superficielles

Semelle superficielle isolée ou filante : portance, glissement, excentricité et tassement, selon
l'**EN 1997** et l'**EN 1990**, dans leurs **deux générations**. Un bouton bascule de l'une à l'autre
**sans rien ressaisir**.

Fait partie de la suite [Aedificium web](https://henri421.github.io/WebAedificium/).
Page publiée : <https://henri421.github.io/fondations-superficielles/> (en anglais : `/en/`).

> **Aide au calcul. L'outil constate, il ne prescrit pas.** Valeurs recommandées des normes, sans
> annexe nationale belge. La 2ᵉ génération n'est applicable qu'une fois son annexe nationale
> publiée. **Aucune valeur n'a encore été comparée à un calcul externe.** La vérification finale
> incombe à l'ingénieur du projet.

## Ce que l'outil rend

- **Portance** drainée (annexe D de l'EN 1997-1:2004, annexe B.4 de l'EN 1997-3:2025) et non drainée,
  sur la surface efficace B' × L', pour chaque combinaison et dans les deux sens des actions
  horizontales et des moments.
- **Glissement** drainé et non drainé ; en non drainé, la limite 0,4 N n'est appliquée que si l'eau ou
  l'air peut atteindre l'interface (case cochée par défaut).
- **Excentricité** : e/(B/3) en 1ʳᵉ génération ; actions permanentes et totales (tableau 5.3) en 2ᵉ.
- **Tassement** facultatif, sans seuil : méthode élastique et couches œdométriques, au centre et au coin.
- **1ʳᵉ génération** : DA1 (par défaut), DA2, DA3. **2ᵉ génération** : (a) + (b), (c), (d), classes de
  conséquences CC1 à CC3, dimensions contrôlées et facteur de profondeur au choix.
- **Dessins** à l'échelle : coupe (terrain, nappe, semelle, N, T, rectangle sur B', cotes) et plan
  (surface efficace, point d'application, losange et ellipse de service). Le cas gouvernant s'ouvre
  d'abord ; la résultante hors de la base et le soulèvement sont dits en clair.
- **Sorties** : note de calcul HTML produite par les mêmes fonctions que l'écran, coupe (SVG),
  résultats (CSV), saisie enregistrée (JSON, format `fondations-superficielles/1`).

## Choix déclarés

- Un seul sol sous la base pour la portance ; les couches ne servent qu'au tassement.
- 2ᵉ génération : largeur de calcul réduite de 0,1 m sauf dimensions contrôlées.
- Sous-pression comptée sans coefficient partiel.
- Aucune valeur inventée : φ'k hors de ]0, 90[, c_u ≤ 0 et σ'p absent sont refusés à la saisie.

## Hors périmètre

Fondation circulaire, base ou terrain inclinés, couche faible sous la base, soulèvement UPL, butée
sur le front, stabilité générale, annexe nationale.

## Origine des moteurs

Ce dépôt appelle deux paquets de la suite : `sol-ec7` (coefficients partiels, terrain, portance,
tassement) et `aedificium-ui` (interface et note). Le déroulé de la semelle est dans `src/semelle.ts`.

## Développement

```bash
npm install
npm run typecheck
npm test
npm run build
```

Licence MIT.
