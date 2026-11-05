/**
 * Les textes affiches, en francais et en anglais. PUR.
 * Aucun texte ne se lit au chargement d'un module : toujours `textes()` ou `phrase()` au moment du rendu.
 */

import { langueCourante, traducteur } from 'aedificium-ui';

const FR = {
  messages: {
    rienAExporter: 'Aucun calcul valide à exporter : corriger la saisie.',
    nouvelleVersion: 'Une nouvelle version est disponible. Recharger maintenant ?',
    nombreAttendu: (libelle: string, brut: string) => `${libelle} : nombre attendu, reçu « ${brut} »`,
    phiBornes: "φ'k : doit être strictement compris entre 0 et 90°",
    cuPositif: 'c_u,k : doit être strictement supérieur à 0',
    sigmaPPositif: (nom: string) => `${nom}, σ'p : doit être strictement positif`,
    elementAbsent: (selecteur: string) => `Élément absent de la page : ${selecteur}`,
  },
  libelles: {
    epaisseur: 'Épaisseur de semelle',
    gammaBeton: 'γ béton',
  },
  note: {
    element: 'Semelle',
    portance: 'Portance',
    glissement: 'Glissement',
    excentricite: 'Excentricité',
    coefficients: 'Coefficients partiels',
    legendeCoupe: 'Coupe cotée du cas gouvernant : terrain, nappe, semelle, résultante et rectangle sur B′.',
    legendePlan: 'Plan du cas gouvernant : surface efficace, point d’application, losange et ellipse de service.',
    recommandations1re: [
      'Valeurs recommandées : approche DA1 (combinaisons 1 et 2) par défaut ; DA2 et DA3 disponibles.',
      'Coefficients partiels : ceux de chaque combinaison, avec leur source dans le volet dédié.',
    ],
    recommandations2e: [
      'Valeurs recommandées : approche (a) + (b) par défaut ; (c) et (d) disponibles.',
      'Valeurs recommandées : classe de conséquences CC2 par défaut.',
      'Coefficients partiels : ceux de chaque combinaison, avec leur source dans le volet dédié.',
    ],
    alertes: {
      excentriciteB: 'Excentricité supérieure au tiers de B.',
      excentriciteL: 'Excentricité supérieure au tiers de L.',
      elsPermanentes: 'Excentricité sous actions permanentes au-delà de la limite de service.',
      elsTotales: 'Excentricité sous actions totales au-delà de la limite de service.',
    },
    mention: 'Aucune annexe nationale n’est appliquée : les valeurs recommandées des Eurocodes sont retenues.',
    horsPerimetre:
      'Hors périmètre : fondation circulaire, base ou terrain inclinés, couche faible sous la base, soulèvement UPL, butée sur le front, stabilité générale, annexe nationale.',
  },
  vue: {
    entrees: {
      titre: 'Entrées',
      generation: 'Génération',
      symboleGeneration: 'génération',
      approche: 'Approche',
      symboleApproche: 'approche',
      classe: 'Classe de conséquences',
      symboleClasse: 'classe',
      dimensions: 'Dimensions contrôlées',
      symboleDimensions: 'dimensions',
      profondeur: 'Facteur de profondeur compté',
      symboleProfondeur: 'profondeur',
      largeur: 'Largeur de la semelle',
      longueur: 'Longueur de la semelle',
      encastrement: 'Profondeur d’encastrement',
      epaisseur: 'Épaisseur de la semelle',
      gammaBeton: 'Poids volumique du béton',
      permanentes: 'Action verticale permanente',
      variables: 'Action verticale variable',
      horizontales: 'Action horizontale',
      moments: 'Moment',
      comportement: 'Comportement du sol',
      phi: 'Frottement interne drainé',
      cohesion: 'Cohésion drainée',
      cu: 'Résistance au cisaillement non drainée',
      eauInterface: 'Eau ou air peut atteindre l’interface',
      gamma: 'Poids volumique du sol',
      gammaSat: 'Poids volumique saturé du sol',
      baseRugueuse: 'Base rugueuse',
      nappe: 'Profondeur de la nappe',
      pression: 'Pression de calcul',
      nette: 'nette',
      brute: 'brute',
      modules: 'Module de déformation E_m',
      poisson: 'Coefficient de Poisson',
      raideur: 'Raideur de la semelle',
      rigide: 'rigide',
      souple: 'souple',
      couche: (n: number) => `Couche ${n}`,
      symboleCouche: (n: number) => `couche ${n}`,
      oui: 'oui',
      non: 'non',
      aucune: 'aucune',
    },
    generations: { '1re': '1re génération', '2e': '2e génération' },
    approches2e: { 'a+b': '(a) + (b)', c: '(c)', d: '(d)' },
    groupes: { elu: 'États limites ultimes', excentricite: 'Excentricité', tassement: 'Tassement' },
    groupesCoef: { geotechnique: 'Géotechnique', structure: 'Structure', sol: 'Sol', resistance: 'Résistance' },
    cartes: {
      portanceDrainee: 'Portance drainée',
      portanceNonDrainee: 'Portance non drainée',
      glissementDraine: 'Glissement drainé',
      glissementNonDraine: 'Glissement non drainé',
      excentricite: 'Excentricité',
      tassement: 'Tassement',
    },
    clauses: {
      portance1: 'annexe D',
      portance2: 'annexe B.4',
      glissement1: '§6.5.3',
      glissement2: '§5.6.4',
      excentricite1: '§6.5.4',
      excentricite2: '§5.6.3, tableau 5.3',
      tassement: 'EN 1997-3, annexe B',
    },
    sens: { defavorable: 'défavorable', favorable: 'favorable' },
    analyses: { drainee: 'drainée', nonDrainee: 'non drainée' },
    excentriciteDeux: { permanentes: 'actions permanentes', totales: 'actions totales' },
    alertes: {
      plafond04: 'Glissement non drainé plafonné à 0,4 N.',
      horsBase: 'résultante hors de la base : la portance n’est pas calculable dans ce cas.',
      soulevement: 'Soulèvement : la sous-pression égale ou dépasse la charge verticale.',
    },
    nonCalculable: 'non calculable',
    tassement: {
      pression: 'Pression',
      elastique: 'Élastique',
      couches: 'Couches',
      auCentre: 'au centre',
      auCoin: 'au coin',
      constat: 'Pas de jauge ni de seuil : l’admissible dépend de l’ouvrage. L’outil constate.',
    },
    volets: {
      elu: 'Portance et glissement, par combinaison',
      uniteElu: 'kN, m, m², kPa. Les deux sens et les deux analyses sont calculés ; la ligne surlignée est le cas gouvernant de chaque analyse.',
      facteurs: 'Facteurs de portance, cas gouvernant',
      tranches: 'Tassement, par tranche',
      coefficients: 'Coefficients partiels, avec leur source',
      hypotheses: 'Hypothèses',
    },
    colonnes: {
      combinaison: 'Combinaison',
      groupe: 'Groupe',
      coefficient: 'Coefficient',
      valeur: 'Valeur',
      source: 'Source',
      sens: 'Sens',
      analyse: 'Analyse',
      taux: 'Taux',
      effort: 'N (kN)',
      tranchant: 'T_d (kN)',
      excentricite: 'e_B (m)',
      largeur: 'B′ (m)',
      aire: 'A′ (m²)',
      qu: 'q_u (kPa)',
      rd: 'R_d (kN)',
      rdGl: 'R_d,gl (kN)',
      tauxGl: 'Taux gl.',
    },
    tranches: {
      z: 'z (m)',
      sigma0: 'σ′0 (kPa)',
      dSigmaCentre: 'Δσ centre (kPa)',
      dSigmaCoin: 'Δσ coin (kPa)',
      regime: 'Régime',
      centre: 'Centre (mm)',
      coin: 'Coin (mm)',
    },
    hypotheses: [
      'Sous-pression U = u A, sans coefficient : le niveau saisi est le niveau de calcul.',
      'Glissement drainé sans c′ ; tan δ = tan φ′ sur base rugueuse, tan(2φ′/3) sinon.',
      'Tassement sur dimensions nominales et charges caractéristiques.',
    ],
    dessin: {
      coupe: 'Coupe',
      plan: 'Plan',
      terrain: 'Terrain naturel',
      nappe: 'Nappe',
      horsDessin: 'au-delà du dessin',
      effort: 'N',
      tranchant: 'T',
      largeurEfficace: 'B′',
      aire: 'A′',
      coteB: 'B',
      coteL: 'L',
      coteD: 'D',
      coteEp: 'ép.',
      parMetre: 'par mètre',
      surfaceEfficace: 'Surface efficace',
      pointApplication: 'Point d’application',
      losange: 'Losange de service',
      ellipse: 'Ellipse de service',
    },
    resultats: 'Résultats',
    unites: { kN: 'kN', kNm: 'kN·m', m: 'm', m2: 'm²', kPa: 'kPa' },
  },
};

