# Fondations superficielles : plan du noyau

Rédigé le 2026-11-03. Décisions : `plan-webaedificium/etape-5-refonte-fondbis.md`. Ce lot couvre le paquet
`sol-ec7` et le noyau de l'outil. L'interface (saisie, dessin, note, anglais, publication) fera l'objet d'un plan
séparé, après audit de ce lot.

Deux dépôts voisins : `Github\sol-ec7` et `Github\fondations-superficielles`.

## Règles pour l'exécutant

- Traiter T1 à T6 dans l'ordre. Écrire `HANDOFF.md` dans `fondations-superficielles` (format du `CLAUDE.md` global).
- **Interdit** : modifier les fichiers `tests/`, lire `Github\fondbis`, ouvrir les normes, toucher à `mur-en-l` ou
  à `_banc-local`, ajouter une dépendance, écrire dans `app/`, lancer `git push` ou `git tag`.
- Lire seulement les fichiers nommés ici et les tests. Commit local par tâche, identité déjà configurée.
- Si un test paraît faux : ne pas le changer, passer la tâche en « bloquée » dans `HANDOFF.md`, et continuer si
  la suite n'en dépend pas.
- Style : `CONVENTIONS.md`, identifiants et commentaires en français sans accents, messages d'erreur accentués.
  Modèle de style : `mur-en-l/src/sol.ts` et `mur-en-l/src/profil.ts`.
- Point de décision laissé : l'organisation interne des fonctions. Tout nom listé ici est imposé.

Banc, depuis le dossier du dépôt concerné (pas de npm) :

```bash
export ELECTRON_RUN_AS_NODE=1; "<Code.exe>" ../_banc-local/lancer.mjs .
```

```bash
export ELECTRON_RUN_AS_NODE=1; "<Code.exe>" ../_banc-local/typecheck.mjs .
```

Unités : m, kN, kPa, kN/m³. Angles en radians dans `sol-ec7`, en degrés dans `DonneesSemelle`. Filante : `L = null`,
tout par mètre, `A' = B'`.

## T1 : coefficients (`sol-ec7/src/coefficients.ts`)

Reprendre `mur-en-l/src/profil.ts` et `profil2e.ts`, mêmes valeurs et mêmes sources, avec ces changements :

- Types `ValeurSourcee { valeur, source }` (défini ici), `JeuActions`, `JeuSol { gPhi, gC, gCu }`,
  `JeuResistance { gRv, gRh }`, `Combinaison { nom, geotechnique, structure, sol, resistance }`, `Approche`,
  `Approche2e`, `ClasseConsequences`.
- `profil1g()` : champs `EQU`, `A1`, `A2`, `M1`, `M2`, `R1`, `R2`, `R3`. `gCu` = 1,0 en M1, 1,4 en M2 (tableau A.4).
- `profil2g()` : champs de `Profil2e` plus `gCuM2` = 1,4 (`EN 1997-1:2024, tableau 4.8, valeur recommandée, jeu M2`).
- `verifierProfil1g(p)`, `verifierProfil2g(p)` : lèvent, avec le mot « source », sur une valeur sans source.
- `combinaisons1g(approche, p)` : comme `combinaisons`.
- `combinaisons2g(approche, cc, p)` : comme `combinaisons2e`, source `EN 1997-3:2025, tableau 5.2` à la place du tableau 7.2,
  noms `(a)`, `(b)`, `(c)`, `(d)`. `gCu` de (a) et (d) = 1 ; de (b) = `gCuM2` × k_M ; de (c) = `gCuM2`.
- Pas de (e) : VC4 est hors périmètre.

## T2 : terrain et dimensions (`sol-ec7/src/terrain.ts`)

`contraintesBase({ D, Dw, gamma, gammaSat, gammaW, B })` rend `{ qEff, qTot, u, gammaEff }`, `Dw` profondeur de la nappe
sous le terrain naturel ou `null` (EN 1997-3 B.4(7)). Avec `g' = gammaSat - gammaW` :

