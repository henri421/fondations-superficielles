// Tests d'acceptation du noyau, 2e generation (PLAN.md, T6).
// Valeurs calculees a part, sans le code de l'outil. A ne pas modifier.
import { describe, expect, it } from 'vitest';
import { profil2g } from 'sol-ec7';
import { verifierSemelle2g, type DonneesSemelle, type Options2g } from '../src/index';

const ZERO = { H_BG: 0, H_BQ: 0, H_LG: 0, H_LQ: 0, M_BG: 0, M_BQ: 0, M_LG: 0, M_LQ: 0 };

const SABLE: DonneesSemelle = {
  B: 2,
  L: 3,
  D: 1,
  ep: 0,
  gammaBeton: 25,
  actions: { ...ZERO, V_G: 800, V_Q: 300, H_BG: 50, H_BQ: 30, M_BG: 100, M_BQ: 40 },
  sol: { phi: 30, c: 0, cu: null, gamma: 18, gammaSat: 18, Dw: null, gammaW: 10, baseRugueuse: true, eauInterface: true },
};

const ARGILE: DonneesSemelle = {
  ...SABLE,
  actions: { ...ZERO, V_G: 500, V_Q: 150, H_BG: 60, H_BQ: 40, M_BG: 50, M_BQ: 20 },
  sol: { phi: null, c: 0, cu: 60, gamma: 19, gammaSat: 19, Dw: null, gammaW: 10, baseRugueuse: true, eauInterface: true },
};

const p = profil2g();
const opt = (o: Partial<Options2g> = {}): Options2g => ({
  approche: 'a+b',
  consequences: 'CC2',
  dimensionsControlees: false,
  profondeurComptee: false,
  ...o,
});

describe('combinaisons du tableau 5.2', () => {
  it('(a) + (b), largeur diminuée de 0,10 m', () => {
    const r = verifierSemelle2g(SABLE, opt(), p);
    expect(r.combinaisons.map((c) => c.nom)).toEqual(['(a)', '(b)']);
    const a = r.combinaisons[0].cas[0].drainee!;
    expect(a.Bp).toBeCloseTo(1.645, 2);
    expect(a.q_u).toBeCloseTo(598.604, 2);
    expect(a.taux).toBeCloseTo(0.518, 2);
    const b = r.combinaisons[1].cas[0].drainee!;
    expect(r.combinaisons[1].cas[0].N_d).toBeCloseTo(1190, 3);
    expect(b.q_u).toBeCloseTo(309.486, 2);
    expect(b.taux).toBeCloseTo(0.779, 2);
    expect(r.gouvernant).toMatchObject({ verification: 'portanceDrainee', combinaison: '(b)', sens: 'defavorable' });
    expect(r.tauxMax.glissementDraine).toBeCloseTo(0.244, 2);
  });
  it('(c)', () => {
    const r = verifierSemelle2g(SABLE, opt({ approche: 'c' }), p);
    const [def, fav] = r.combinaisons[0].cas;
    expect(def.drainee!.q_u).toBeCloseTo(310.37, 2);
    expect(def.drainee!.taux).toBeCloseTo(0.999, 2);
    expect(fav.drainee!.glissement.taux).toBeCloseTo(0.304, 2);
  });
  it('(d)', () => {
    const r = verifierSemelle2g(SABLE, opt({ approche: 'd' }), p);
    const [def, fav] = r.combinaisons[0].cas;
    expect(def.drainee!.R_d).toBeCloseTo(2110.206, 2);
    expect(def.drainee!.taux).toBeCloseTo(0.725, 2);
    expect(fav.drainee!.glissement.R_d).toBeCloseTo(419.891, 2);
  });
  it('CC3 et dimensions contrôlées', () => {
    const r = verifierSemelle2g(SABLE, opt({ consequences: 'CC3', dimensionsControlees: true }), p);
    const a = r.combinaisons[0].cas[0];
    expect(a.N_d).toBeCloseTo(1683, 3);
    expect(a.drainee!.Bp).toBeCloseTo(1.745, 2);
    expect(a.drainee!.q_u).toBeCloseTo(615, 2);
    const b = r.combinaisons[1].cas[0].drainee!;
    expect(b.q_u).toBeCloseTo(248.407, 2);
    expect(b.taux).toBeCloseTo(0.915, 2);
  });
  it('profondeur comptée', () => {
    const r = verifierSemelle2g(SABLE, opt({ approche: 'd', dimensionsControlees: true, profondeurComptee: true }), p);
    const def = r.combinaisons[0].cas[0].drainee!;
    expect(def.q_u).toBeCloseTo(677.437, 2);
    expect(def.taux).toBeCloseTo(0.604, 2);
  });
  it('filante', () => {
    const d: DonneesSemelle = {
      ...SABLE,
      B: 1.5,
      L: null,
      D: 0.8,
      actions: { ...ZERO, V_G: 200, V_Q: 80, H_BG: 15, H_BQ: 10, M_BG: 20, M_BQ: 10 },
      sol: { ...SABLE.sol, phi: 32 },
    };
    const r = verifierSemelle2g(d, opt(), p);
    expect(r.combinaisons[0].cas[0].drainee!.Bp).toBeCloseTo(1.185, 2);
    expect(r.combinaisons[1].cas[0].drainee!.q_u).toBeCloseTo(257.637, 2);
    expect(r.combinaisons[1].cas[0].drainee!.taux).toBeCloseTo(0.998, 2);
    expect(r.conforme).toBe(true);
  });
});

