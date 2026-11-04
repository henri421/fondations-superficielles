/** T1 : la page, sa configuration, le cablage de main.ts. */

import { describe, expect, it } from 'vitest';
import { JETONS, constatsAffichage, contenuBalise, texteVisible, valeursDesJetons } from 'aedificium-ui';
import { saisieParDefaut } from '../../app/src/form';
import { lire } from './_commun';

const page = lire('../../app/index.html');
const main = lire('../../app/src/main.ts');

describe('page', () => {
  it('titre', () => {
    expect(contenuBalise(page, 'h1')).toBe('Fondations superficielles');
    expect(contenuBalise(page, 'title')?.startsWith('Fondations superficielles')).toBe(true);
  });

  it('un champ par valeur saisie', () => {
    const CHOIX_A_BOUTONS = ['generation', 'forme', 'comportement', 'couches'];
    for (const cle of Object.keys(saisieParDefaut())) {
      if (CHOIX_A_BOUTONS.includes(cle)) continue;
      expect(page).toContain(`data-champ="${cle}"`);
    }
  });

  it('boutons de forme, de comportement, de generation ; approches par generation', () => {
    for (const a of ['data-forme="isolee"', 'data-forme="filante"', 'data-comportement="draine"', 'data-comportement="non_draine"', 'data-comportement="les_deux"', 'data-generation="1re"', 'data-generation="2e"', 'data-groupe="1re"', 'data-groupe="2e"']) {
      expect(page).toContain(a);
    }
    for (const v of ['DA1', 'DA2', 'DA3', 'a+b', 'c', 'd', 'CC1', 'CC2', 'CC3', 'rigide', 'souple']) expect(page).toContain(`value="${v}"`);
  });

  it('les lignes qui dependent d un choix le disent', () => {
    expect(page).toContain('data-si-forme="isolee"');
    expect(page).toContain('data-si-sol="drainee"');
    expect(page).toContain('data-si-sol="non-drainee"');
    expect(page).toContain('data-si-nappe');
  });

  it('couches, zones de resultat, options du dessin, sorties', () => {
    for (const r of ['couches', 'erreur', 'vues', 'sens', 'analyses', 'coupe', 'plan', 'verdicts', 'volets', 'projet', 'element', 'ouvrir']) {
      expect(page).toContain(`data-role="${r}"`);
    }
    for (const a of ['ajouter-couche', 'exporter-note', 'exporter-coupe', 'exporter-resultats', 'enregistrer', 'reinitialiser']) {
      expect(page).toContain(`data-action="${a}"`);
    }
    expect(page).toContain('data-option="cotes"');
  });

  it('le hors-perimetre et les valeurs recommandees sont annonces', () => {
    const t = texteVisible(page);
    for (const m of ['circulaire', 'inclinés', 'couche faible', 'soulèvement', 'butée', 'stabilité générale']) expect(t).toContain(m);
    expect(t).toContain('annexe nationale');
  });

  it('notations, accents, phrases types', () => {
    expect(constatsAffichage(texteVisible(page))).toEqual([]);
  });

  it('pas de reste du gabarit', () => {
    for (const f of [page, main, lire('../../vite.config.ts'), lire('../../app/src/pwa.ts')]) {
      expect(f.toLowerCase()).not.toContain('cisaillement');
      expect(f.toLowerCase()).not.toContain('mur-en-l');
    }
    expect(lire('../../vite.config.ts')).toContain('fondations-superficielles');
  });

  it('le :root de style.css concorde avec les jetons communs', () => {
    const css = valeursDesJetons(lire('../../app/src/style.css'));
    for (const [nom, valeur] of valeursDesJetons(JETONS)) expect(css.get(nom)).toBe(valeur);
  });
});

describe('main.ts', () => {
  it('passe par le formulaire et les modules purs', () => {
    for (const f of ['lireSaisie(', 'verifier(', 'verdictsHtml(', 'voletsHtml(', 'coupe(', 'planSvg(', 'vuesDisponibles(', 'vueGouvernante(', 'noteDuCalcul(', 'blocsEnTexte(', 'noteDeCalculHtml(']) {
      expect(main).toContain(f);
    }
    expect(main).toMatch(/import \{[^}]*\bnoteDeCalculHtml\b[^}]*\} from 'aedificium-ui'/);
  });

  it('memorise saisie et cartouche sous le nom de l outil', () => {
    expect(main).toContain("'fondations-superficielles/saisie'");
    expect(main).toContain("'fondations-superficielles:cartouche'");
  });

  it('l interface ne calcule rien', () => {
    expect(main).not.toContain('verifierSemelle');
    for (const f of [main, lire('../../app/src/vue.ts'), lire('../../app/src/note.ts')]) {
      expect(f).not.toMatch(/Math\.(tan|sin|cos|atan|exp|sqrt)/);
    }
  });
});
