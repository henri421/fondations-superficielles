/**
 * T3 : les dessins, lus dans le SVG lui-meme.
 *
 * Classes imposees :
 *  - `rect.semelle` : la semelle, en coupe et en plan ;
 *  - `rect.efficace` : la largeur ou la surface efficace, absente si aucune portance n'est calculee ;
 *  - `line.sol`, `line.nappe` : terrain naturel et nappe, en coupe ;
 *  - `line.resultante`, `line.effort-t` : N et T, en coupe ;
 *  - `circle.point-application`, `polygon.losange`, `ellipse.ellipse-service` : en plan ;
 *  - `.cote` : ce que retire l'option du dessin.
 */

import { describe, expect, it } from 'vitest';
import { constatsAffichage, nombreAffiche, texteVisible } from 'aedificium-ui';
import { saisieParDefaut, type Resultat } from '../../app/src/form';
import { coupe, planSvg, vueGouvernante, vuesDisponibles, type Vue } from '../../app/src/dessin';
import { argile, calculer, filante, horsBase, permutee, SAISIES, soulevee } from './_commun';

const OPTIONS = { cotes: true };
const attribut = (balise: string, nom: string): number => Number(new RegExp(`\\s${nom}="([^"]*)"`).exec(balise)?.[1]);
const balises = (svg: string, element: string, classe: string): string[] =>
  [...svg.matchAll(new RegExp(`<${element}\\b[^>]*>`, 'g'))].map((m) => m[0]).filter((b) => new RegExp(`class="[^"]*\\b${classe}\\b`).test(b));
const une = (svg: string, element: string, classe: string): string => {
  const l = balises(svg, element, classe);
  expect(l, `${element}.${classe}`).toHaveLength(1);
  return l[0];
};

const casDe = (r: Resultat, v: Vue) => {
  const c = r.combinaisons.find((x) => x.nom === v.combinaison);
  const k = c?.cas.find((x) => x.sens === v.sens);
  if (!k) throw new Error('vue inconnue');
  return k;
};

describe('vues', () => {
  it('chaque combinaison, dans les deux sens', () => {
    const v = vuesDisponibles(calculer(saisieParDefaut()).r);
    expect(v).toEqual([
      { combinaison: 'DA1-1', sens: 'defavorable', analyse: 'drainee' },
      { combinaison: 'DA1-1', sens: 'favorable', analyse: 'drainee' },
      { combinaison: 'DA1-2', sens: 'defavorable', analyse: 'drainee' },
      { combinaison: 'DA1-2', sens: 'favorable', analyse: 'drainee' },
    ]);
  });

  it('les analyses presentes seulement', () => {
    const n = vuesDisponibles(calculer(argile()).r);
    expect(new Set(n.map((v) => v.analyse))).toEqual(new Set(['nonDrainee']));
    const d = vuesDisponibles(calculer({ ...saisieParDefaut(), comportement: 'les_deux' }).r);
    expect(d).toHaveLength(8);
  });

  it('la vue gouvernante ouvre le dessin', () => {
    expect(vueGouvernante(calculer(saisieParDefaut()).r)).toEqual({ combinaison: 'DA1-2', sens: 'defavorable', analyse: 'drainee' });
    expect(vueGouvernante(calculer({ ...saisieParDefaut(), generation: '2e' }).r)).toEqual({ combinaison: '(b)', sens: 'defavorable', analyse: 'drainee' });
    expect(vueGouvernante(calculer(argile()).r).analyse).toBe('nonDrainee');
  });
});

describe('tous les cas, toutes les vues', () => {
  for (const [nom, s] of SAISIES) {
    it(`${nom} : sans NaN ni Infinity, sans faute d affichage`, () => {
      const { calcul, r } = calculer(s);
      for (const v of vuesDisponibles(r)) {
        for (const svg of [coupe(calcul, r, v, OPTIONS), planSvg(calcul, r, v)]) {
          expect(svg).toContain('<svg');
          expect(svg).not.toContain('NaN');
          expect(svg).not.toContain('Infinity');
          expect(svg).not.toContain('undefined');
          expect(constatsAffichage(texteVisible(svg))).toEqual([]);
        }
      }
    });
  }
});

