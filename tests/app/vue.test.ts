/** T2 : verdicts, volets, blocs du CSV. Tout vient du resultat du noyau. */

import { describe, expect, it } from 'vitest';
import { NOMS_GRECS, blocsEnTexte, constatsAffichage, notationHtml, nombreAffiche, resultatsEnCsv, tauxAffiche, texteVisible } from 'aedificium-ui';
import { saisieParDefaut, type Resultat } from '../../app/src/form';
import { blocEntrees, blocsResultat, messageDErreur, verdictsHtml, voletsHtml } from '../../app/src/vue';
import { argile, avecTassement, calculer, filante, horsBase, SAISIES, soulevee } from './_commun';

/** Contenu d'un groupe de verdicts : `<section class="groupe-verdicts" data-groupe="...">`. */
function groupe(html: string, nom: string): string {
  const i = html.indexOf(`data-groupe="${nom}"`);
  expect(i).toBeGreaterThan(-1);
  const fin = html.indexOf('</section>', i);
  return html.slice(i, fin < 0 ? undefined : fin);
}

const groupes = (html: string): string[] => [...html.matchAll(/data-groupe="([a-z]+)"/g)].map((m) => m[1]);
const verifications = (html: string): string[] => [...html.matchAll(/data-verification="([A-Za-z]+)"/g)].map((m) => m[1]);
const nonNulles = (r: Resultat): string[] => Object.entries(r.tauxMax).filter(([, v]) => v !== null).map(([k]) => k);

describe('verdicts', () => {
  const def = calculer(saisieParDefaut()).r;
  const html = verdictsHtml(def);

  it('sans tassement : etats limites ultimes et excentricite', () => {
    expect(groupes(html)).toEqual(['elu', 'excentricite']);
  });

  it('avec tassement : le troisieme groupe, sans jauge ni seuil', () => {
    const h = verdictsHtml(calculer(avecTassement()).r);
    expect(groupes(h)).toEqual(['elu', 'excentricite', 'tassement']);
    const g = groupe(h, 'tassement');
    expect(g).not.toContain('width:');
    expect(g).not.toContain('depasse');
  });

  it('aucun verdict global', () => {
    const t = texteVisible(html);
    expect(t).not.toMatch(/\bConforme\b/);
    expect(t).not.toMatch(/Non conforme/);
  });

  it('une carte par verification du noyau, dans le meme ordre', () => {
    for (const [, s] of SAISIES) {
      const r = calculer(s).r;
      expect(verifications(verdictsHtml(r))).toEqual(nonNulles(r));
    }
  });

  it('elu : portance et glissement, le pire de chaque, combinaison et sens', () => {
    const t = texteVisible(groupe(html, 'elu'));
    expect(t).toContain('Portance');
    expect(t).toContain('Glissement');
    expect(t).toContain(tauxAffiche(def.tauxMax.portanceDrainee as number));
    expect(t).toContain(tauxAffiche(def.tauxMax.glissementDraine as number));
    expect(t).toContain('DA1-2');
    expect(t).toContain('DA1-1');
    expect(t.toLowerCase()).toContain('défavorable');
    expect(t.toLowerCase()).toContain('favorable');
  });

  it('les deux analyses se distinguent par leur titre', () => {
    const t = texteVisible(verdictsHtml(calculer({ ...saisieParDefaut(), comportement: 'les_deux' }).r));
    expect(t).toContain('Portance drainée');
    expect(t).toContain('Portance non drainée');
    expect(t).toContain('Glissement drainé');
    expect(t).toContain('Glissement non drainé');
  });

  it('plafond 0,4 N signale quand il s applique', () => {
    const r = calculer(argile()).r;
    expect(r.combinaisons.some((c) => c.cas.some((x) => x.nonDrainee?.glissement.limite04))).toBe(true);
    expect(texteVisible(verdictsHtml(r))).toContain('0,4');
  });

  it('clauses de la generation', () => {
    const t1 = texteVisible(html);
    expect(t1).toContain('§6.5.3');
    expect(t1).toContain('annexe D');
    expect(t1).toContain('§6.5.4');
    const t2 = texteVisible(verdictsHtml(calculer({ ...saisieParDefaut(), generation: '2e' }).r));
    expect(t2).toContain('§5.6.3');
    expect(t2).toContain('§5.6.4');
    expect(t2).toContain('annexe B.4');
    expect(t2).toContain('tableau 5.3');
    expect(t2).not.toContain('annexe D');
    expect(t2).not.toContain('§6.5');
  });

  it('un taux depasse est marque, dans son groupe seulement', () => {
    const r = calculer(argile({ cu: '20', VG: '500', VQ: '300' })).r;
    expect(r.tauxMax.portanceNonDrainee as number).toBeGreaterThan(1);
    const h = verdictsHtml(r);
    expect(groupe(h, 'elu')).toContain('depasse');
    expect(groupe(h, 'excentricite')).not.toContain('depasse');
  });

  it('jauges bornees : jamais de NaN, d Infinity ni de largeur au-dela de 100 %', () => {
    for (const [, s] of SAISIES) {
      const h = verdictsHtml(calculer(s).r);
      expect(h).not.toContain('NaN');
      expect(h).not.toContain('Infinity');
      expect(h).not.toContain('null');
      expect(h).not.toContain('undefined');
      for (const m of h.matchAll(/width:\s*([\d.]+)%/g)) expect(Number(m[1])).toBeLessThan(100.01);
    }
  });

  it('soulevement et resultante hors base : dits en clair, et marques', () => {
    const s = verdictsHtml(calculer(soulevee()).r);
    expect(texteVisible(s)).toMatch(/[Ss]oulèvement/);
    expect(groupe(s, 'elu')).toContain('depasse');
    const b = verdictsHtml(calculer(horsBase()).r);
    expect(texteVisible(b)).toContain('hors de la base');
    expect(groupe(b, 'elu')).toContain('depasse');
  });
});

