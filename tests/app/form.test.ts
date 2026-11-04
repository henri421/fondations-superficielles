/** T1 : la saisie, sa lecture, son enregistrement. */

import { describe, expect, it } from 'vitest';
import { profil1g, profil2g } from 'sol-ec7';
import { lireSaisie, relire, saisieParDefaut, serialiser, verifier, type Saisie } from '../../app/src/form';
import { verifierSemelle1g, verifierSemelle2g } from '../../src/index';
import { argile, avecTassement, filante } from './_commun';

function refus(s: Saisie): string {
  const l = lireSaisie(s);
  if (l.ok) throw new Error('un refus etait attendu');
  return l.message;
}

function lue(s: Saisie) {
  const l = lireSaisie(s);
  if (!l.ok) throw new Error(l.message);
  return l.calcul;
}

describe('valeurs par defaut', () => {
  it('le cas de la maquette, en 1re generation, DA1', () => {
    const c = lue(saisieParDefaut());
    expect(c.generation).toBe('1re');
    if (c.generation !== '1re') throw new Error('1re generation attendue');
    expect(c.approche).toBe('DA1');
    expect(c.donnees).toEqual({
      B: 2,
      L: 3,
      D: 1,
      ep: 0.4,
      gammaBeton: 25,
      actions: { V_G: 800, V_Q: 300, H_BG: 50, H_BQ: 30, H_LG: 0, H_LQ: 0, M_BG: 100, M_BQ: 40, M_LG: 0, M_LQ: 0 },
      sol: { phi: 30, c: 0, cu: null, gamma: 18, gammaSat: 20, Dw: 1.5, gammaW: 10, baseRugueuse: true, eauInterface: true },
      tassement: null,
    });
  });

  it('verifier rend le resultat du noyau, dans les deux generations', () => {
    const c1 = lue(saisieParDefaut());
    const r1 = verifier(c1);
    expect(r1.generation).toBe('1re');
    expect(r1.tauxMax.portanceDrainee).toBeCloseTo(0.922, 3);
    expect(r1.tauxMax).toEqual(verifierSemelle1g(c1.donnees, 'DA1', profil1g()).tauxMax);
    const c2 = lue({ ...saisieParDefaut(), generation: '2e' });
    const r2 = verifier(c2);
    expect(r2.generation).toBe('2e');
    expect(r2.tauxMax.portanceDrainee).toBeCloseTo(0.953, 3);
    if (c2.generation !== '2e') throw new Error('2e generation attendue');
    expect(r2.tauxMax).toEqual(verifierSemelle2g(c2.donnees, c2.options, profil2g()).tauxMax);
  });

  it('verifier rend les coefficients de chaque combinaison, avec leur source', () => {
    const r = verifier(lue(saisieParDefaut()));
    expect(r.coefficients.map((c) => c.nom)).toEqual(['DA1-1', 'DA1-2']);
    expect(r.coefficients[1].sol.gPhi.valeur).toBe(1.25);
    expect(r.coefficients[1].sol.gPhi.source).toContain('tableau A.4');
  });

  it('2e generation : (a) + (b), CC2, dimensions non controlees, profondeur non comptee', () => {
    const c = lue({ ...saisieParDefaut(), generation: '2e' });
    if (c.generation !== '2e') throw new Error('2e generation attendue');
    expect(c.options).toEqual({ approche: 'a+b', consequences: 'CC2', dimensionsControlees: false, profondeurComptee: false });
  });
});

describe('lecture', () => {
  it('virgule decimale acceptee', () => {
    expect(lue({ ...saisieParDefaut(), B: '2,5' }).donnees.B).toBe(2.5);
  });

  it('un champ illisible est refuse en le nommant', () => {
    expect(refus({ ...saisieParDefaut(), B: 'abc' })).toMatch(/^B : nombre attendu/);
    expect(refus({ ...saisieParDefaut(), VG: '' })).toMatch(/nombre attendu/);
    expect(refus({ ...saisieParDefaut(), phi: 'x' })).toMatch(/nombre attendu/);
  });

  it('phi et c_u nuls ou negatifs : refus a la saisie, meme si le cas serait degenere', () => {
    for (const phi of ['0', '-5', '90']) expect(refus({ ...saisieParDefaut(), phi })).toMatch(/φ/);
    for (const cu of ['0', '-5']) expect(refus(argile({ cu }))).toMatch(/c_u/);
  });
});

describe('champs masques', () => {
  it('filante : L et les lignes selon L ne sont pas lus', () => {
    const c = lue(filante({ L: 'abc', HLG: 'abc', HLQ: '5', MLG: 'x', MLQ: '9' }));
    expect(c.donnees.L).toBeNull();
    expect(c.donnees.actions).toMatchObject({ H_LG: 0, H_LQ: 0, M_LG: 0, M_LQ: 0 });
  });

  it('drainee : c_u n est pas lu', () => {
    const c = lue({ ...saisieParDefaut(), cu: 'abc' });
    expect(c.donnees.sol.phi).toBe(30);
    expect(c.donnees.sol.cu).toBeNull();
  });

  it('non drainee : phi et c ne sont pas lus', () => {
    const c = lue(argile({ phi: 'abc', c: 'abc', cu: '75' }));
    expect(c.donnees.sol).toMatchObject({ phi: null, c: 0, cu: 75 });
  });

  it('les deux : phi et c_u sont lus', () => {
    const c = lue({ ...saisieParDefaut(), comportement: 'les_deux' });
    expect(c.donnees.sol).toMatchObject({ phi: 30, c: 0, cu: 60 });
  });

  it('sans nappe : Dw n est pas lu', () => {
    expect(lue({ ...saisieParDefaut(), avecNappe: false, Dw: 'abc' }).donnees.sol.Dw).toBeNull();
  });

  it('sans tassement : aucun de ses champs n est lu', () => {
    const c = lue({ ...saisieParDefaut(), Em: 'abc', nu: 'abc', couches: [{ h: 'x', gammaEff: 'x', Cc: 'x', Cs: 'x', e0: 'x', sigmaP: 'x' }] });
    expect(c.donnees.tassement).toBeNull();
  });

  it('champs de 2e generation non lus en 1re, et inversement', () => {
    expect(lue({ ...saisieParDefaut(), consequences: 'CC3' }).generation).toBe('1re');
  });
});