export type Textes = typeof FR;

const EN: Textes = {
  messages: {
    rienAExporter: 'No valid calculation to export: correct the input.',
    nouvelleVersion: 'A new version is available. Reload now?',
    nombreAttendu: (libelle: string, brut: string) => `${libelle}: number expected, got “${brut}”.`,
    phiBornes: "φ'k: must be strictly between 0 and 90°.",
    cuPositif: 'c_u,k: must be strictly greater than 0.',
    sigmaPPositif: (nom: string) => `${nom}, σ'p: must be strictly positive.`,
    elementAbsent: (selecteur: string) => `Element missing from the page: ${selecteur}`,
  },
  libelles: {
    epaisseur: 'Footing thickness',
    gammaBeton: 'γ concrete',
  },
  note: {
    element: 'Footing',
    portance: 'Bearing',
    glissement: 'Sliding',
    excentricite: 'Eccentricity',
    coefficients: 'Partial factors',
    legendeCoupe: 'Dimensioned section of the governing case: ground, water table, footing, resultant and rectangle on B′.',
    legendePlan: 'Plan of the governing case: effective area, point of application, service diamond and service ellipse.',
    recommandations1re: [
      'Recommended values: design approach DA1 (combinations 1 and 2) by default; DA2 and DA3 available.',
      'Partial factors: those of each combination, with their source in the dedicated panel.',
    ],
    recommandations2e: [
      'Recommended values: design approach (a) + (b) by default; (c) and (d) available.',
      'Recommended values: consequence class CC2 by default.',
      'Partial factors: those of each combination, with their source in the dedicated panel.',
    ],
    alertes: {
      excentriciteB: 'Eccentricity greater than a third of B.',
      excentriciteL: 'Eccentricity greater than a third of L.',
      elsPermanentes: 'Eccentricity under permanent actions beyond the serviceability limit.',
      elsTotales: 'Eccentricity under total actions beyond the serviceability limit.',
    },
    mention: 'No national annex is applied: the recommended values of the Eurocodes are used.',
    horsPerimetre:
      'Out of scope: circular footing, inclined base or ground, weak layer below the base, UPL uplift, passive resistance on the front, overall stability, national annex.',
  },
  vue: {
    entrees: {
      titre: 'Input data',
      generation: 'Generation',
      symboleGeneration: 'generation',
      approche: 'Approach',
      symboleApproche: 'approach',
      classe: 'Consequence class',
      symboleClasse: 'class',
      dimensions: 'Dimensions controlled',
      symboleDimensions: 'dimensions',
      profondeur: 'Depth factor counted',
      symboleProfondeur: 'depth',
      largeur: 'Base width',
      longueur: 'Base length',
      encastrement: 'Embedment depth',
      epaisseur: 'Base slab thickness',
      gammaBeton: 'Concrete unit weight',
      permanentes: 'Permanent vertical action',
      variables: 'Variable vertical action',
      horizontales: 'Horizontal action',
      moments: 'Moment',
      comportement: 'Soil behaviour',
      phi: 'Drained friction angle',
      cohesion: 'Drained cohesion',
      cu: 'Undrained shear strength',
      eauInterface: 'Water or air can reach the interface',
      gamma: 'Soil unit weight',
      gammaSat: 'Saturated soil unit weight',
      baseRugueuse: 'Rough base',
      nappe: 'Groundwater depth',
      pression: 'Design pressure',
      nette: 'net',
      brute: 'gross',
      modules: 'Deformation modulus E_m',
      poisson: 'Poisson ratio',
      raideur: 'Footing stiffness',
      rigide: 'rigid',
      souple: 'flexible',
      couche: (n: number) => `Layer ${n}`,
      symboleCouche: (n: number) => `layer ${n}`,
      oui: 'yes',
      non: 'no',
      aucune: 'none',
    },
    generations: { '1re': '1st generation', '2e': '2nd generation' },
    approches2e: { 'a+b': '(a) + (b)', c: '(c)', d: '(d)' },
    groupes: { elu: 'Ultimate limit states', excentricite: 'Eccentricity', tassement: 'Settlement' },
    groupesCoef: { geotechnique: 'Geotechnical', structure: 'Structural', sol: 'Soil', resistance: 'Resistance' },
    cartes: {
      portanceDrainee: 'Drained bearing',
      portanceNonDrainee: 'Undrained bearing',
      glissementDraine: 'Drained sliding',
      glissementNonDraine: 'Undrained sliding',
      excentricite: 'Eccentricity',
      tassement: 'Settlement',
    },
    clauses: {
      portance1: 'annex D',
      portance2: 'annex B.4',
      glissement1: '§6.5.3',
      glissement2: '§5.6.4',
      excentricite1: '§6.5.4',
      excentricite2: '§5.6.3, table 5.3',
      tassement: 'EN 1997-3, annex B',
    },
    sens: { defavorable: 'unfavourable', favorable: 'favourable' },
    analyses: { drainee: 'drained', nonDrainee: 'undrained' },
    excentriciteDeux: { permanentes: 'permanent actions', totales: 'total actions' },
    alertes: {
      plafond04: 'Undrained sliding capped at 0.4 N.',
      horsBase: 'resultant outside the base: bearing cannot be calculated in this case.',
      soulevement: 'Uplift: the uplift pressure equals or exceeds the vertical load.',
    },
    nonCalculable: 'not calculable',
    tassement: {
      pression: 'Pressure',
      elastique: 'Elastic',
      couches: 'Layers',
      auCentre: 'at centre',
      auCoin: 'at corner',
      constat: 'No gauge and no threshold: the allowable value depends on the structure. The tool records the result.',
    },
    volets: {
      elu: 'Bearing and sliding, per combination',
      uniteElu: 'kN, m, m², kPa. Both directions and both analyses are calculated; the highlighted row is the governing case of each analysis.',
      facteurs: 'Bearing factors, governing case',
      tranches: 'Settlement, per layer',
      coefficients: 'Partial factors, with their source',
      hypotheses: 'Assumptions',
    },
    colonnes: {
      combinaison: 'Combination',
      groupe: 'Group',
      coefficient: 'Coefficient',
      valeur: 'Value',
      source: 'Source',
      sens: 'Direction',
      analyse: 'Analysis',
      taux: 'Ratio',
      effort: 'N (kN)',
      tranchant: 'T_d (kN)',
      excentricite: 'e_B (m)',
      largeur: 'B′ (m)',
      aire: 'A′ (m²)',
      qu: 'q_u (kPa)',
      rd: 'R_d (kN)',
      rdGl: 'R_d,gl (kN)',
      tauxGl: 'Ratio sl.',
    },
    tranches: {
      z: 'z (m)',
      sigma0: 'σ′0 (kPa)',
      dSigmaCentre: 'Δσ centre (kPa)',
      dSigmaCoin: 'Δσ corner (kPa)',
      regime: 'Regime',
      centre: 'Centre (mm)',
      coin: 'Corner (mm)',
    },
    hypotheses: [
      'Uplift U = u A, without coefficient: the level entered is the design level.',
      'Drained sliding without c′; tan δ = tan φ′ on a rough base, tan(2φ′/3) otherwise.',
      'Settlement on nominal dimensions and characteristic loads.',
    ],
    dessin: {
      coupe: 'Section',
      plan: 'Plan',
      terrain: 'Ground level',
      nappe: 'Groundwater',
      horsDessin: 'beyond the drawing',
      effort: 'N',
      tranchant: 'T',
      largeurEfficace: 'B′',
      aire: 'A′',
      coteB: 'B',
      coteL: 'L',
      coteD: 'D',
      coteEp: 'th.',
      parMetre: 'per metre',
      surfaceEfficace: 'Effective area',
      pointApplication: 'Point of application',
      losange: 'Service diamond',
      ellipse: 'Service ellipse',
    },
    resultats: 'Results',
    unites: { kN: 'kN', kNm: 'kN·m', m: 'm', m2: 'm²', kPa: 'kPa' },
  },
};

