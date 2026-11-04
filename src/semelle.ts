/**
 * Noyau de verification d'une semelle superficielle : portance, glissement,
 * excentricite de service et tassement.
 *
 * Unites : m, kN, kPa, kN/m3. Angles en radians dans `sol-ec7`, en degres dans
 * `DonneesSemelle`.
 *
 * Deux generations partagent le meme deroule : `verifierSemelle1g` (EN 1997-1
 * et -3, 1re generation) et `verifierSemelle2g` (EN 1997-1:2024 et -3:2025).
 * Les differences sont portees par la configuration `ConfigGeneration`.
 */

import {
  angleChargeT,
  combinaisons1g,
  combinaisons2g,
  contraintesBase,
  dimensionsEfficaces,
  portanceDrainee1g,
  portanceDrainee2g,
  portanceNonDrainee1g,
  portanceNonDrainee2g,
  tassementCouches,
  tassementElastique,
  verifierProfil1g,
  verifierProfil2g,
  type Approche,
  type Approche2e,
  type ClasseConsequences,
  type Profil1g,
  type Profil2g,
} from 'sol-ec7';

// --- Donnees et resultats -------------------------------------------------

export interface ActionsSemelle {
  V_G: number;
  V_Q: number;
  H_BG: number;
  H_BQ: number;
  H_LG: number;
  H_LQ: number;
  M_BG: number;
  M_BQ: number;
  M_LG: number;
  M_LQ: number;
}

export interface SolSemelle {
  /** Angle de frottement interne (degres), ou null. */
  phi: number | null;
  /** Cohesion (kPa). */
  c: number;
  /** Resistance non drainee (kPa), ou null. */
  cu: number | null;
  gamma: number;
  gammaSat: number;
  /** Profondeur de la nappe (m), ou null. */
  Dw: number | null;
  gammaW: number;
  baseRugueuse: boolean;
  eauInterface: boolean;
}

export interface CoucheSol {
  /** Epaisseur (m). */
  h: number;
  gammaEff: number;
  Cc: number;
  Cs: number;
  e0: number;
  sigmaP: number;
}

export interface DonneesTassement {
  pNette: boolean;
  elastique: { Em: number; nu: number; raideur: 'souple' | 'rigide' } | null;
  couches: CoucheSol[] | null;
}

export interface DonneesSemelle {
  B: number;
  /** Longueur (m) ; null pour une semelle filante. */
  L: number | null;
  D: number;
  /** Epaisseur de la semelle (m) ; 0 : poids propre non compte. */
  ep: number;
  gammaBeton: number;
  actions: ActionsSemelle;
  sol: SolSemelle;
  tassement?: DonneesTassement | null;
}

export type Sens = 'defavorable' | 'favorable';

export interface GlissementDraine {
  R_d: number;
  taux: number;
}

export interface GlissementNonDraine {
  R_d: number;
  taux: number;
  /** Vrai quand le plafond de 0,4 N (ou 0,4 N_rep, 5.15) s'applique. */
  limite04: boolean;
}

/** Facteurs de portance drainee rendus par `sol-ec7`, avec q_u. */
export interface FacteursDraine {
  Nq: number;
  Nc: number;
  Ngamma: number;
  sq: number;
  sc: number;
  sgamma: number;
  iq: number;
  ic: number;
  igamma: number;
  m: number;
  dq: number;
  dc: number;
  q_u: number;
}

export interface FacteursNonDraine {
  sc: number;
  ic: number;
  dc: number;
  q_u: number;
}

export interface CasDraine {
  /** Effort vertical effectif N' = N - U (kN). */
  N: number;
  eB: number;
  eL: number;
  Bp: number;
  Lp: number | null;
  A: number;
  horsBase: boolean;
  q_u: number;
  R_d: number;
  taux: number;
  facteurs: FacteursDraine;
  glissement: GlissementDraine;
}

export interface CasNonDraine {
  eB: number;
  eL: number;
  Bp: number;
  Lp: number | null;
  A: number;
  horsBase: boolean;
  q_u: number;
  R_d: number;
  taux: number;
  facteurs: FacteursNonDraine;
  glissement: GlissementNonDraine;
}

export interface CasSemelle {
  sens: Sens;
  N_d: number;
  T_d: number;
  U: number;
  drainee: CasDraine | null;
  nonDrainee: CasNonDraine | null;
}