describe('coupe', () => {
  const { calcul, r } = calculer(saisieParDefaut());
  const vue = vueGouvernante(r);
  const svg = coupe(calcul, r, vue, OPTIONS);

  it('les efforts de la vue', () => {
    const k = casDe(r, vue);
    const t = texteVisible(svg);
    expect(t).toContain(nombreAffiche(k.drainee?.N as number, 1));
    expect(t).toContain(nombreAffiche(k.T_d, 1));
    une(svg, 'line', 'resultante');
    une(svg, 'line', 'effort-t');
  });

  it('changer de vue change les efforts', () => {
    const autre = { combinaison: 'DA1-1', sens: 'defavorable', analyse: 'drainee' } as const;
    expect(texteVisible(coupe(calcul, r, autre, OPTIONS))).toContain(nombreAffiche(casDe(r, autre).drainee?.N as number, 1));
  });

  it('echelle reelle : epaisseur, profondeur et nappe sur la meme echelle que B', () => {
    const s = une(svg, 'rect', 'semelle');
    const w = attribut(s, 'width');
    expect(attribut(s, 'height') / w).toBeCloseTo(0.4 / 2, 2);
    const ySol = attribut(une(svg, 'line', 'sol'), 'y1');
    const yBase = attribut(s, 'y') + attribut(s, 'height');
    expect((yBase - ySol) / w).toBeCloseTo(1 / 2, 2);
    expect((attribut(une(svg, 'line', 'nappe'), 'y1') - ySol) / w).toBeCloseTo(1.5 / 2, 2);
  });

  it('largeur efficace : B prime, du cote de la resultante', () => {
    const s = une(svg, 'rect', 'semelle');
    const e = une(svg, 'rect', 'efficace');
    expect(attribut(e, 'width') / attribut(s, 'width')).toBeCloseTo((casDe(r, vue).drainee?.Bp as number) / 2, 2);
    expect(attribut(e, 'x') + attribut(e, 'width')).toBeCloseTo(attribut(s, 'x') + attribut(s, 'width'), 1);
    const n = une(svg, 'line', 'resultante');
    const excentre = attribut(n, 'x1') - (attribut(s, 'x') + attribut(s, 'width') / 2);
    expect(excentre / attribut(s, 'width')).toBeCloseTo((casDe(r, vue).drainee?.eB as number) / 2, 2);
  });

  it('2e generation : la largeur efficace se lit sur B nominal', () => {
    const c2 = calculer({ ...saisieParDefaut(), generation: '2e' });
    const v = vueGouvernante(c2.r);
    const g = coupe(c2.calcul, c2.r, v, OPTIONS);
    expect(attribut(une(g, 'rect', 'efficace'), 'width') / attribut(une(g, 'rect', 'semelle'), 'width')).toBeCloseTo((casDe(c2.r, v).drainee?.Bp as number) / 2, 2);
  });

  it('sans nappe : pas de ligne de nappe', () => {
    const c = calculer({ ...saisieParDefaut(), avecNappe: false });
    expect(balises(coupe(c.calcul, c.r, vueGouvernante(c.r), OPTIONS), 'line', 'nappe')).toHaveLength(0);
  });

  it('nappe tres profonde : la ligne reste dans le dessin', () => {
    const c = calculer({ ...saisieParDefaut(), Dw: '20' });
    const g = coupe(c.calcul, c.r, vueGouvernante(c.r), OPTIONS);
    const hauteur = Number(/viewBox="[\d.-]+ [\d.-]+ [\d.]+ ([\d.]+)"/.exec(g)?.[1]);
    const y = attribut(une(g, 'line', 'nappe'), 'y1');
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(hauteur);
    expect(texteVisible(g)).toContain('20');
  });

  it('non drainee : N total et largeur non drainee', () => {
    const c = calculer(argile());
    const v = vueGouvernante(c.r);
    const k = casDe(c.r, v);
    const g = coupe(c.calcul, c.r, v, OPTIONS);
    expect(texteVisible(g)).toContain(nombreAffiche(k.N_d, 1));
    expect(attribut(une(g, 'rect', 'efficace'), 'width') / attribut(une(g, 'rect', 'semelle'), 'width')).toBeCloseTo((k.nonDrainee?.Bp as number) / 2, 2);
  });

  it('option : cotes', () => {
    expect(svg).toContain('class="cote');
    const sans = coupe(calcul, r, vue, { cotes: false });
    expect(sans).not.toContain('class="cote');
    expect(sans).toContain('class="semelle');
  });

  it('cas degeneres : pas de largeur efficace, message en clair', () => {
    const s = calculer(soulevee());
    const gs = coupe(s.calcul, s.r, vueGouvernante(s.r), OPTIONS);
    expect(balises(gs, 'rect', 'efficace')).toHaveLength(0);
    expect(texteVisible(gs)).toMatch(/[Ss]oulèvement/);
    const b = calculer(horsBase());
    const gb = coupe(b.calcul, b.r, vueGouvernante(b.r), OPTIONS);
    expect(balises(gb, 'rect', 'efficace')).toHaveLength(0);
    expect(texteVisible(gb)).toContain('hors de la base');
  });
});

