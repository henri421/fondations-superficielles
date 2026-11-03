// Tests d'acceptation du noyau, 1re generation (PLAN.md, T5).
// Valeurs calculees a part, sans le code de l'outil. A ne pas modifier.
import { describe, expect, it } from 'vitest';
import { profil1g } from 'sol-ec7';
import { verifierSemelle1g, type DonneesSemelle } from '../src/index';

const ZERO = { H_BG: 0, H_BQ: 0, H_LG: 0, H_LQ: 0, M_BG: 0, M_BQ: 0, M_LG: 0, M_LQ: 0 };

export const SABLE: DonneesSemelle = {
  B: 2,
  L: 3,
  D: 1,
  ep: 0,
  gammaBeton: 25,
  actions: { ...ZERO, V_G: 800, V_Q: 300, H_BG: 50, H_BQ: 30, M_BG: 100, M_BQ: 40 },
  sol: { phi: 30, c: 0, cu: null, gamma: 18, gammaSat: 18, Dw: null, gammaW: 10, baseRugueuse: true, eauInterface: true },
};

export const ARGILE: DonneesSemelle = {
  ...SABLE,
  actions: { ...ZERO, V_G: 500, V_Q: 150, H_BG: 60, H_BQ: 40, M_BG: 50, M_BQ: 20 },
  sol: { phi: null, c: 0, cu: 60, gamma: 19, gammaSat: 19, Dw: null, gammaW: 10, baseRugueuse: true, eauInterface: true },
};

const p = profil1g();

describe('sol grenu', () => {
  const r = verifierSemelle1g(SABLE, 'DA2', p);
  const [def, fav] = r.combinaisons[0].cas;

  it('aucun calcul non drainé quand c_u n est pas saisi', () => {
    expect(def.nonDrainee).toBeNull();
    expect(r.tauxMax.portanceNonDrainee).toBeNull();
    expect(r.tauxMax.glissementNonDraine).toBeNull();
  });
  it('N défavorable', () => {
    expect(def.sens).toBe('defavorable');
    expect(def.N_d).toBeCloseTo(1530, 3);
    expect(def.T_d).toBeCloseTo(112.5, 3);
    const d = def.drainee!;
    expect(d.eB).toBeCloseTo(0.127, 2);
    expect(d.Bp).toBeCloseTo(1.745, 2);
    expect(d.Lp).toBe(3);
    expect(d.facteurs.m).toBeCloseTo(1.632, 2);
    expect(d.q_u).toBeCloseTo(590.511, 2);
    expect(d.R_d).toBeCloseTo(2208.214, 2);
    expect(d.taux).toBeCloseTo(0.693, 2);
  });
  it('glissement : N favorable sans Q', () => {
    expect(fav.sens).toBe('favorable');
    expect(fav.N_d).toBe(800);
    expect(fav.drainee!.glissement.R_d).toBeCloseTo(419.891, 2);
    expect(fav.drainee!.glissement.taux).toBeCloseTo(0.268, 2);
    expect(def.drainee!.glissement.taux).toBeCloseTo(0.14, 2);
  });
  it('gouvernant', () => {
    expect(r.tauxMax.portanceDrainee).toBeCloseTo(0.693, 2);
    expect(r.tauxMax.glissementDraine).toBeCloseTo(0.268, 2);
    expect(r.gouvernant).toMatchObject({ verification: 'portanceDrainee', combinaison: 'DA2', sens: 'defavorable' });
    expect(r.gouvernant.taux).toBeCloseTo(0.693, 2);
    expect(r.conforme).toBe(true);
    expect(r.alertes).toEqual([]);
    expect(r.els).toBeNull();
  });
});

