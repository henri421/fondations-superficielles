/**
 * La saisie, en chaines, et sa conversion en donnees du noyau. PUR.
 *
 * Une seule saisie pour les deux generations : basculer de l'une a l'autre ne
 * change aucune valeur saisie. Les champs propres a une generation sont
 * conserves quand l'autre est active, simplement ignores.
 */

import { lireNombre } from 'aedificium-ui';
import { combinaisons1g, combinaisons2g, profil1g, profil2g, type Approche, type Combinaison, type ClasseConsequences } from 'sol-ec7';
import {
  verifierSemelle1g,
  verifierSemelle2g,
  type DonneesSemelle,
  type Options2g,
  type ResultatSemelle,
} from '../../src/index';

export type Generation = '1re' | '2e';
export type Forme = 'isolee' | 'filante';
export type Comportement = 'draine' | 'non_draine' | 'les_deux';

export interface CoucheSaisie {
  h: string;
  gammaEff: string;
  Cc: string;
  Cs: string;
  e0: string;
  sigmaP: string;
}

/** Une seule saisie pour les deux generations : tout est du texte, sauf les choix. */
export interface Saisie {
  generation: Generation;
  approche1: Approche;
  approche2: Options2g['approche'];
  consequences: ClasseConsequences;
  dimensionsControlees: boolean;
  profondeurComptee: boolean;
  forme: Forme;
  B: string;
  L: string;
  D: string;
  ep: string;
  gammaBeton: string;
  VG: string;
  VQ: string;
  HBG: string;
  HBQ: string;
  MBG: string;
  MBQ: string;
  HLG: string;
  HLQ: string;
  MLG: string;
  MLQ: string;
  comportement: Comportement;
  phi: string;
  c: string;
  cu: string;
  gamma: string;
  gammaSat: string;
  baseRugueuse: boolean;
  eauInterface: boolean;
  avecNappe: boolean;
  Dw: string;
  avecTassement: boolean;
  pNette: boolean;
  avecElastique: boolean;
  Em: string;
  nu: string;
  raideur: 'rigide' | 'souple';
  couches: CoucheSaisie[];
}

export type Calcul =
  | { generation: '1re'; donnees: DonneesSemelle; approche: Approche }
  | { generation: '2e'; donnees: DonneesSemelle; options: Options2g };

export type Lecture = { ok: true; calcul: Calcul } | { ok: false; message: string };

/**
 * Le resultat du noyau, avec la generation, les coefficients de chaque combinaison
 * et la largeur nominale B saisie (le noyau rend B' <= L', donc B ne se deduit pas de B').
 */
export type Resultat = ResultatSemelle & { generation: Generation; coefficients: Combinaison[]; B: number };

export function saisieParDefaut(): Saisie {
  return {
    generation: '1re',
    approche1: 'DA1',
    approche2: 'a+b',
    consequences: 'CC2',
    dimensionsControlees: false,
    profondeurComptee: false,
    forme: 'isolee',
    B: '2,00',
    L: '3,00',
    D: '1,00',
    ep: '0,40',
    gammaBeton: '25',
    VG: '800',
    VQ: '300',
    HBG: '50',
    HBQ: '30',
    MBG: '100',
    MBQ: '40',
    HLG: '0',
    HLQ: '0',
    MLG: '0',
    MLQ: '0',
    comportement: 'draine',
    phi: '30',
    c: '0',
    cu: '60',
    gamma: '18',
    gammaSat: '20',
    baseRugueuse: true,
    eauInterface: true,
    avecNappe: true,
    Dw: '1,50',
    avecTassement: false,
    pNette: true,
    avecElastique: true,
    Em: '20',
    nu: '0,30',
    raideur: 'rigide',
    couches: [],
  };
}

class Refus extends Error {}

/** Lit un nombre, ou refuse en nommant le champ. */
function nb(brut: string, libelle: string): number {
  const v = lireNombre(brut);
  if (v === null) throw new Refus(`${libelle} : nombre attendu, reçu « ${brut} »`);
  return v;
}