| Nappe | qEff | qTot | u | gammaEff |
|---|---|---|---|---|
| `null` | γD | γD | 0 | γ |
| `Dw < D` | γDw + g'(D - Dw) | γDw + γsat(D - Dw) | γw(D - Dw) | g' |
| `D ≤ Dw < D + 1,5 B` | γD | γD | 0 | g' + (γ - g')(Dw - D)/(1,5 B) |
| `Dw ≥ D + 1,5 B` | γD | γD | 0 | γ |

`dimensionsEfficaces(B, L, eB, eL)` rend `{ Bp, Lp, A, permute, horsBase }`. `Bp = B - 2eB`, `Lp = L - 2eL`. Si `Lp < Bp`,
échanger et `permute = true`. `horsBase` si l'une est ≤ 0 : alors `A = 0`, sans erreur. Filante : `Lp = null`, `A = Bp`, `eL` ignoré.

`angleChargeT(TB, TL, permute)` : angle θ entre l'axe de L' et T. Sans permutation `atan2(|TB|, |TL|)`, avec permutation
`atan2(|TL|, |TB|)`. T nul : π/2.

## T3 : portance (`sol-ec7/src/portance.ts`)

Reprendre `mur-en-l/src/sol.ts`, étendu.

- `facteursPortance1g(phi)`, `facteursPortance2g(phi)` : `{ Nq, Nc, Ngamma }`. Nq et Nc identiques ;
  Nγ = 2(Nq - 1) tan φ en 1re, 2(Nq + 1) tan φ en 2e.