describe('plan', () => {
  const { calcul, r } = calculer(saisieParDefaut());
  const vue = vueGouvernante(r);
  const svg = planSvg(calcul, r, vue);

  it('echelle reelle : B sur L', () => {
    const s = une(svg, 'rect', 'semelle');
    expect(attribut(s, 'width') / attribut(s, 'height')).toBeCloseTo(2 / 3, 2);
  });

  it('surface efficace et point d application', () => {
    const s = une(svg, 'rect', 'semelle');
    const e = une(svg, 'rect', 'efficace');
    const k = casDe(r, vue).drainee;
    expect(attribut(e, 'width') / attribut(s, 'width')).toBeCloseTo((k?.Bp as number) / 2, 2);
    expect(attribut(e, 'height') / attribut(s, 'height')).toBeCloseTo(1, 2);
    const p = une(svg, 'circle', 'point-application');
    const cx = attribut(s, 'x') + attribut(s, 'width') / 2;
    expect((attribut(p, 'cx') - cx) / attribut(s, 'width')).toBeCloseTo((k?.eB as number) / 2, 2);
    expect(texteVisible(svg)).toContain(nombreAffiche(k?.A as number, 2));
  });

  it('losange a B/6 et L/6, ellipse a B/3 et L/3', () => {
    const s = une(svg, 'rect', 'semelle');
    const w = attribut(s, 'width');
    const h = attribut(s, 'height');
    const el = une(svg, 'ellipse', 'ellipse-service');
    expect(attribut(el, 'rx') / w).toBeCloseTo(1 / 3, 2);
    expect(attribut(el, 'ry') / h).toBeCloseTo(1 / 3, 2);
    const points = (/points="([^"]*)"/.exec(une(svg, 'polygon', 'losange'))?.[1] ?? '').trim().split(/\s+/).map((p) => p.split(',').map(Number));
    expect(points).toHaveLength(4);
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    expect((Math.max(...xs) - Math.min(...xs)) / w).toBeCloseTo(1 / 3, 2);
    expect((Math.max(...ys) - Math.min(...ys)) / h).toBeCloseTo(1 / 3, 2);
  });

  it('dimensions permutees : la largeur du dessin reste celle du cote de B', () => {
    const c = calculer(permutee());
    const v = { combinaison: 'DA1-1', sens: 'favorable', analyse: 'drainee' } as const;
    const k = casDe(c.r, v).drainee;
    // Le noyau rend B' <= L' : ici B' vient de L.
    expect((k?.Bp as number)).toBeCloseTo(3 - 2 * (k?.eL as number), 3);
    const g = planSvg(c.calcul, c.r, v);
    const s = une(g, 'rect', 'semelle');
    const e = une(g, 'rect', 'efficace');
    expect(attribut(e, 'width') / attribut(s, 'width')).toBeCloseTo((2 - 2 * (k?.eB as number)) / 2, 2);
    expect(attribut(e, 'height') / attribut(s, 'height')).toBeCloseTo((3 - 2 * (k?.eL as number)) / 3, 2);
  });

  it('filante : une bande par metre, sans losange ni ellipse', () => {
    const c = calculer(filante());
    const g = planSvg(c.calcul, c.r, vueGouvernante(c.r));
    une(g, 'rect', 'semelle');
    expect(balises(g, 'polygon', 'losange')).toHaveLength(0);
    expect(balises(g, 'ellipse', 'ellipse-service')).toHaveLength(0);
    expect(texteVisible(g)).toContain('par mètre');
  });

  it('cas degeneres : pas de surface efficace', () => {
    for (const s of [soulevee(), horsBase()]) {
      const c = calculer(s);
      expect(balises(planSvg(c.calcul, c.r, vueGouvernante(c.r)), 'rect', 'efficace')).toHaveLength(0);
    }
  });
});