export interface LigneTaux {
  valeur: number;
  limite: number;
  ok: boolean;
}

export interface EtatService {
  permanentes: LigneTaux;
  totales: LigneTaux;
}

export interface ResultatTassement {
  p: number;
  elastique: { Is: number; s_mm: number } | null;
  couches: { centre_mm: number; coin_mm: number; detail: ReturnType<typeof tassementCouches>['detail'] } | null;
}

export interface ResultatSemelle {
  combinaisons: { nom: string; cas: [CasSemelle, CasSemelle] }[];
  tauxMax: {
    portanceDrainee: number | null;
    portanceNonDrainee: number | null;
    glissementDraine: number | null;
    glissementNonDraine: number | null;
  };
  gouvernant: {
    verification: keyof ResultatSemelle['tauxMax'];
    combinaison: string;
    sens: Sens;
    taux: number;
  };
  conforme: boolean;
  alertes: string[];
  els: EtatService | null;
  tassement: ResultatTassement | null;
}

export interface Options2g {
  approche: Approche2e;
  consequences: ClasseConsequences;
  dimensionsControlees: boolean;
  profondeurComptee: boolean;
}

// --- Verification des saisies --------------------------------------------

function positif(v: number, nom: string, unite: string): number {
  if (!(Number.isFinite(v) && v > 0)) throw new Error(`${nom} doit être un nombre strictement positif (${unite}).`);
  return v;
}

function positifOuNul(v: number, nom: string, unite: string): number {
  if (!(Number.isFinite(v) && v >= 0)) throw new Error(`${nom} doit être un nombre positif ou nul (${unite}).`);
  return v;
}

function verifierSaisie(d: DonneesSemelle): void {
  positif(d.B, 'La largeur B de la semelle', 'm');
  positif(d.D, 'La profondeur D de la base', 'm');
  if (d.L !== null) positif(d.L, 'La longueur L de la semelle', 'm');
  positifOuNul(d.ep, "L'épaisseur ep de la semelle", 'm');
  if (d.ep > d.D) throw new Error("L'épaisseur ep de la semelle ne peut pas dépasser la profondeur D (m).");
  if (d.sol.phi === null && d.sol.cu === null) {
    throw new Error('Ni phi ni cu ne sont saisis : aucune analyse de portance possible.');
  }
  if (d.sol.Dw !== null) positifOuNul(d.sol.Dw, 'La profondeur de la nappe Dw', 'm');
  if (d.L === null) {
    const horsPlan = d.actions.H_LG !== 0 || d.actions.H_LQ !== 0 || d.actions.M_LG !== 0 || d.actions.M_LQ !== 0;
    if (horsPlan) {
      throw new Error("En semelle filante, les efforts H_L et M_L doivent être nuls (kN ou kN.m).");
    }
  }
}

// --- Configuration de generation -----------------------------------------

export interface ParametresDrainee {
  Bp: number;
  Lp: number | null;
  T: number;
  N: number;
  phi: number;
  c: number;
  gammaEff: number;
  q: number;
  theta: number;
  Df?: number;
}

export interface ParametresNonDrainee {
  Bp: number;
  Lp: number | null;
  T: number;
  cu: number;
  q: number;
  B: number;
  Df?: number;
}

type CombinaisonNoyau = ReturnType<typeof combinaisons1g>[number];

interface ConfigGeneration {
  combinaisons: CombinaisonNoyau[];
  verifierProfil: () => void;
  portanceDrainee: (p: ParametresDrainee) => FacteursDraine;
  portanceNonDrainee: (p: ParametresNonDrainee) => FacteursNonDraine;
  generation: 1 | 2;
  /** Largeur retenue pour e, B', U et A' (B nominal, ou Bd en 2e generation). */
  largeurCalcul: (B: number) => number;
  profondeurComptee: boolean;
}

function coefficient(v: { valeur: number }): number {
  return v.valeur;
}

// Facteurs nuls des cas degeneres (soulevement, resultante hors base), ou aucune
// portance n'est calculee.
const FACTEURS_DRAINEE_NULS: FacteursDraine = {
  Nq: 0, Nc: 0, Ngamma: 0, sq: 0, sc: 0, sgamma: 0, iq: 0, ic: 0, igamma: 0, m: 0, dq: 0, dc: 0, q_u: 0,
};

