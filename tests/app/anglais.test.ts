/** T5 : page `en/index.html` de meme squelette, et aucun reste de francais en anglais. */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { blocsEnTexte, constatsAffichage, contenuBalise, definirLangue, noteDeCalculHtml, notationHtml, resultatsEnCsv, texteVisible } from 'aedificium-ui';
import { profil1g } from 'sol-ec7';
import { lireSaisie, relire, saisieParDefaut } from '../../app/src/form';
import { blocEntrees, blocsResultat, messageDErreur, verdictsHtml, voletsHtml } from '../../app/src/vue';
import { coupe, planSvg, vuesDisponibles } from '../../app/src/dessin';
import { noteDuCalcul } from '../../app/src/note';
import { STYLES_TRACE } from '../../app/src/export';
import { textes } from '../../app/src/textes';
import { verifierSemelle1g, type DonneesSemelle } from '../../src/index';
import { avecTassement, calculer, lire, SAISIES } from './_commun';

const controler = (nom: string, html: string): string[] => constatsAffichage(texteVisible(html), { langue: 'en' }).map((c) => `${nom} : ${c}`);

function squelette(html: string): string[] {
  return [...html.matchAll(/\s(id|data-[a-z-]+|type|inputmode|accept)="([^"]*)"/g)].map((m) => `${m[1]}=${m[2]}`);
}

function erreur(f: () => unknown): string {
  try {
    f();
  } catch (e) {
    return messageDErreur(e);
  }
  throw new Error('une erreur etait attendue');
}

describe('page anglaise', () => {
  const fr = lire('../../app/index.html');
  const en = lire('../../app/en/index.html');

  it('meme squelette que la page francaise', () => {
    expect(squelette(en)).toEqual(squelette(fr));
  });

  it('langue, script commun, liens entre les deux versions', () => {
    expect(en).toContain('<html lang="en">');
    expect(en).toContain('src="../src/main.ts"');
    expect(en).toMatch(/class="barre-langue" href="\.\.\/"/);
    expect(fr).toMatch(/class="barre-langue" href="en\/"/);
  });

  it('titre anglais, aucun reste de francais', () => {
    expect(contenuBalise(en, 'h1')).toBe('Shallow foundations');
    expect(controler('page', en.replace(/lang="fr"[^>]*>FR</, '>'))).toEqual([]);
  });
});

describe('affichage en anglais', () => {
  beforeEach(() => definirLangue('en'));
  afterEach(() => definirLangue('fr'));

  for (const [nom, s] of SAISIES) {
    it(`${nom} : ecran, dessins, note, CSV`, () => {
      const { calcul, r } = calculer(s);
      const constats: string[] = [];
      constats.push(...controler('verdicts', verdictsHtml(r)));
      constats.push(...controler('volets', voletsHtml(r)));
      for (const v of vuesDisponibles(r)) {
        const nomVue = `${v.combinaison} ${v.sens} ${v.analyse}`;
        constats.push(...controler(`coupe ${nomVue}`, coupe(calcul, r, v, { cotes: true })));
        constats.push(...controler(`plan ${nomVue}`, planSvg(calcul, r, v)));
      }
      constats.push(...controler('note', noteDeCalculHtml(noteDuCalcul(calcul, r, { projet: 'Hall', element: '', date: '2026-11-04' }), STYLES_TRACE)));
      const csv = resultatsEnCsv(blocsEnTexte([blocEntrees(calcul), ...blocsResultat(r)]));
      constats.push(...constatsAffichage(csv, { langue: 'en' }).map((c) => `csv : ${c}`));
      expect(constats).toEqual([]);
    });
  }

  it('titre de la note, normes inchangees', () => {
    const { calcul, r } = calculer(saisieParDefaut());
    const n = noteDuCalcul(calcul, r, { projet: '', element: ' ', date: '2026-11-04' });
    expect(n.cartouche.element).toBe('Footing');
    expect(n.cartouche.norme).toBe('EN 1997-1:2004');
  });

  it('nombres a point decimal', () => {
    const { r } = calculer(saisieParDefaut());
    expect(texteVisible(verdictsHtml(r))).toMatch(/0\.922/);
    expect(resultatsEnCsv(blocsEnTexte(blocsResultat(r)))).toContain('Block,Symbol,Quantity,Value');
  });

  it('messages et erreurs du noyau traduits', () => {
    const lue = lireSaisie(avecTassement());
    if (!lue.ok) throw new Error(lue.message);
    const d = lue.calcul.donnees;
    const v = (x: Partial<DonneesSemelle>) => () => verifierSemelle1g({ ...d, ...x }, 'DA1', profil1g());
    const t = d.tassement as NonNullable<DonneesSemelle['tassement']>;
    const couche = (t.couches ?? [])[0];
    const sansSource = profil1g();
    sansSource.R1.gRv = { valeur: 1, source: '' };
    const lectures = [
      lireSaisie({ ...saisieParDefaut(), B: 'abc' }),
      lireSaisie({ ...saisieParDefaut(), phi: '0' }),
      lireSaisie({ ...saisieParDefaut(), comportement: 'non_draine', cu: '0' }),
      lireSaisie(avecTassement({ couches: [{ h: 'x', gammaEff: '10', Cc: '0,2', Cs: '0,03', e0: '0,7', sigmaP: '100' }] })),
      lireSaisie(avecTassement({ couches: [{ h: '1', gammaEff: '10', Cc: '0,2', Cs: '0,03', e0: '0,7', sigmaP: '0' }] })),
    ];
    const messages = [
      ...lectures.flatMap((l) => (l.ok ? [] : [l.message])),
      erreur(() => relire('{"format":"autre"}')),
      erreur(v({ B: 0 })),
      erreur(v({ L: 0 })),
      erreur(v({ D: 0 })),
      erreur(v({ ep: -1 })),
      erreur(v({ ep: 2 })),
      erreur(v({ sol: { ...d.sol, phi: null, cu: null } })),
      erreur(v({ sol: { ...d.sol, Dw: -1 } })),
      erreur(() => verifierSemelle1g({ ...d, L: null, actions: { ...d.actions, H_LG: 5 } }, 'DA1', profil1g())),
      erreur(v({ sol: { ...d.sol, phi: 95 } })),
      erreur(v({ sol: { ...d.sol, c: -1 } })),
      erreur(v({ sol: { ...d.sol, gamma: 0 } })),
      erreur(v({ sol: { ...d.sol, gammaSat: 0 } })),
      erreur(v({ sol: { ...d.sol, phi: null, cu: -1 } })),
      erreur(v({ tassement: { ...t, elastique: { Em: 0, nu: 0.3, raideur: 'rigide' } } })),
      erreur(v({ tassement: { ...t, elastique: { Em: 20, nu: 0.6, raideur: 'rigide' } } })),
      erreur(v({ tassement: { ...t, couches: [{ ...couche, h: 0 }] } })),
      erreur(v({ tassement: { ...t, couches: [{ ...couche, e0: 0 }] } })),
      erreur(v({ tassement: { ...t, couches: [{ ...couche, Cc: -1 }] } })),
      erreur(v({ tassement: { ...t, couches: [{ ...couche, sigmaP: 0 }] } })),
      erreur(() => verifierSemelle1g(d, 'DA1', sansSource)),
      textes().messages.rienAExporter,
      textes().messages.nouvelleVersion,
    ];
    expect(messages.flatMap((m, i) => controler(`message ${i} « ${m} »`, notationHtml(m)))).toEqual([]);
  });
});