describe('excentricite', () => {
  it('1re generation : e/(B/3), le pire des cas', () => {
    const r = calculer(saisieParDefaut()).r;
    const t = texteVisible(groupe(verdictsHtml(r), 'excentricite'));
    expect(t).toContain(tauxAffiche(195 / 924.8 / (2 / 3)));
    expect(t).toContain('B/3');
  });

  it('2e generation : permanentes et totales, valeur et limite du noyau', () => {
    const r = calculer({ ...saisieParDefaut(), generation: '2e' }).r;
    const t = texteVisible(groupe(verdictsHtml(r), 'excentricite'));
    expect(t).toContain('1/6');
    expect(t).toContain('1/9');
    expect(t).toContain(nombreAffiche(r.els?.permanentes.valeur as number, 3));
    expect(t).toContain(nombreAffiche(r.els?.totales.valeur as number, 3));
  });

  it('2e generation, filante : limites 1/6 et 1/3', () => {
    const t = texteVisible(groupe(verdictsHtml(calculer(filante({ generation: '2e' })).r), 'excentricite'));
    expect(t).toContain('1/6');
    expect(t).toContain('1/3');
  });
});

describe('tassement', () => {
  it('pression, methode elastique, couches au centre et au coin', () => {
    const r = calculer(avecTassement()).r;
    const t = texteVisible(groupe(verdictsHtml(r), 'tassement'));
    expect(t).toContain(nombreAffiche(186.133, 1));
    expect(t).toContain(nombreAffiche(r.tassement?.elastique?.s_mm as number, 1));
    expect(t).toContain(nombreAffiche(r.tassement?.couches?.centre_mm as number, 1));
    expect(t).toContain(nombreAffiche(r.tassement?.couches?.coin_mm as number, 1));
  });

  it('une seule methode : l autre n apparait pas', () => {
    const t = texteVisible(verdictsHtml(calculer(avecTassement({ avecElastique: false })).r));
    expect(t.toLowerCase()).not.toContain('élastique');
    expect(t).toContain('centre');
  });
});

describe('volets', () => {
  for (const [nom, s] of SAISIES) {
    it(`${nom} : combinaisons et sens, sans NaN`, () => {
      const r = calculer(s).r;
      const h = voletsHtml(r);
      expect(h).not.toContain('NaN');
      expect(h).not.toContain('Infinity');
      expect((h.match(/<details/g) ?? []).length).toBeGreaterThan(2);
      const t = texteVisible(h);
      for (const c of r.combinaisons) expect(t).toContain(c.nom);
    });
  }

  it('une ligne par combinaison, sens et analyse, avec q_u, R_d et taux', () => {
    const r = calculer(saisieParDefaut()).r;
    const t = texteVisible(voletsHtml(r));
    for (const c of r.combinaisons) {
      for (const x of c.cas) {
        expect(t).toContain(nombreAffiche(x.drainee?.q_u as number, 1));
        expect(t).toContain(nombreAffiche(x.drainee?.R_d as number, 1));
        expect(t).toContain(tauxAffiche(x.drainee?.taux as number));
      }
    }
  });

  it('une seule ligne surlignee par analyse', () => {
    expect((voletsHtml(calculer(saisieParDefaut()).r).match(/class="gouverne"/g) ?? []).length).toBe(1);
    expect((voletsHtml(calculer({ ...saisieParDefaut(), comportement: 'les_deux' }).r).match(/class="gouverne"/g) ?? []).length).toBe(2);
  });

  it('facteurs du cas gouvernant', () => {
    const r = calculer(saisieParDefaut()).r;
    const f = r.combinaisons[1].cas[0].drainee?.facteurs;
    const t = texteVisible(voletsHtml(r));
    expect(t).toContain(nombreAffiche(f?.Nq as number, 3));
    expect(t).toContain(nombreAffiche(f?.Nc as number, 3));
    expect(t).toContain(nombreAffiche(f?.Ngamma as number, 3));
    expect(t).toContain(nombreAffiche(f?.m as number, 3));
  });

  it('tranches de tassement : une ligne par tranche, avec le regime', () => {
    const r = calculer(avecTassement()).r;
    const h = voletsHtml(r);
    expect((h.match(/data-tranche/g) ?? []).length).toBe(r.tassement?.couches?.detail.length);
    const t = texteVisible(h).toLowerCase();
    expect(t).toMatch(/surconsolidé|normalement consolidé|franchissement/);
    expect(voletsHtml(calculer(saisieParDefaut()).r)).not.toContain('data-tranche');
  });

  it('coefficients affiches avec leur source, selon la generation', () => {
    expect(texteVisible(voletsHtml(calculer(saisieParDefaut()).r))).toContain('tableau A.4');
    const t2 = texteVisible(voletsHtml(calculer({ ...saisieParDefaut(), generation: '2e', approche2: 'd' }).r));
    expect(t2).toContain('EN 1997-3:2025, tableau 5.2');
  });

  it('hypotheses : sous-pression sans coefficient', () => {
    expect(texteVisible(voletsHtml(calculer(saisieParDefaut()).r)).toLowerCase()).toContain('sous-pression');
  });
});