const FACTEURS_NON_DRAINEE_NULS: FacteursNonDraine = { sc: 0, ic: 0, dc: 0, q_u: 0 };

// --- Poids propre et nappe ------------------------------------------------

/** Poids propre G0 sur la surface nominale A0, EN 1997-1 6.5.2 (regle 2). */
function poidsPropre(d: DonneesSemelle, A0: number): number {
  if (!(d.ep > 0)) return 0;
  const hs = d.sol.Dw === null ? d.D - d.ep : Math.min(d.D - d.ep, d.sol.Dw);
  return A0 * (d.ep * d.gammaBeton + d.sol.gamma * hs + d.sol.gammaSat * (d.D - d.ep - hs));
}

// --- Glissement -----------------------------------------------------------

function glissementDraine(
  generation: 1 | 2,
  Np: number,
  phi: number,
  gPhi: number,
  gRh: number,
  T: number,
  rugueuse: boolean,
): GlissementDraine {
  let tanDelta: number;
  if (generation === 1) {
    // 1re generation : tan delta = tan phi (base rugueuse) ou tan(2 phi / 3).
    tanDelta = rugueuse ? Math.tan(phi) / gPhi : Math.tan((2 * phi) / 3) / gPhi;
  } else {
    // 2e generation (5.5.3) : tan delta = k tan phi / gamma_phi, k = 1 ou 2/3.
    const k = rugueuse ? 1 : 2 / 3;
    tanDelta = (k * Math.tan(phi)) / gPhi;
  }
  const R = (Np * tanDelta) / gRh;
  const taux = R === 0 ? (T === 0 ? 0 : Number.POSITIVE_INFINITY) : T / R;
  return { R_d: R, taux };
}

function glissementNonDraine(
  generation: 1 | 2,
  A: number,
  cud: number,
  Ncap: number,
  Nrep: number,
  gRh: number,
  T: number,
  rugueuse: boolean,
  eauInterface: boolean,
): GlissementNonDraine {
  const k = generation === 2 && !rugueuse ? 2 / 3 : 1;
  let R = (A * k * cud) / gRh;
  let limite04 = false;
  if (generation === 1) {
    if (eauInterface && R > 0.4 * Ncap) {
      R = 0.4 * Ncap;
      limite04 = true;
    }
  } else if (eauInterface && R > 0.4 * Nrep) {
    R = 0.4 * Nrep;
    limite04 = true;
  }
  const taux = R === 0 ? (T === 0 ? 0 : Number.POSITIVE_INFINITY) : T / R;
  return { R_d: R, taux, limite04 };
}

// --- Etat limite de service (2e generation, tableau 5.3) ------------------

function rapportExcentricite(M: number, N: number): number {
  if (N > 0) return M / N;
  return Number.POSITIVE_INFINITY;
}

function etatService(d: DonneesSemelle, G0: number, u: number): EtatService {
  const filante = d.L === null;
  const A0 = d.B * (d.L ?? 1);
  const U = u * A0;
  const Nperm = d.actions.V_G + G0 - U;
  const Ntot = Nperm + d.actions.V_Q;
  const eBp = rapportExcentricite(Math.abs(d.actions.M_BG), Nperm);
  const eLp = filante ? 0 : rapportExcentricite(Math.abs(d.actions.M_LG), Nperm);
  const eBt = rapportExcentricite(Math.abs(d.actions.M_BG + d.actions.M_BQ), Ntot);
  const eLt = filante ? 0 : rapportExcentricite(Math.abs(d.actions.M_LG + d.actions.M_LQ), Ntot);

  let vb: number;
  let vt: number;
  let lb: number;
  let lt: number;
  if (filante) {
    vb = eBp / d.B;
    vt = eBt / d.B;
    lb = 1 / 6;
    lt = 1 / 3;
  } else {
    const L = d.L as number;
    vb = eBp / d.B + eLp / L;
    vt = (eBt / d.B) ** 2 + (eLt / L) ** 2;
    lb = 1 / 6;
    lt = 1 / 9;
  }
  return {
    permanentes: { valeur: vb, limite: lb, ok: vb <= lb },
    totales: { valeur: vt, limite: lt, ok: vt <= lt },
  };
}