function tassementDe(s: Saisie): DonneesSemelle['tassement'] {
  if (!s.avecTassement) return null;

  const elastique = s.avecElastique
    ? {
        Em: nb(s.Em, 'E_m'),
        nu: nb(s.nu, 'ν'),
        raideur: s.raideur,
      }
    : null;

  const couches =
    s.couches.length === 0
      ? null
      : s.couches.map((couche, i) => {
          const nom = `couche ${i + 1}`;
          const sigmaP = nb(couche.sigmaP, `${nom}, σ'p`);
          if (sigmaP <= 0) throw new Refus(`${nom}, σ'p : doit être strictement positif`);
          return {
            h: nb(couche.h, `${nom}, h`),
            gammaEff: nb(couche.gammaEff, `${nom}, γ'`),
            Cc: nb(couche.Cc, `${nom}, Cc`),
            Cs: nb(couche.Cs, `${nom}, Cs`),
            e0: nb(couche.e0, `${nom}, e0`),
            sigmaP,
          };
        });

  if (elastique === null && couches === null) return null;
  return { pNette: s.pNette, elastique, couches };
}

/** Convertit la saisie ; refuse en nommant le premier champ illisible. */
export function lireSaisie(s: Saisie): Lecture {
  try {
    const generation: Generation = s.generation === '2e' ? '2e' : '1re';
    const filante = s.forme === 'filante';

    const B = nb(s.B, 'B');
    const L = filante ? null : nb(s.L, 'L');
    const D = nb(s.D, 'D');
    const ep = nb(s.ep, 'Épaisseur de semelle');
    const gammaBeton = nb(s.gammaBeton, 'γ béton');

    const actions = {
      V_G: nb(s.VG, 'V_G'),
      V_Q: nb(s.VQ, 'V_Q'),
      H_BG: nb(s.HBG, 'H_BG'),
      H_BQ: nb(s.HBQ, 'H_BQ'),
      M_BG: nb(s.MBG, 'M_BG'),
      M_BQ: nb(s.MBQ, 'M_BQ'),
      H_LG: filante ? 0 : nb(s.HLG, 'H_LG'),
      H_LQ: filante ? 0 : nb(s.HLQ, 'H_LQ'),
      M_LG: filante ? 0 : nb(s.MLG, 'M_LG'),
      M_LQ: filante ? 0 : nb(s.MLQ, 'M_LQ'),
    };

    let phi: number | null = null;
    let c = 0;
    let cu: number | null = null;
    if (s.comportement === 'draine' || s.comportement === 'les_deux') {
      phi = nb(s.phi, "φ'k");
      if (!(phi > 0 && phi < 90)) throw new Refus("φ'k : doit être strictement compris entre 0 et 90°");
      c = nb(s.c, "c'k");
    }
    if (s.comportement === 'non_draine' || s.comportement === 'les_deux') {
      cu = nb(s.cu, 'c_u,k');
      if (cu <= 0) throw new Refus('c_u,k : doit être strictement supérieur à 0');
    }

    const sol = {
      phi,
      c,
      cu,
      gamma: nb(s.gamma, 'γ'),
      gammaSat: nb(s.gammaSat, 'γsat'),
      Dw: s.avecNappe ? nb(s.Dw, 'Dw') : null,
      gammaW: 10,
      baseRugueuse: s.baseRugueuse,
      eauInterface: s.eauInterface,
    };

    const donnees: DonneesSemelle = { B, L, D, ep, gammaBeton, actions, sol, tassement: tassementDe(s) };

    if (generation === '1re') {
      return { ok: true, calcul: { generation: '1re', donnees, approche: s.approche1 } };
    }

    return {
      ok: true,
      calcul: {
        generation: '2e',
        donnees,
        options: {
          approche: s.approche2,
          consequences: s.consequences,
          dimensionsControlees: s.dimensionsControlees,
          profondeurComptee: s.profondeurComptee,
        },
      },
    };
  } catch (e) {
    if (e instanceof Refus) return { ok: false, message: e.message };
    throw e;
  }
}

export function verifier(calcul: Calcul): Resultat {
  if (calcul.generation === '1re') {
    const p = profil1g();
    return {
      ...verifierSemelle1g(calcul.donnees, calcul.approche, p),
      generation: '1re',
      coefficients: combinaisons1g(calcul.approche, p),
      B: calcul.donnees.B,
    };
  }
  const p = profil2g();
  return {
    ...verifierSemelle2g(calcul.donnees, calcul.options, p),
    generation: '2e',
    coefficients: combinaisons2g(calcul.options.approche, calcul.options.consequences, p),
    B: calcul.donnees.B,
  };
}

const FORMAT = 'fondations-superficielles/1';

export function serialiser(s: Saisie): string {
  return JSON.stringify({ format: FORMAT, ...s }, null, 2);
}