describe('blocs : donnees et resultats', () => {
  it('entrees : symboles uniques', () => {
    for (const [, s] of SAISIES) {
      const symboles = blocEntrees(calculer(s).calcul).lignes.map((l) => l.symbole);
      expect(new Set(symboles).size).toBe(symboles.length);
    }
  });

  it('entrees : L et les lignes selon L seulement hors filante', () => {
    const a = blocEntrees(calculer(saisieParDefaut()).calcul).lignes.map((l) => l.symbole);
    for (const x of ['B', 'L', 'D']) expect(a).toContain(x);
    const b = blocEntrees(calculer(filante()).calcul).lignes.map((l) => l.symbole);
    expect(b).toContain('B');
    expect(b).not.toContain('L');
  });

  it('entrees : le sol suit le comportement', () => {
    const d = JSON.stringify(blocEntrees(calculer(saisieParDefaut()).calcul));
    expect(d).toContain('φ');
    expect(d).not.toContain('c_u');
    const n = JSON.stringify(blocEntrees(calculer(argile()).calcul));
    expect(n).toContain('c_u');
    expect(n).not.toContain('φ');
  });

  it('entrees : nappe et couches numerotees', () => {
    const b = blocEntrees(calculer(avecTassement()).calcul);
    const symboles = b.lignes.map((l) => l.symbole);
    for (const s of ['D_w', 'couche 1', 'couche 2']) expect(symboles).toContain(s);
    expect(b.lignes.find((l) => l.symbole === 'couche 2')?.valeur).toContain('150');
    expect(blocEntrees(calculer({ ...saisieParDefaut(), avecNappe: false }).calcul).lignes.map((l) => l.symbole)).not.toContain('D_w');
  });

  it('entrees : champs propres a la generation seulement', () => {
    const t1 = JSON.stringify(blocEntrees(calculer(saisieParDefaut()).calcul));
    expect(t1).toContain('DA1');
    expect(t1).not.toContain('CC2');
    const t2 = JSON.stringify(blocEntrees(calculer({ ...saisieParDefaut(), generation: '2e' }).calcul));
    expect(t2).toContain('CC2');
    expect(t2).not.toContain('DA1');
  });

  it('resultats : les taux du noyau', () => {
    const r = calculer(saisieParDefaut()).r;
    const t = JSON.stringify(blocsResultat(r));
    expect(t).toContain(tauxAffiche(r.tauxMax.portanceDrainee as number));
    expect(t).toContain(tauxAffiche(r.tauxMax.glissementDraine as number));
  });

  for (const [nom, s] of SAISIES) {
    it(`CSV ${nom} : texte brut`, () => {
      const { calcul, r } = calculer(s);
      const c = resultatsEnCsv(blocsEnTexte([blocEntrees(calcul), ...blocsResultat(r)]));
      expect(c).not.toContain('_');
      expect(c).not.toMatch(NOMS_GRECS);
      expect(c).not.toContain('<');
      expect(c).not.toContain('NaN');
      expect(c).not.toContain('Infinity');
    });
  }
});

describe('texte visible : notations, arrondis, accents', () => {
  for (const [nom, s] of SAISIES) {
    it(nom, () => {
      const { calcul, r } = calculer(s);
      const html = [verdictsHtml(r), voletsHtml(r)].join('');
      expect(constatsAffichage(texteVisible(html))).toEqual([]);
      expect(constatsAffichage(texteVisible(notationHtml(blocEntrees(calcul).titre)))).toEqual([]);
    });
  }

  it('message d erreur : celui du noyau', () => {
    expect(messageDErreur(new Error('La largeur B de la semelle doit être un nombre strictement positif (m).'))).toContain('largeur B');
    expect(messageDErreur('texte')).toBe('texte');
  });
});