// --- Tassement ------------------------------------------------------------

function calculTassement(
  d: DonneesSemelle,
  G0: number,
  qEff: number,
  qTot: number,
): ResultatTassement {
  const filante = d.L === null;
  const A0 = d.B * (d.L ?? 1);
  const t = d.tassement as DonneesTassement;
  const p = (d.actions.V_G + G0 + d.actions.V_Q) / A0 - (t.pNette ? qTot : 0);

  let elastique: { Is: number; s_mm: number } | null = null;
  if (t.elastique !== null) {
    const largeur = filante ? d.B : Math.min(d.B, d.L as number);
    const LsurB = filante ? 10 : Math.max(d.B, d.L as number) / Math.min(d.B, d.L as number);
    elastique = tassementElastique({
      p,
      B: largeur,
      LsurB,
      nu: t.elastique.nu,
      Em: t.elastique.Em * 1000,
      raideur: t.elastique.raideur,
    });
  }

  let couches: ResultatTassement['couches'] = null;
  if (t.couches !== null) {
    const r = tassementCouches({
      q: p,
      B: d.B,
      L: d.L,
      sigmaBase: qEff,
      couches: t.couches,
    });
    couches = { centre_mm: r.centre_mm, coin_mm: r.coin_mm, detail: r.detail };
  }

  return { p, elastique, couches };
}

// --- Deroule commun -------------------------------------------------------

const TOUTES_VERIFICATIONS = [
  'portanceDrainee',
  'portanceNonDrainee',
  'glissementDraine',
  'glissementNonDraine',
] as const;