export function textes(): Textes {
  return langueCourante() === 'en' ? EN : FR;
}

/**
 * Ponctuation de la langue courante : les assemblages « a : b » et « a ; b » portent
 * l'espace francaise ; en anglais, les deux-points et le point-virgule se collent au mot.
 */
export function ponctuer(s: string): string {
  return langueCourante() === 'en' ? s.replace(/ ([:;])(?=\s)/g, '$1') : s;
}

// --- Phrases du noyau : traduites en anglais seulement ; en francais, phrase() rend le texte intact --

/** Noms de grandeurs des messages du noyau. */
const NOMS: Record<string, string> = {
  'La largeur B de la semelle': 'Footing width B',
  'La longueur L de la semelle': 'Footing length L',
  'La profondeur D de la base': 'Embedment depth D',
  "L'épaisseur ep de la semelle": 'Footing thickness ep',
  'La profondeur de la nappe Dw': 'Groundwater depth Dw',
  'Le poids volumique gamma': 'Unit weight gamma',
  'Le poids volumique saturé gammaSat': 'Saturated unit weight gammaSat',
  'La cohésion': 'Cohesion',
  'La cohésion non drainée cu': 'Undrained cohesion cu',
  "Le module d'élasticité Em": 'Elastic modulus Em',
  "L'épaisseur de couche h": 'Layer thickness h',
  "L'indice des vides e0": 'Void ratio e0',
  "L'indice de compression Cc": 'Compression index Cc',
};