describe('tassement', () => {
  it('methode elastique et couches', () => {
    const t = lue(avecTassement()).donnees.tassement;
    expect(t).toEqual({
      pNette: true,
      elastique: { Em: 20, nu: 0.3, raideur: 'rigide' },
      couches: [
        { h: 2, gammaEff: 10, Cc: 0.25, Cs: 0.04, e0: 0.8, sigmaP: 120 },
        { h: 3, gammaEff: 10, Cc: 0.2, Cs: 0.03, e0: 0.7, sigmaP: 150 },
      ],
    });
  });

  it('une methode peut manquer', () => {
    expect(lue(avecTassement({ avecElastique: false })).donnees.tassement?.elastique).toBeNull();
    expect(lue(avecTassement({ couches: [] })).donnees.tassement?.couches).toBeNull();
    expect(lue(avecTassement({ avecElastique: false, couches: [] })).donnees.tassement).toBeNull();
  });

  it('une valeur illisible nomme la couche', () => {
    const s = avecTassement();
    s.couches[1] = { ...s.couches[1], Cc: 'abc' };
    expect(refus(s)).toMatch(/couche 2/);
  });

  it('sigma p absent ou nul : refus, jamais de valeur inventee', () => {
    for (const sigmaP of ['', '0']) {
      const s = avecTassement();
      s.couches[0] = { ...s.couches[0], sigmaP };
      const m = refus(s);
      expect(m).toMatch(/couche 1/);
      expect(m).toContain("σ'p");
    }
  });

  it('le calcul suit', () => {
    const r = verifier(lue(avecTassement())).tassement;
    expect(r?.p).toBeCloseTo(186.133, 2);
    expect(r?.elastique?.s_mm).toBeCloseTo(17.277, 2);
    expect(r?.couches?.centre_mm).toBeCloseTo(81.1, 1);
    expect(r?.couches?.coin_mm).toBeCloseTo(27.3, 1);
  });
});

describe('une seule saisie pour les deux generations', () => {
  it('basculer de generation ne change aucune valeur saisie', () => {
    const s = avecTassement({ approche1: 'DA3', approche2: 'c', consequences: 'CC3', dimensionsControlees: true });
    const a = lue({ ...s, generation: '1re' });
    const b = lue({ ...s, generation: '2e' });
    expect(a.donnees).toEqual(b.donnees);
    if (a.generation !== '1re' || b.generation !== '2e') throw new Error('generations attendues');
    expect(a.approche).toBe('DA3');
    expect(b.options.approche).toBe('c');
    expect(b.options.consequences).toBe('CC3');
    expect(b.options.dimensionsControlees).toBe(true);
  });
});

describe('enregistrement', () => {
  it('enregistrer puis relire rend la meme saisie', () => {
    const s = avecTassement({
      generation: '2e',
      forme: 'filante',
      approche1: 'DA2',
      approche2: 'd',
      consequences: 'CC1',
      dimensionsControlees: true,
      profondeurComptee: true,
      comportement: 'les_deux',
      baseRugueuse: false,
      eauInterface: false,
      avecNappe: false,
      pNette: false,
      raideur: 'souple',
    });
    expect(relire(serialiser(s))).toEqual(s);
  });

  it('format inconnu refuse', () => {
    expect(() => relire('{"format":"autre"}')).toThrow(/format/i);
  });

  it('champs absents : valeur par defaut ; couche malformee ecartee', () => {
    const s = relire(JSON.stringify({ format: 'fondations-superficielles/1', B: '4', couches: [{ h: 1 }, { h: '1', gammaEff: '10', Cc: '0,2', Cs: '0,03', e0: '0,7', sigmaP: '100' }] }));
    expect(s.B).toBe('4');
    expect(s.D).toBe(saisieParDefaut().D);
    expect(s.generation).toBe('1re');
    expect(s.comportement).toBe('draine');
    expect(s.couches).toEqual([{ h: '1', gammaEff: '10', Cc: '0,2', Cs: '0,03', e0: '0,7', sigmaP: '100' }]);
  });

  it('valeur de choix inconnue : valeur par defaut', () => {
    const s = relire(JSON.stringify({ format: 'fondations-superficielles/1', comportement: 'X', forme: 'Y', raideur: 'Z', approche1: 'DA9' }));
    expect(s.comportement).toBe('draine');
    expect(s.forme).toBe('isolee');
    expect(s.raideur).toBe('rigide');
    expect(s.approche1).toBe('DA1');
  });
});