function verifierSemelle(d: DonneesSemelle, cfg: ConfigGeneration): ResultatSemelle {
  verifierSaisie(d);
  cfg.verifierProfil();

  const filante = d.L === null;
  const L = d.L;
  const A0nom = d.B * (L ?? 1);
  const G0 = poidsPropre(d, A0nom);
  const base = contraintesBase({
    D: d.D,
    Dw: d.sol.Dw,
    gamma: d.sol.gamma,
    gammaSat: d.sol.gammaSat,
    gammaW: d.sol.gammaW,
    B: d.B,
  });
  const Bcalc = cfg.largeurCalcul(d.B);
  const A0calc = Bcalc * (L ?? 1);
  const U = base.u * A0calc;
  const Nrep = d.actions.V_G + G0;

  const alertes: string[] = [];
  const combinaisons: ResultatSemelle['combinaisons'] = [];
  const tauxMax: ResultatSemelle['tauxMax'] = {
    portanceDrainee: null,
    portanceNonDrainee: null,
    glissementDraine: null,
    glissementNonDraine: null,
  };
  let gouvernant: ResultatSemelle['gouvernant'] | null = null;

  // Les saisies de `DonneesSemelle` sont en degres ; `sol-ec7` attend des radians.
  const phi = d.sol.phi;
  const phiRad = phi === null ? null : (phi * Math.PI) / 180;
  const cu = d.sol.cu;

  for (const combo of cfg.combinaisons) {
    const st = combo.structure;
    const gGdst = coefficient(st.gG_dst);
    const gGstb = coefficient(st.gG_stb);
    const gQdst = coefficient(st.gQ_dst);
    const gPhi = coefficient(combo.sol.gPhi);
    const gC = coefficient(combo.sol.gC);
    const gCu = coefficient(combo.sol.gCu);
    const gRv = coefficient(combo.resistance.gRv);
    const gRh = coefficient(combo.resistance.gRh);

    const TB = gGdst * d.actions.H_BG + gQdst * d.actions.H_BQ;
    const TL = gGdst * d.actions.H_LG + gQdst * d.actions.H_LQ;
    const MB = gGdst * d.actions.M_BG + gQdst * d.actions.M_BQ;
    const ML = gGdst * d.actions.M_LG + gQdst * d.actions.M_LQ;
    const T = Math.hypot(TB, TL);

    const cas: CasSemelle[] = [];
    for (const sens of ['defavorable', 'favorable'] as const) {
      const N =
        sens === 'defavorable'
          ? gGdst * (d.actions.V_G + G0) + gQdst * d.actions.V_Q
          : gGstb * (d.actions.V_G + G0);

      let drainee: CasDraine | null = null;
      if (phi !== null && phiRad !== null) {
        const Np = N - U;
        if (Np <= 0) {
          alertes.push('soulevement');
          drainee = {
            N: Np,
            eB: 0,
            eL: 0,
            Bp: Bcalc,
            Lp: L,
            A: 0,
            horsBase: false,
            q_u: 0,
            R_d: 0,
            taux: Number.POSITIVE_INFINITY,
            facteurs: FACTEURS_DRAINEE_NULS,
            glissement: { R_d: 0, taux: T === 0 ? 0 : Number.POSITIVE_INFINITY },
          };
        } else {
          const eB = Math.abs(MB) / Np;
          const eL = filante ? 0 : Math.abs(ML) / Np;
          if (eB > d.B / 3) alertes.push('excentricite_B');
          if (!filante && L !== null && eL > L / 3) alertes.push('excentricite_L');
          const dim = dimensionsEfficaces(Bcalc, L, eB, eL);
          const glissement = glissementDraine(cfg.generation, Np, phiRad, gPhi, gRh, T, d.sol.baseRugueuse);
          if (dim.horsBase) {
            alertes.push('hors_base');
            drainee = {
              N: Np,
              eB,
              eL,
              Bp: dim.Bp,
              Lp: dim.Lp,
              A: 0,
              horsBase: true,
              q_u: 0,
              R_d: 0,
              taux: Number.POSITIVE_INFINITY,
              facteurs: FACTEURS_DRAINEE_NULS,
              glissement,
            };
          } else {
            const p: ParametresDrainee = {
              Bp: dim.Bp,
              Lp: dim.Lp,
              T,
              N: Np,
              phi: Math.atan(Math.tan(phiRad) / gPhi),
              c: d.sol.c / gC,
              gammaEff: base.gammaEff,
              q: base.qEff,
              theta: angleChargeT(TB, TL, dim.permute),
            };
            if (cfg.generation === 2 && cfg.profondeurComptee) p.Df = d.D;
            const f = cfg.portanceDrainee(p);
            const Rd = (f.q_u * dim.A) / gRv;
            drainee = {
              N: Np,
              eB,
              eL,
              Bp: dim.Bp,
              Lp: dim.Lp,
              A: dim.A,
              horsBase: false,
              q_u: f.q_u,
              R_d: Rd,
              taux: Rd === 0 ? Number.POSITIVE_INFINITY : Np / Rd,
              facteurs: f,
              glissement,
            };
          }
        }
      }

      let nonDrainee: CasNonDraine | null = null;
      if (cu !== null) {
        const eB = N > 0 ? Math.abs(MB) / N : 0;
        const eL = filante ? 0 : N > 0 ? Math.abs(ML) / N : 0;
        if (N > 0) {
          if (eB > d.B / 3) alertes.push('excentricite_B');
          if (!filante && L !== null && eL > L / 3) alertes.push('excentricite_L');
        }
        if (N <= 0) {
          alertes.push('soulevement');
          nonDrainee = {
            eB,
            eL,
            Bp: Bcalc,
            Lp: L,
            A: 0,
            horsBase: false,
            q_u: 0,
            R_d: 0,
            taux: Number.POSITIVE_INFINITY,
            facteurs: FACTEURS_NON_DRAINEE_NULS,
            glissement: { R_d: 0, taux: T === 0 ? 0 : Number.POSITIVE_INFINITY, limite04: false },
          };
        } else {
          const dim = dimensionsEfficaces(Bcalc, L, eB, eL);
          const cud = cu / gCu;
          if (dim.horsBase) {
            alertes.push('hors_base');
            nonDrainee = {
              eB,
              eL,
              Bp: dim.Bp,
              Lp: dim.Lp,
              A: 0,
              horsBase: true,
              q_u: 0,
              R_d: 0,
              taux: Number.POSITIVE_INFINITY,
              facteurs: FACTEURS_NON_DRAINEE_NULS,
              glissement: {
                R_d: 0,
                taux: T === 0 ? 0 : Number.POSITIVE_INFINITY,
                limite04: false,
              },
            };
          } else {
            const p: ParametresNonDrainee = {
              Bp: dim.Bp,
              Lp: dim.Lp,
              T,
              cu: cud,
              q: base.qTot,
              B: Bcalc,
            };
            if (cfg.generation === 2 && cfg.profondeurComptee) p.Df = d.D;
            const f = cfg.portanceNonDrainee(p);
            const Rd = (f.q_u * dim.A) / gRv;
            nonDrainee = {
              eB,
              eL,
              Bp: dim.Bp,
              Lp: dim.Lp,
              A: dim.A,
              horsBase: false,
              q_u: f.q_u,
              R_d: Rd,
              taux: Rd === 0 ? Number.POSITIVE_INFINITY : N / Rd,
              facteurs: f,
              glissement: glissementNonDraine(
                cfg.generation,
                dim.A,
                cud,
                N,
                Nrep,
                gRh,
                T,
                d.sol.baseRugueuse,
                d.sol.eauInterface,
              ),
            };
          }
        }
      }

      const casSemelle: CasSemelle = { sens, N_d: N, T_d: T, U, drainee, nonDrainee };
      cas.push(casSemelle);

      const mesures: [keyof ResultatSemelle['tauxMax'], number | null][] = [
        ['portanceDrainee', drainee?.taux ?? null],
        ['portanceNonDrainee', nonDrainee?.taux ?? null],
        ['glissementDraine', drainee?.glissement.taux ?? null],
        ['glissementNonDraine', nonDrainee?.glissement.taux ?? null],
      ];
      for (const [cle, taux] of mesures) {
        if (taux === null) continue;
        const courant = tauxMax[cle];
        if (courant === null || taux > courant) tauxMax[cle] = taux;
        if (gouvernant === null || taux > gouvernant.taux) {
          gouvernant = { verification: cle, combinaison: combo.nom, sens, taux };
        }
      }
    }

    combinaisons.push({ nom: combo.nom, cas: [cas[0], cas[1]] });
  }

  let els: EtatService | null = null;
  if (cfg.generation === 2) {
    els = etatService(d, G0, base.u);
    if (!els.permanentes.ok) alertes.push('els_permanentes');
    if (!els.totales.ok) alertes.push('els_totales');
  }

  const tassement = d.tassement ? calculTassement(d, G0, base.qEff, base.qTot) : null;

  const conforme = TOUTES_VERIFICATIONS.every((cle) => {
    const v = tauxMax[cle];
    return v === null || v <= 1;
  });

  if (gouvernant === null) {
    gouvernant = { verification: 'portanceDrainee', combinaison: '', sens: 'defavorable', taux: 0 };
  }

  return {
    combinaisons,
    tauxMax,
    gouvernant,
    conforme,
    alertes: [...new Set(alertes)],
    els,
    tassement,
  };
}