describe('approches', () => {
  it('DA1 calcule les deux combinaisons et retient la pire', () => {
    const r = verifierSemelle1g(SABLE, 'DA1', p);
    expect(r.combinaisons).toHaveLength(2);
    const c1 = r.combinaisons[0].cas[0].drainee!;
    const c2 = r.combinaisons[1].cas[0].drainee!;
    expect(c1.taux).toBeCloseTo(0.495, 2);
    expect(r.combinaisons[1].cas[0].N_d).toBeCloseTo(1190, 3);
    expect(c2.q_u).toBeCloseTo(297.73, 2);
    expect(c2.taux).toBeCloseTo(0.764, 2);
    expect(r.gouvernant.combinaison).toBe('DA1-2');
    expect(r.tauxMax.glissementDraine).toBeCloseTo(0.244, 2);
  });
  it('DA3 : A1 sur les charges de structure, M2 sur le sol', () => {
    const r = verifierSemelle1g(SABLE, 'DA3', p);
    const [def, fav] = r.combinaisons[0].cas;
    expect(def.N_d).toBeCloseTo(1530, 3);
    expect(def.drainee!.q_u).toBeCloseTo(298.556, 2);
    expect(def.drainee!.taux).toBeCloseTo(0.979, 2);
    expect(fav.drainee!.glissement.taux).toBeCloseTo(0.304, 2);
    expect(r.conforme).toBe(true);
  });
});

describe('sol fin', () => {
  it('argile, DA2 : portance non drainée et limite 0,4 V', () => {
    const r = verifierSemelle1g(ARGILE, 'DA2', p);
    const [def, fav] = r.combinaisons[0].cas;
    expect(def.drainee).toBeNull();
    const n = def.nonDrainee!;
    expect(n.Bp).toBeCloseTo(1.783, 2);
    expect(n.q_u).toBeCloseTo(320.824, 2);
    expect(n.R_d).toBeCloseTo(1226.006, 2);
    expect(n.taux).toBeCloseTo(0.734, 2);
    expect(n.glissement.R_d).toBeCloseTo(291.818, 2);
    expect(n.glissement.limite04).toBe(false);
    expect(fav.nonDrainee!.glissement.R_d).toBeCloseTo(200, 3);
    expect(fav.nonDrainee!.glissement.limite04).toBe(true);
    expect(fav.nonDrainee!.glissement.taux).toBeCloseTo(0.705, 2);
    expect(r.tauxMax.portanceDrainee).toBeNull();
  });
  it('limite 0,4 V retirée si l eau et l air n atteignent pas l interface', () => {
    const d = { ...ARGILE, sol: { ...ARGILE.sol, eauInterface: false } };
    const [, fav] = verifierSemelle1g(d, 'DA2', p).combinaisons[0].cas;
    expect(fav.nonDrainee!.glissement.limite04).toBe(false);
    expect(fav.nonDrainee!.glissement.R_d).toBeCloseTo((1.61 * 3 * 60) / 1.1, 0);
  });
  it('phi et c_u saisis : les deux analyses, DA1', () => {
    const d = { ...ARGILE, sol: { ...ARGILE.sol, phi: 25, c: 5 } };
    const r = verifierSemelle1g(d, 'DA1', p);
    const [def2, fav2] = r.combinaisons[1].cas;
    expect(def2.drainee!.q_u).toBeCloseTo(212.296, 2);
    expect(def2.drainee!.taux).toBeCloseTo(0.613, 2);
    expect(def2.nonDrainee!.q_u).toBeCloseTo(230.37, 2);
    expect(def2.nonDrainee!.taux).toBeCloseTo(0.565, 2);
    expect(fav2.drainee!.glissement.taux).toBeCloseTo(0.6, 2);
    expect(r.tauxMax.portanceDrainee).toBeCloseTo(0.613, 2);
    expect(r.tauxMax.portanceNonDrainee).toBeCloseTo(0.565, 2);
    expect(r.tauxMax.glissementNonDraine).toBeCloseTo(0.705, 2);
    expect(r.gouvernant.verification).toBe('glissementNonDraine');
  });
});

