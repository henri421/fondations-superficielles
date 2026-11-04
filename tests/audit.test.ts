// Ajouts de l'audit du noyau (PLAN.md, T3 et T6).
import { describe, expect, it } from 'vitest';
import { portanceDrainee2g, profil2g } from 'sol-ec7';
import { verifierSemelle2g, type DonneesSemelle } from '../src/index';

const ZERO = { H_BG: 0, H_BQ: 0, H_LG: 0, H_LQ: 0, M_BG: 0, M_BQ: 0, M_LG: 0, M_LQ: 0 };

const ARGILE: DonneesSemelle = {
  B: 2,
  L: 3,
  D: 1,
  ep: 0,
  gammaBeton: 25,
  actions: { ...ZERO, V_G: 500, V_Q: 150, H_BG: 60, H_BQ: 40, M_BG: 50, M_BQ: 20 },
  sol: { phi: null, c: 0, cu: 60, gamma: 19, gammaSat: 19, Dw: null, gammaW: 10, baseRugueuse: true, eauInterface: false },
};

describe('audit', () => {
  it('5.15 : sans eau ni air a l interface, pas de plafond 0,4 N_rep', () => {
    const o = { approche: 'd', consequences: 'CC2', dimensionsControlees: false, profondeurComptee: false } as const;
    const [def] = verifierSemelle2g(ARGILE, o, profil2g()).combinaisons[0].cas;
    expect(def.nonDrainee!.glissement.R_d).toBeCloseTo(275.454, 2);
    expect(def.nonDrainee!.glissement.limite04).toBe(false);
  });
  it('ic draine borne a 0', () => {
    const r = portanceDrainee2g({ Bp: 2, Lp: null, T: 500, N: 500, phi: Math.PI / 6, c: 10, gammaEff: 18, q: 18 });
    expect(r.ic).toBe(0);
    expect(r.q_u).toBeGreaterThanOrEqual(0);
  });
});