// --- Portes d'entree ------------------------------------------------------

/**
 * Verification 1re generation : EN 1997-1:2004 (approches de calcul) et
 * EN 1997-3 pour la portance. `els` est null (hors perimetre de la 1re
 * generation).
 */
export function verifierSemelle1g(d: DonneesSemelle, approche: Approche, p: Profil1g): ResultatSemelle {
  return verifierSemelle(d, {
    combinaisons: combinaisons1g(approche, p),
    verifierProfil: () => verifierProfil1g(p),
    portanceDrainee: (q) => portanceDrainee1g(q),
    portanceNonDrainee: (q) => portanceNonDrainee1g(q),
    generation: 1,
    largeurCalcul: (B) => B,
    profondeurComptee: false,
  });
}

/**
 * Verification 2e generation : EN 1997-1:2024 et EN 1997-3:2025. La largeur
 * de calcul vaut B - 0,10 m quand les dimensions ne sont pas controlees
 * (5.6.3), et la profondeur n'entre dans la portance que si elle est comptee.
 */
export function verifierSemelle2g(d: DonneesSemelle, o: Options2g, p: Profil2g): ResultatSemelle {
  return verifierSemelle(d, {
    combinaisons: combinaisons2g(o.approche, o.consequences, p),
    verifierProfil: () => verifierProfil2g(p),
    portanceDrainee: (q) => portanceDrainee2g(q),
    portanceNonDrainee: (q) => portanceNonDrainee2g(q),
    generation: 2,
    largeurCalcul: (B) => (o.dimensionsControlees ? B : B - 0.1),
    profondeurComptee: o.profondeurComptee,
  });
}