describe('nappe et poids propre', () => {
  const d: DonneesSemelle = {
    ...SABLE,
    D: 1.5,
    ep: 0.5,
    sol: { ...SABLE.sol, gammaSat: 20, Dw: 1 },
  };
  it('DA2', () => {
    const r = verifierSemelle1g(d, 'DA2', p);
    const [def, fav] = r.combinaisons[0].cas;
    expect(def.U).toBeCloseTo(30, 6);
    expect(def.N_d).toBeCloseTo(1777.05, 2);
    expect(fav.N_d).toBeCloseTo(983, 3);
    expect(def.drainee!.eB).toBeCloseTo(0.112, 2);
    expect(def.drainee!.q_u).toBeCloseTo(615.45, 2);
    expect(def.drainee!.taux).toBeCloseTo(0.746, 2);
    expect(fav.drainee!.glissement.R_d).toBeCloseTo(500.195, 2);
  });
  it('épaisseur supérieure à D refusée', () => {
    expect(() => verifierSemelle1g({ ...d, ep: 2 }, 'DA2', p)).toThrow();
  });
  it('soulèvement constaté, pas de plantage', () => {
    const e: DonneesSemelle = {
      ...SABLE,
      D: 3,
      actions: { ...ZERO, V_G: 10, V_Q: 0 },
      sol: { ...SABLE.sol, gammaSat: 20, Dw: 0 },
    };
    const r = verifierSemelle1g(e, 'DA2', p);
    expect(r.alertes).toContain('soulevement');
    expect(r.combinaisons[0].cas[1].drainee!.taux).toBe(Number.POSITIVE_INFINITY);
    expect(r.conforme).toBe(false);
  });
});

describe('efforts dans les deux directions', () => {
  it('biaxial', () => {
    const d: DonneesSemelle = {
      ...SABLE,
      actions: { ...ZERO, V_G: 800, V_Q: 300, H_BG: 50, H_LG: 30, M_BG: 100, M_LG: 120 },
    };
    const [def] = verifierSemelle1g(d, 'DA2', p).combinaisons[0].cas;
    expect(def.T_d).toBeCloseTo(78.718, 2);
    const x = def.drainee!;
    expect(x.eB).toBeCloseTo(0.088, 2);
    expect(x.eL).toBeCloseTo(0.106, 2);
    expect(x.Bp).toBeCloseTo(1.824, 2);
    expect(x.Lp).toBeCloseTo(2.788, 2);
    expect(x.facteurs.m).toBeCloseTo(1.549, 2);
    expect(x.q_u).toBeCloseTo(636.666, 2);
    expect(x.taux).toBeCloseTo(0.662, 2);
  });
  it('L prime devient plus petit que B prime', () => {
    const d: DonneesSemelle = {
      ...SABLE,
      L: 2.2,
      actions: { ...ZERO, V_G: 800, V_Q: 0, H_LG: 40, M_LG: 240 },
    };
    const [def] = verifierSemelle1g(d, 'DA2', p).combinaisons[0].cas;
    const x = def.drainee!;
    expect(x.eL).toBeCloseTo(0.3, 3);
    expect(x.Bp).toBeCloseTo(1.6, 3);
    expect(x.Lp).toBeCloseTo(2, 3);
    expect(x.facteurs.m).toBeCloseTo(1.556, 2);
    expect(x.q_u).toBeCloseTo(621.03, 2);
    expect(x.taux).toBeCloseTo(0.761, 2);
  });
});

describe('filante et rugosité', () => {
  const fil: DonneesSemelle = {
    ...SABLE,
    B: 1.5,
    L: null,
    D: 0.8,
    actions: { ...ZERO, V_G: 200, V_Q: 80, H_BG: 15, H_BQ: 10, M_BG: 20, M_BQ: 10 },
    sol: { ...SABLE.sol, phi: 32 },
  };
  it('filante, par mètre', () => {
    const [def, fav] = verifierSemelle1g(fil, 'DA2', p).combinaisons[0].cas;
    expect(def.drainee!.Bp).toBeCloseTo(1.285, 2);
    expect(def.drainee!.Lp).toBeNull();
    expect(def.drainee!.q_u).toBeCloseTo(517.302, 2);
    expect(def.drainee!.taux).toBeCloseTo(0.822, 2);
    expect(fav.drainee!.glissement.taux).toBeCloseTo(0.31, 2);
  });
  it('filante : effort selon L refusé', () => {
    expect(() =>
      verifierSemelle1g({ ...fil, actions: { ...fil.actions, H_LG: 5 } }, 'DA2', p),
    ).toThrow();
  });
  it('base lisse : delta = 2/3 phi', () => {
    const d = { ...SABLE, sol: { ...SABLE.sol, baseRugueuse: false } };
    const [, fav] = verifierSemelle1g(d, 'DA2', p).combinaisons[0].cas;
    expect(fav.drainee!.glissement.R_d).toBeCloseTo(264.706, 2);
  });
});

