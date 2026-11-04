/** Squelette (T1) : les types sont imposes par le plan, le corps reste a ecrire. */

import type { Approche, Combinaison, ClasseConsequences } from 'sol-ec7';
import type { DonneesSemelle, Options2g, ResultatSemelle } from '../../src/index';

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

/** Le resultat du noyau, avec la generation et les coefficients de chaque combinaison. */
export type Resultat = ResultatSemelle & { generation: Generation; coefficients: Combinaison[] };

export function saisieParDefaut(): Saisie {
  throw new Error('a ecrire');
}

export function lireSaisie(_s: Saisie): Lecture {
  throw new Error('a ecrire');
}

export function verifier(_calcul: Calcul): Resultat {
  throw new Error('a ecrire');
}

export function serialiser(_s: Saisie): string {
  throw new Error('a ecrire');
}

export function relire(_contenu: string): Saisie {
  throw new Error('a ecrire');
}
