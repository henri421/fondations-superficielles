// Lot E (audit R4) : profils de coefficients de la 1re generation (recommande, ANB 2022, Luxembourg).
import { describe, expect, it } from 'vitest';
import { noteDeCalculHtml, texteVisible } from 'aedificium-ui';
import { profil1g } from 'sol-ec7';
import { profilLu1g } from '../../app/src/annexe';
import { relire, saisieParDefaut, serialiser } from '../../app/src/form';
import { noteDuCalcul } from '../../app/src/note';
import { calculer } from './_commun';

describe('profils de la 1re generation', () => {
  it('Luxembourg : memes valeurs que le profil recommande, sources ILNAS-EN 1997-1/AN-LU:2020', () => {
    const lu = profilLu1g();
    expect(lu.M2.gPhi.valeur).toBe(profil1g().M2.gPhi.valeur);
    expect(lu.M2.gPhi.source).toMatch(/^ILNAS-EN 1997-1\/AN-LU:2020, tableau A\.4 : valeur recommandée présumée retenue/);
  });

  it('par defaut : valeurs recommandees ; choix enregistre et relu', () => {
    expect(saisieParDefaut().profilNormatif).toBe('recommande');
    const s = { ...saisieParDefaut(), generation: '1re' as const, profilNormatif: 'lu' as const, risque: 'eleve' as const };
    const relu = relire(serialiser(s));
    expect(relu.profilNormatif).toBe('lu');
    expect(relu.risque).toBe('eleve');
    expect(relire(serialiser({ ...s, profilNormatif: 'xx' as never })).profilNormatif).toBe('recommande');
  });

  it('Luxembourg : le calcul emploie le profil LU, la note le dit et avertit', () => {
    const s = { ...saisieParDefaut(), generation: '1re' as const, profilNormatif: 'lu' as const };
    const { calcul, r } = calculer(s);
    expect(JSON.stringify(r.coefficients)).toMatch(/AN-LU:2020/);
    const note = noteDuCalcul(calcul, r, { projet: 'P', element: 'E', date: '2026-11-17' });
    expect(note.cartouche.norme).toContain('AN-LU:2020');
    expect(note.avertissements?.some((a) => /^Annexe nationale luxembourgeoise/.test(a))).toBe(true);
    // Profil choisi en bloc : l'avertissement ne promet pas de modifier chaque coefficient.
    expect(note.avertissements?.some((a) => /ne permet pas de les modifier un à un/.test(a))).toBe(true);
    expect(note.avertissements?.some((a) => /vous pouvez modifier/.test(a))).toBe(false);
    expect(texteVisible(noteDeCalculHtml(note, ''))).toContain('Luxembourg');
  });

  it('ANB 2022 : approche DA1 imposee, coefficients de l ANB', () => {
    const s = { ...saisieParDefaut(), generation: '1re' as const, profilNormatif: 'anb2022' as const, approche1: 'DA2' as const };
    const { calcul, r } = calculer(s);
    expect(calcul.generation === '1re' && calcul.approche).toBe('DA1');
    expect(JSON.stringify(r.coefficients)).toMatch(/ANB/);
    const note = noteDuCalcul(calcul, r, { projet: 'P', element: 'E', date: '2026-11-17' });
    expect(note.cartouche.norme).toContain('ANB:2022');
    expect(note.avertissements?.some((a) => /luxembourgeoise/.test(a))).toBe(false);
  });

  it('valeurs recommandees : rien ne change (cartouche EN 1997-1:2004 seul)', () => {
    const { calcul, r } = calculer({ ...saisieParDefaut(), generation: '1re' as const });
    expect(noteDuCalcul(calcul, r, { projet: 'P', element: 'E', date: '2026-11-17' }).cartouche.norme).toBe('EN 1997-1:2004');
  });
});