describe('cas limites et refus', () => {
  it('résultante hors de la base : constat, pas de plantage', () => {
    const d = { ...SABLE, actions: { ...SABLE.actions, M_BG: 1500 } };
    const r = verifierSemelle1g(d, 'DA2', p);
    expect(r.alertes).toContain('hors_base');
    expect(r.combinaisons[0].cas[1].drainee!.horsBase).toBe(true);
    expect(r.combinaisons[0].cas[1].drainee!.taux).toBe(Number.POSITIVE_INFINITY);
    expect(r.conforme).toBe(false);
  });
  it('excentricité au-delà de B/3 : alerte', () => {
    const d = { ...SABLE, actions: { ...SABLE.actions, M_BG: 600, M_BQ: 0 } };
    expect(verifierSemelle1g(d, 'DA2', p).alertes).toContain('excentricite_B');
  });
  it('ni phi ni c_u : refus', () => {
    expect(() =>
      verifierSemelle1g({ ...SABLE, sol: { ...SABLE.sol, phi: null, cu: null } }, 'DA2', p),
    ).toThrow();
  });
  it('largeur nulle : refus', () => {
    expect(() => verifierSemelle1g({ ...SABLE, B: 0 }, 'DA2', p)).toThrow();
  });
  it('profil sans source : refus', () => {
    const q = profil1g();
    q.R2.gRv = { valeur: 1.4, source: '' };
    expect(() => verifierSemelle1g(SABLE, 'DA2', q)).toThrow(/source/);
  });
});

describe('tassement', () => {
  it('absent si non demandé', () => {
    expect(verifierSemelle1g(SABLE, 'DA2', p).tassement).toBeNull();
  });
  it('élastique, pression brute puis nette', () => {
    const brut = verifierSemelle1g(
      { ...SABLE, tassement: { pNette: false, elastique: { Em: 20, nu: 0.3, raideur: 'rigide' }, couches: null } },
      'DA2',
      p,
    ).tassement!;
    expect(brut.p).toBeCloseTo(183.333, 2);
    expect(brut.elastique!.Is).toBeCloseTo(1.02, 6);
    expect(brut.elastique!.s_mm).toBeCloseTo(17.017, 2);
    expect(brut.couches).toBeNull();
    const net = verifierSemelle1g(
      { ...SABLE, tassement: { pNette: true, elastique: { Em: 20, nu: 0.3, raideur: 'rigide' }, couches: null } },
      'DA2',
      p,
    ).tassement!;
    expect(net.p).toBeCloseTo(165.333, 2);
    expect(net.elastique!.s_mm).toBeCloseTo(15.347, 2);
  });
  it('élastique en filante : L/B plafonné à 10', () => {
    const t = verifierSemelle1g(
      {
        ...SABLE,
        B: 1.5,
        L: null,
        D: 0.8,
        actions: { ...ZERO, V_G: 200, V_Q: 80 },
        tassement: { pNette: false, elastique: { Em: 20, nu: 0.3, raideur: 'rigide' }, couches: null },
      },
      'DA2',
      p,
    ).tassement!;
    expect(t.elastique!.Is).toBe(2.13);
    expect(t.elastique!.s_mm).toBeCloseTo(27.136, 2);
  });
  it('œdométrique par couches', () => {
    const t = verifierSemelle1g(
      {
        ...SABLE,
        actions: { ...ZERO, V_G: 900, V_Q: 0 },
        tassement: {
          pNette: false,
          elastique: null,
          couches: [
            { h: 1, gammaEff: 9, Cc: 0.25, Cs: 0.04, e0: 0.8, sigmaP: 100 },
            { h: 0.6, gammaEff: 8, Cc: 0.4, Cs: 0.06, e0: 1.1, sigmaP: 60 },
          ],
        },
      },
      'DA2',
      p,
    ).tassement!;
    expect(t.couches!.centre_mm).toBeCloseTo(86.197, 2);
    expect(t.couches!.coin_mm).toBeCloseTo(17.483, 2);
  });
});