describe('interface et sol fin', () => {
  it('base lisse : tan delta = 2/3 tan phi', () => {
    const d = { ...SABLE, sol: { ...SABLE.sol, baseRugueuse: false } };
    const [, fav] = verifierSemelle2g(d, opt({ approche: 'd' }), p).combinaisons[0].cas;
    expect(fav.drainee!.glissement.R_d).toBeCloseTo(279.927, 2);
    expect(fav.drainee!.glissement.taux).toBeCloseTo(0.402, 2);
  });
  it('argile : limite sur 0,4 N_rep favorable', () => {
    const [def, fav] = verifierSemelle2g(ARGILE, opt({ approche: 'd' }), p).combinaisons[0].cas;
    expect(def.nonDrainee!.q_u).toBeCloseTo(316.001, 2);
    expect(def.nonDrainee!.taux).toBeCloseTo(0.79, 2);
    expect(def.nonDrainee!.glissement.R_d).toBeCloseTo(200, 3);
    expect(def.nonDrainee!.glissement.limite04).toBe(true);
    expect(fav.nonDrainee!.glissement.R_d).toBeCloseTo(200, 3);
  });
  it('argile, base lisse : k_interface = 2/3', () => {
    const d = { ...ARGILE, sol: { ...ARGILE.sol, baseRugueuse: false } };
    const [def, fav] = verifierSemelle2g(d, opt({ approche: 'd' }), p).combinaisons[0].cas;
    expect(def.nonDrainee!.glissement.R_d).toBeCloseTo(183.636, 2);
    expect(def.nonDrainee!.glissement.limite04).toBe(false);
    expect(fav.nonDrainee!.glissement.taux).toBeCloseTo(0.856, 2);
  });
});

describe('excentricité de service, tableau 5.3', () => {
  it('rectangle', () => {
    const e = verifierSemelle2g(SABLE, opt(), p).els!;
    expect(e.permanentes.valeur).toBeCloseTo(0.0625, 6);
    expect(e.permanentes.limite).toBeCloseTo(1 / 6, 9);
    expect(e.permanentes.ok).toBe(true);
    expect(e.totales.valeur).toBeCloseTo(0.00405, 4);
    expect(e.totales.limite).toBeCloseTo(1 / 9, 9);
    expect(e.totales.ok).toBe(true);
  });
  it('rectangle, deux directions', () => {
    const d: DonneesSemelle = { ...SABLE, actions: { ...ZERO, V_G: 800, V_Q: 0, M_BG: 100, M_LG: 120 } };
    const e = verifierSemelle2g(d, opt(), p).els!;
    expect(e.permanentes.valeur).toBeCloseTo(0.1125, 6);
    expect(e.totales.valeur).toBeCloseTo(0.00641, 4);
  });
  it('rectangle : limite permanente dépassée', () => {
    const d: DonneesSemelle = { ...SABLE, actions: { ...SABLE.actions, M_BG: 300, M_BQ: 0 } };
    const r = verifierSemelle2g(d, opt(), p);
    expect(r.els!.permanentes.valeur).toBeCloseTo(0.1875, 6);
    expect(r.els!.permanentes.ok).toBe(false);
    expect(r.alertes).toContain('els_permanentes');
  });
  it('filante', () => {
    const d: DonneesSemelle = { ...SABLE, B: 1.5, L: null, actions: { ...ZERO, V_G: 200, V_Q: 80, M_BG: 20, M_BQ: 10 } };
    const e = verifierSemelle2g(d, opt(), p).els!;
    expect(e.permanentes.valeur).toBeCloseTo(0.06667, 4);
    expect(e.permanentes.limite).toBeCloseTo(1 / 6, 9);
    expect(e.totales.valeur).toBeCloseTo(0.07143, 4);
    expect(e.totales.limite).toBeCloseTo(1 / 3, 9);
  });
});

describe('refus', () => {
  it('profil sans source', () => {
    const q = profil2g();
    q.gRN = { valeur: 1.4, source: '' };
    expect(() => verifierSemelle2g(SABLE, opt(), q)).toThrow(/source/);
  });
});