const sansApostrophe = (s: string): string => s.replace(/’/g, "'");

const nomEn = (nom: string): string => NOMS[nom] ?? NOMS[sansApostrophe(nom)] ?? nom;

/** Unites en toutes lettres dans les phrases du noyau. */
const unite = (u: string): string => (u === 'degrés' ? 'degrees' : u);

/** Sources des coefficients (tableaux de l'EN 1997-1, EN 1990, EN 1997-3) : traduites mot a mot. */
const sourceEn = (s: string): string =>
  s
    .replace(/valeur recommandée/g, 'recommended value')
    .replace(/facteur de conséquence/g, 'consequence factor')
    .replace(/tableau /g, 'table ')
    .replace(/sans coefficient/g, 'no factor')
    .replace(/, jeu /g, ', set ');

const EXACTES: Record<string, string> = {
  'Le coefficient de Poisson nu doit être compris entre 0 et 0,5 (-).': "Poisson's ratio nu must be between 0 and 0.5 (-).",
  "L'angle de frottement phi doit être strictement positif et inférieur à pi/2 (rad).":
    'The friction angle phi must be strictly positive and less than pi/2 (rad).',
  'Ni phi ni cu ne sont saisis : aucune analyse de portance possible.': 'Neither phi nor cu is entered: no bearing analysis is possible.',
  "L'épaisseur ep de la semelle ne peut pas dépasser la profondeur D (m).":
    'The footing thickness ep cannot exceed the embedment depth D (m).',
  'En semelle filante, les efforts H_L et M_L doivent être nuls (kN ou kN.m).':
    'In a strip footing, the forces H_L and M_L must be zero (kN or kN·m).',
  'La pression de préconsolidation sigmaP doit être un nombre strictement positif (kPa) : aucune valeur par défaut.':
    'The preconsolidation pressure sigmaP must be a strictly positive number (kPa): no default value.',
  "Les composantes de l'effort T doivent être des nombres finis (kN).": 'The components of the force T must be finite numbers (kN).',
  "Profil : gRv (R1) n'a pas de source ; une valeur sans provenance bloque le calcul.":
    'Profile: gRv (R1) has no source; a value without provenance blocks the calculation.',
};

export const phrase = traducteur(EXACTES, [
  [/^Format inconnu : « (.*) » ; attendu (.+)$/, (_m, recu: string, attendu: string) => `Unknown format: “${recu}”; expected ${attendu}.`],
  [/^(.+) doit être un nombre strictement positif \((.+)\)\.$/, (_m, nom: string, u: string) => `${nomEn(nom)} must be a strictly positive number (${unite(u)}).`],
  [/^(.+) doit être un nombre positif ou nul \((.+)\)\.$/, (_m, nom: string, u: string) => `${nomEn(nom)} must be a non-negative number (${unite(u)}).`],
  [/^(EN .*)$/, (_m, s: string) => sourceEn(s)],
]);
