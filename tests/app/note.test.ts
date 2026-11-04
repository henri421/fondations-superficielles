/** T4 : la note commune d'aedificium-ui, sans verdict global ; les dessins exportes. */

import { describe, expect, it } from 'vitest';
import { constatsAffichage, noteDeCalculHtml, texteVisible, type ElementNote } from 'aedificium-ui';
import { saisieParDefaut, type Saisie } from '../../app/src/form';
import { blocEntrees } from '../../app/src/vue';
import { coupe, planSvg, vueGouvernante } from '../../app/src/dessin';
import { noteDuCalcul } from '../../app/src/note';
import { STYLES_TRACE } from '../../app/src/export';
import { avecTassement, calculer, filante, lire, SAISIES } from './_commun';

const CARTOUCHE = { projet: 'Halle', element: 'Semelle S1', date: '2026-11-04' };

function preparer(s: Saisie) {
  const { calcul, r } = calculer(s);
  return { calcul, r, note: noteDuCalcul(calcul, r, CARTOUCHE) };
}

const symboles = (els: ElementNote[] | undefined): string[] => (els ?? []).flatMap((e) => (e.type === 'bloc' ? e.bloc.lignes.map((l) => l.symbole) : []));
const titres = (els: ElementNote[] | undefined): string[] => (els ?? []).flatMap((e) => (e.type === 'bloc' ? [e.bloc.titre] : []));
const figures = (els: ElementNote[] | undefined) => (els ?? []).filter((e) => e.type === 'figure');

describe('cartouche', () => {
  it('projet, element, date, outil', () => {
    const { cartouche } = preparer(saisieParDefaut()).note;
    expect(cartouche.projet).toBe('Halle');
    expect(cartouche.element).toBe('Semelle S1');
    expect(cartouche.date).toBe('2026-11-04');
    expect(cartouche.outil).toBe('fondations-superficielles');
  });

  it('normes de la generation', () => {
    expect(preparer(saisieParDefaut()).note.cartouche.norme).toBe('EN 1997-1:2004');
    expect(preparer({ ...saisieParDefaut(), generation: '2e' }).note.cartouche.norme).toBe('EN 1997-1:2024, EN 1997-3:2025, EN 1990:2023');
  });

  it('element vide : Semelle', () => {
    const { calcul, r } = calculer(saisieParDefaut());
    expect(noteDuCalcul(calcul, r, { ...CARTOUCHE, element: ' ' }).cartouche.element).toBe('Semelle');
  });

  it('le texte est echappe', () => {
    const { calcul, r } = calculer(saisieParDefaut());
    const h = noteDeCalculHtml(noteDuCalcul(calcul, r, { ...CARTOUCHE, projet: 'Halle <test>' }), STYLES_TRACE);
    expect(h).toContain('Halle &lt;test&gt;');
    expect(h).not.toContain('Halle <test>');
  });
});

describe('sections', () => {
  for (const generation of ['1re', '2e'] as const) {
    it(`ordre fixe, generation ${generation}`, () => {
      const html = noteDeCalculHtml(preparer({ ...saisieParDefaut(), generation }).note, STYLES_TRACE);
      expect([...html.matchAll(/<h2>([^<]*)<\/h2>/g)].map((x) => x[1])).toEqual([
        '1. Géométrie',
        '2. Matériaux',
        '3. Hypothèses',
        '4. Cas de charges',
        '5. Calculs et vérifications',
        '6. Conclusions',
      ]);
    });

    it(`toutes les lignes d entree rangees une fois, generation ${generation}`, () => {
      const { calcul, note } = preparer(avecTassement({ generation }));
      const s = note.sections;
      const ranges = [...symboles(s.geometrie), ...symboles(s.materiaux), ...symboles(s.hypotheses), ...symboles(s.charges)];
      expect([...ranges].sort()).toEqual(blocEntrees(calcul).lignes.map((l) => l.symbole).sort());
    });
  }

  it('chaque ligne a sa place', () => {
    const s = preparer(avecTassement()).note.sections;
    for (const x of ['B', 'L', 'D']) expect(symboles(s.geometrie)).toContain(x);
    for (const x of ['couche 1', 'couche 2']) expect(symboles(s.materiaux)).toContain(x);
    expect(symboles(s.materiaux).some((x) => x.includes('φ'))).toBe(true);
    for (const x of ['V_G', 'V_Q']) expect(symboles(s.charges)).toContain(x);
    expect(symboles(s.hypotheses)).toContain('D_w');
  });

  it('geometrie : coupe cotee et plan de la vue gouvernante', () => {
    const { calcul, r, note } = preparer(saisieParDefaut());
    const f = figures(note.sections.geometrie);
    expect(f).toHaveLength(2);
    const v = vueGouvernante(r);
    if (f[0].type === 'figure') expect(f[0].svg).toBe(coupe(calcul, r, v, { cotes: true }));
    if (f[1].type === 'figure') expect(f[1].svg).toBe(planSvg(calcul, r, v));
  });

  it('hypotheses : valeurs recommandees et absence d annexe nationale annoncees', () => {
    for (const generation of ['1re', '2e'] as const) {
      const h = preparer({ ...saisieParDefaut(), generation }).note.sections.hypotheses ?? [];
      expect(h.some((e) => e.type === 'liste')).toBe(true);
      expect(h.some((e) => e.type === 'texte' && e.texte.includes('annexe nationale'))).toBe(true);
    }
    const h2 = noteDeCalculHtml(preparer({ ...saisieParDefaut(), generation: '2e' }).note, STYLES_TRACE);
    expect(texteVisible(h2)).toContain('CC2');
  });

  it('calculs : un bloc par combinaison, puis le tassement s il est demande', () => {
    const { r, note } = preparer(avecTassement());
    const t = titres(note.sections.calculs);
    for (const c of r.combinaisons) expect(t.some((x) => x.includes(c.nom))).toBe(true);
    expect(t.some((x) => x.includes('Tassement'))).toBe(true);
    expect(titres(preparer(saisieParDefaut()).note.sections.calculs).some((x) => x.includes('Tassement'))).toBe(false);
  });
});