- `portanceDrainee1g({ Bp, Lp, T, N, phi, c, gammaEff, q, theta? })` et `portanceDrainee2g({ ..., Df? })` rendent
  `{ Nq, Nc, Ngamma, sq, sc, sgamma, iq, ic, igamma, m, dq, dc, q_u }`. `phi ≤ 0` lève.
  - r = B'/L' (0 en filante). sq = 1 + r sin φ, sγ = 1 - 0,3 r, sc = (sq Nq - 1)/(Nq - 1).
  - m_B = (2 + r)/(1 + r), m_L = (2 + 1/r)/(1 + 1/r), m = m_L cos²θ + m_B sin²θ, θ = π/2 par défaut. Filante : m = 2.
  - base = max(0, 1 - T/(N + A'c cot φ)) en 1re, max(0, 1 - T/N) en 2e. iq = base^m, iγ = base^(m+1),
    ic = iq - (1 - iq)/(Nc tan φ).
  - 2e, si `Df > 0` : dq = 1 + 2 tan φ (1 - sin φ)² x, x = Df/B' si Df/B' ≤ 1, sinon atan(Df/B') ; dc = dq - (1 - dq)/(Nc tan φ).
    Sinon, et toujours en 1re, dq = dc = 1.
  - q_u = c Nc sc ic dc + q Nq sq iq dq + 0,5 γ B' Nγ sγ iγ.
- `portanceNonDrainee1g({ Bp, Lp, T, cu, q })` et `portanceNonDrainee2g({ ..., B, Df? })` rendent `{ sc, ic, dc, q_u }`. `cu ≤ 0` lève.
  sc = 1 + 0,2 r, ic = 0,5(1 + √max(0, 1 - T/(A'cu))), dc = 1 + 0,33 atan(Df/B) en 2e si `Df > 0`, sinon 1.
  q_u = (π + 2) cu sc ic dc + q.

## T4 : tassement (`sol-ec7/src/tassement.ts`), puis `sol-ec7/src/index.ts`

- `influenceIs(LsurB, raideur)`, `raideur` `'souple'` (moyenne) ou `'rigide'`, tableau B.3 de l'EN 1997-3:2025, interpolation
  linéaire, plafond à L/B = 10. L/B : 1, 2, 3, 4, 5, 10. Souple : 0,95 ; 1,3 ; 1,53 ; 1,7 ; 1,83 ; 2,25.
  Rigide : 0,83 ; 1,21 ; 1,43 ; 1,59 ; 1,72 ; 2,13.
- `tassementElastique({ p, B, LsurB, nu, Em, raideur })`, `Em` en kPa, rend `{ Is, s_mm }`, s = p B (1 - ν²) Is / Em.
- `facteurAngleRectangle(b, l, z)` : Steinbrenner sous l'angle, m = b/z, n = l/z, r² = m² + n² + 1,
  I = [2mn r/(r² + m²n²) × (m² + n² + 2)/r² + θ]/(4π), θ = atan2(2mn r, r² - m²n²), ramené dans [0, π].
- `surcontrainteCentre(q, B, L, z)` = 4q I(B/2, L/2, z), `surcontrainteCoin(q, B, L, z)` = q I(B, L, z). À z = 0 : q et q/4.
- `tassementOedometre({ H, sigma0, dSigma, Cc, Cs, e0, sigmaP })` rend `{ s_mm, regime }`, `regime` parmi `surconsolide`,
  `normalement_consolide`, `franchissement` (recompression puis compression au-delà de σ'p, log10).
- `tassementCouches({ q, B, L, sigmaBase, couches, pas? })`, `couches` : `{ h, gammaEff, Cc, Cs, e0, sigmaP }`, `pas` 0,25 m. `sigmaP ≤ 0` lève
  avec le mot « sigma » : **jamais de valeur par défaut**. Chaque couche est divisée en n = ceil(h/pas) tranches égales ;
  au milieu de chacune σ'0 = sigmaBase + cumul γ'z. `L = null` : L = 100 B. Rend `{ centre_mm, coin_mm, detail }`, une ligne par tranche
  `{ z, sigma0, dSigmaCentre, dSigmaCoin, regime, sCentre_mm, sCoin_mm }`.

`src/index.ts` exporte tout. Commande : banc dans `sol-ec7`. Attendu : tous les tests passent, typecheck sans erreur.

## T5 : noyau, 1re génération (`fondations-superficielles/src/semelle.ts`, `src/index.ts`)

```ts
interface DonneesSemelle {
  B: number; L: number | null; D: number;
  ep: number;          // epaisseur de semelle ; 0 : poids propre non compte
  gammaBeton: number;
  actions: { V_G; V_Q; H_BG; H_BQ; H_LG; H_LQ; M_BG; M_BQ; M_LG; M_LQ };  // numbers, moments a la base
  sol: { phi: number | null; c: number; cu: number | null; gamma; gammaSat; Dw: number | null; gammaW;
         baseRugueuse: boolean; eauInterface: boolean };
  tassement?: { pNette: boolean; elastique: { Em /* MPa */; nu; raideur } | null; couches: Couche[] | null };
}
verifierSemelle1g(d: DonneesSemelle, approche: Approche, p: Profil1g): ResultatSemelle
```

Le résultat :

```ts
interface ResultatSemelle {
  combinaisons: { nom: string; cas: [CasSemelle, CasSemelle] }[];  // defavorable puis favorable
  tauxMax: { portanceDrainee; portanceNonDrainee; glissementDraine; glissementNonDraine };  // number | null
  gouvernant: { verification: keyof tauxMax; combinaison: string; sens: 'defavorable' | 'favorable'; taux: number };
  conforme: boolean;   // tous les taux <= 1
  alertes: string[];   // sans doublon
  els: EtatService | null;   // null en 1re generation
  tassement: { p; elastique: { Is; s_mm } | null; couches: { centre_mm; coin_mm; detail } | null } | null;
}
interface CasSemelle {
  sens; N_d; T_d; U;
  drainee: { N; eB; eL; Bp; Lp; A; horsBase; q_u; R_d; taux; facteurs;
             glissement: { R_d; taux } } | null;   // null si phi null
  nonDrainee: { eB; eL; Bp; Lp; A; horsBase; q_u; R_d; taux; facteurs;
                glissement: { R_d; taux; limite04: boolean } } | null;   // null si cu null
}
```

Règles :

1. **Refus** (lever) : B, D, L non filante ≤ 0, `ep > D`, ni φ ni c_u, `H_L` ou `M_L` non nuls en filante, profil sans source
   (`verifierProfil1g`).
2. **Actions** : seules les charges saisies et le poids propre, donc jeu `structure` de la combinaison.
   Poids propre : si `ep > 0`, G0 = A0 (ep γb + γ hs + γsat (D - ep - hs)), avec A0 = B L (B en filante),
   hs = min(D - ep, Dw) ou D - ep sans nappe. Il s'ajoute à V_G.
3. **Deux cas par combinaison** : `defavorable` N = gG_dst (V_G + G0) + gQ_dst V_Q ; `favorable` N = gG_stb (V_G + G0).
   Dans les deux, H et M portent gG_dst et gQ_dst : verticale et horizontale sont traitées comme indépendantes.
   T = √(TB² + TL²), T_d le rend.
4. **Drainé**, si φ saisi : U = u A0, sans coefficient (niveau de nappe saisi comme niveau de calcul). N' = N - U, rendu dans `drainee.N`.
   e = |M|/N'. Dimensions : `dimensionsEfficaces`. φd = atan(tan φ/gPhi), cd = c/gC, γ non pondéré. q = qEff, γ = gammaEff,
   θ = `angleChargeT`. R_d = q_u A/gRv, taux = N'/R_d.
   Glissement : tan δd = tan φ/gPhi si base rugueuse, tan(2φ/3)/gPhi sinon ; R_d = N' tan δd/gRh ; c' n'est pas compté.
5. **Non drainé**, si c_u saisi : N total, e = |M|/N, cud = cu/gCu, q = qTot. Même R_d et taux.
   Glissement : R = A cud/gRh ; si `eauInterface`, R ≤ 0,4 N, et `limite04` vaut vrai quand ce plafond s'applique.
6. **Cas dégénérés** : N' ≤ 0 : alerte `soulevement`, taux de portance `Infinity`, q_u = R_d = 0, R glissement = 0.
   `horsBase` : alerte `hors_base`, taux de portance `Infinity`, q_u = R_d = 0, R non drainé = 0. Glissement avec R = 0 : `Infinity`, sauf T = 0 : 0.
7. **Alertes** : `excentricite_B` si eB > B/3 dans un cas, `excentricite_L` si eL > L/3 (constat de EN 1997-1 §6.5.4, sans effet sur `conforme`).
8. **Tassement**, si demandé, sur dimensions nominales et charges caractéristiques : p = (V_G + G0 + V_Q)/A0, moins qTot si `pNette`.
   Élastique : `LsurB = max(L, B)/min(L, B)`, 10 en filante, largeur `min(L, B)`, Em × 1000. Couches : `sigmaBase = qEff`.

Commande : banc dans `fondations-superficielles`, filtre `semelle.test`. Attendu : tous les tests de `tests/semelle.test.ts` passent.

## T6 : noyau, 2e génération

```ts
interface Options2g { approche: Approche2e; consequences: ClasseConsequences;
                      dimensionsControlees: boolean; profondeurComptee: boolean }
verifierSemelle2g(d: DonneesSemelle, o: Options2g, p: Profil2g): ResultatSemelle
```

Même déroulé que T5, à partager, avec :

- `combinaisons2g`, `verifierProfil2g`, portance 2e. Si non `dimensionsControlees`, largeur de calcul Bd = B - 0,10 m (5.6.3), pour
  e, B', U et A' ; G0, tassement et ELS gardent B nominal.
- `profondeurComptee` : `Df = D` en drainé, `Df = D` et `B = Bd` en non drainé.
- Glissement drainé : tan δd = k tan φ/gPhi, k = 1 si rugueuse, 2/3 sinon (5.5.3).
- Glissement non drainé : R = A k cud/gRh, plafond 0,4 N_rep, N_rep = V_G + G0 caractéristique dans les deux cas (5.15).
- `els` (tableau 5.3), dimensions nominales, N = charge caractéristique - U :
  `{ permanentes: { valeur, limite, ok }, totales: { valeur, limite, ok } }`, permanentes avec G seuls, totales avec G + Q.
  Rectangle : permanentes eB/B + eL/L ≤ 1/6, totales (eB/B)² + (eL/L)² ≤ 1/9. Filante : eB/B ≤ 1/6 et ≤ 1/3.
  Alertes `els_permanentes`, `els_totales`, sans effet sur `conforme`.

Commande : banc dans `fondations-superficielles`, sans filtre, puis typecheck. Attendu : tout passe, aucune erreur.

## Hors périmètre de ce lot

Interface, VC4 et combinaison (e), fondation circulaire, base ou terrain inclinés, couche faible sous la base (B.5), soulèvement UPL,
butée sur le front, stabilité générale, annexe nationale. Le mur en L reste sur son propre `sol.ts` jusqu'à sa migration.