function texteOu(valeur: unknown, defaut: string): string {
  return typeof valeur === 'string' ? valeur : defaut;
}

function boolOu(valeur: unknown, defaut: boolean): boolean {
  return typeof valeur === 'boolean' ? valeur : defaut;
}

function choixOu<T extends string>(valeur: unknown, autorisees: readonly T[], defaut: T): T {
  return typeof valeur === 'string' && (autorisees as readonly string[]).includes(valeur)
    ? (valeur as T)
    : defaut;
}

function coucheOu(valeur: unknown): CoucheSaisie | null {
  if (typeof valeur !== 'object' || valeur === null) return null;
  const o = valeur as Record<string, unknown>;
  for (const cle of ['h', 'gammaEff', 'Cc', 'Cs', 'e0', 'sigmaP'] as const) {
    if (typeof o[cle] !== 'string') return null;
  }
  return {
    h: o.h as string,
    gammaEff: o.gammaEff as string,
    Cc: o.Cc as string,
    Cs: o.Cs as string,
    e0: o.e0 as string,
    sigmaP: o.sigmaP as string,
  };
}

/** Relit un document enregistre ; les champs absents prennent leur valeur par defaut. */
export function relire(contenu: string): Saisie {
  const brut = JSON.parse(contenu) as Record<string, unknown>;
  if (brut.format !== FORMAT) throw new Error(`Format inconnu : « ${String(brut.format)} » ; attendu ${FORMAT}`);

  const d = saisieParDefaut();
  const couches = Array.isArray(brut.couches)
    ? brut.couches.flatMap((valeur) => {
        const couche = coucheOu(valeur);
        return couche === null ? [] : [couche];
      })
    : d.couches;

  return {
    generation: choixOu(brut.generation, ['1re', '2e'] as const, d.generation),
    approche1: choixOu(brut.approche1, ['DA1', 'DA2', 'DA3'] as const, d.approche1),
    approche2: choixOu(brut.approche2, ['a+b', 'c', 'd'] as const, d.approche2),
    consequences: choixOu(brut.consequences, ['CC1', 'CC2', 'CC3'] as const, d.consequences),
    dimensionsControlees: boolOu(brut.dimensionsControlees, d.dimensionsControlees),
    profondeurComptee: boolOu(brut.profondeurComptee, d.profondeurComptee),
    forme: choixOu(brut.forme, ['isolee', 'filante'] as const, d.forme),
    B: texteOu(brut.B, d.B),
    L: texteOu(brut.L, d.L),
    D: texteOu(brut.D, d.D),
    ep: texteOu(brut.ep, d.ep),
    gammaBeton: texteOu(brut.gammaBeton, d.gammaBeton),
    VG: texteOu(brut.VG, d.VG),
    VQ: texteOu(brut.VQ, d.VQ),
    HBG: texteOu(brut.HBG, d.HBG),
    HBQ: texteOu(brut.HBQ, d.HBQ),
    MBG: texteOu(brut.MBG, d.MBG),
    MBQ: texteOu(brut.MBQ, d.MBQ),
    HLG: texteOu(brut.HLG, d.HLG),
    HLQ: texteOu(brut.HLQ, d.HLQ),
    MLG: texteOu(brut.MLG, d.MLG),
    MLQ: texteOu(brut.MLQ, d.MLQ),
    comportement: choixOu(brut.comportement, ['draine', 'non_draine', 'les_deux'] as const, d.comportement),
    phi: texteOu(brut.phi, d.phi),
    c: texteOu(brut.c, d.c),
    cu: texteOu(brut.cu, d.cu),
    gamma: texteOu(brut.gamma, d.gamma),
    gammaSat: texteOu(brut.gammaSat, d.gammaSat),
    baseRugueuse: boolOu(brut.baseRugueuse, d.baseRugueuse),
    eauInterface: boolOu(brut.eauInterface, d.eauInterface),
    avecNappe: boolOu(brut.avecNappe, d.avecNappe),
    Dw: texteOu(brut.Dw, d.Dw),
    avecTassement: boolOu(brut.avecTassement, d.avecTassement),
    pNette: boolOu(brut.pNette, d.pNette),
    avecElastique: boolOu(brut.avecElastique, d.avecElastique),
    Em: texteOu(brut.Em, d.Em),
    nu: texteOu(brut.nu, d.nu),
    raideur: choixOu(brut.raideur, ['rigide', 'souple'] as const, d.raideur),
    couches,
  };
}