describe('conclusions', () => {
  for (const [nom, s] of SAISIES) {
    it(`${nom} : une ligne par verification, taux du noyau`, () => {
      const { r, note } = preparer(s);
      const analyses = (r.tauxMax.portanceDrainee !== null ? 1 : 0) + (r.tauxMax.portanceNonDrainee !== null ? 1 : 0);
      const excentricite = r.els === null ? 1 : 2;
      // Portance et glissement par combinaison et par analyse, le pire des deux sens ; puis l'excentricite.
      expect(note.verifications).toHaveLength(r.combinaisons.length * analyses * 2 + excentricite);
      for (const v of note.verifications) {
        expect(v.nom).not.toMatch(/EN \d/);
        expect((v.clause ?? '').trim().length).toBeGreaterThan(0);
        expect(v.ok).toBe(typeof v.taux === 'number' && Number.isFinite(v.taux) && v.taux <= 1);
      }
      const taux = note.verifications.map((v) => v.taux);
      for (const c of r.tauxMax.portanceDrainee !== null ? r.combinaisons : []) {
        expect(taux).toContain(Math.max(...c.cas.map((x) => x.drainee?.taux as number)));
        expect(taux).toContain(Math.max(...c.cas.map((x) => x.drainee?.glissement.taux as number)));
      }
      for (const c of r.tauxMax.portanceNonDrainee !== null ? r.combinaisons : []) {
        expect(taux).toContain(Math.max(...c.cas.map((x) => x.nonDrainee?.taux as number)));
      }
    });
  }

  it('la combinaison figure dans le nom', () => {
    const { note } = preparer(saisieParDefaut());
    expect(note.verifications.some((v) => v.nom.includes('DA1-2'))).toBe(true);
  });

  it('aucun verdict global', () => {
    const t = texteVisible(noteDeCalculHtml(preparer(saisieParDefaut()).note, STYLES_TRACE));
    expect(t).not.toContain('Conforme');
    expect(t).not.toContain('Non conforme');
    expect(t).toContain('Vérification déterminante');
  });

  it('alertes du noyau reprises en clair', () => {
    const { note } = preparer(filante({ MBG: '100000', generation: '2e' }));
    const a = (note.avertissements ?? []).join(' ');
    expect(a).toContain('hors de la base');
    expect(a).not.toContain('hors_base');
    expect(a).not.toContain('els_');
  });
});

describe('texte visible de la note', () => {
  for (const [nom, s] of SAISIES) {
    it(nom, () => {
      const h = noteDeCalculHtml(preparer(s).note, STYLES_TRACE);
      expect(h).not.toContain('NaN');
      expect(h).not.toContain('Infinity');
      expect(constatsAffichage(texteVisible(h))).toEqual([]);
    });
  }
});

describe('export', () => {
  it('STYLES_TRACE porte les traits du dessin', () => {
    for (const c of ['.semelle', '.efficace', '.nappe', '.resultante', '.losange']) expect(STYLES_TRACE).toContain(c);
  });

  it('main.ts exporte note, coupe et CSV', () => {
    const main = lire('../../app/src/main.ts');
    expect(main).toContain('svgAutonome(');
    expect(main).toContain('resultatsEnCsv(');
    expect(main).toContain('ouvrirOuTelecharger(');
  });
});
