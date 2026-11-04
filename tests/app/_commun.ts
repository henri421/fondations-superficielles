/** Saisies et lecture partagees par les tests d'acceptation de l'interface. */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lireSaisie, saisieParDefaut, verifier, type Calcul, type Resultat, type Saisie } from '../../app/src/form';

export const lire = (chemin: string): string => readFileSync(fileURLToPath(new URL(chemin, import.meta.url)), 'utf8');

export function calculer(s: Saisie): { calcul: Calcul; r: Resultat } {
  const l = lireSaisie(s);
  if (!l.ok) throw new Error(l.message);
  return { calcul: l.calcul, r: verifier(l.calcul) };
}

const COUCHE_1 = { h: '2', gammaEff: '10', Cc: '0,25', Cs: '0,04', e0: '0,8', sigmaP: '120' };
const COUCHE_2 = { h: '3', gammaEff: '10', Cc: '0,2', Cs: '0,03', e0: '0,7', sigmaP: '150' };

export const avecTassement = (s: Partial<Saisie> = {}): Saisie => ({
  ...saisieParDefaut(),
  avecTassement: true,
  couches: [COUCHE_1, COUCHE_2],
  ...s,
});

export const filante = (s: Partial<Saisie> = {}): Saisie => ({
  ...saisieParDefaut(),
  forme: 'filante',
  B: '1,5',
  D: '0,8',
  ep: '0,3',
  VG: '200',
  VQ: '80',
  HBG: '15',
  HBQ: '10',
  MBG: '20',
  MBQ: '10',
  ...s,
});

export const argile = (s: Partial<Saisie> = {}): Saisie => ({
  ...saisieParDefaut(),
  comportement: 'non_draine',
  VG: '500',
  VQ: '150',
  HBG: '60',
  HBQ: '40',
  MBG: '50',
  MBQ: '20',
  ...s,
});

/** Les efforts de L : L' < B' dans le cas favorable de DA1-1, les dimensions efficaces sont permutees. */
export const permutee = (): Saisie => ({ ...saisieParDefaut(), MLG: '600' });
/** La sous-pression depasse la charge : N' negatif. */
export const soulevee = (s: Partial<Saisie> = {}): Saisie => ({ ...saisieParDefaut(), ep: '0', VG: '20', VQ: '0', Dw: '0', ...s });
/** La resultante sort de la base. */
export const horsBase = (s: Partial<Saisie> = {}): Saisie => ({ ...saisieParDefaut(), MBG: '100000', ...s });

/** Toutes les formes de resultat que l'interface doit savoir afficher. */
export const SAISIES: [string, Saisie][] = [
  ['defaut', saisieParDefaut()],
  ['DA2', { ...saisieParDefaut(), approche1: 'DA2' }],
  ['DA3', { ...saisieParDefaut(), approche1: 'DA3' }],
  ['2e a+b', { ...saisieParDefaut(), generation: '2e' }],
  ['2e c', { ...saisieParDefaut(), generation: '2e', approche2: 'c' }],
  ['2e d CC3', { ...saisieParDefaut(), generation: '2e', approche2: 'd', consequences: 'CC3' }],
  ['2e controle', { ...saisieParDefaut(), generation: '2e', dimensionsControlees: true, profondeurComptee: true }],
  ['filante', filante()],
  ['filante 2e', filante({ generation: '2e' })],
  ['non drainee', argile()],
  ['non drainee 2e', argile({ generation: '2e' })],
  ['les deux', { ...saisieParDefaut(), comportement: 'les_deux' }],
  ['les deux 2e', { ...saisieParDefaut(), comportement: 'les_deux', generation: '2e' }],
  ['sans nappe', { ...saisieParDefaut(), avecNappe: false }],
  ['nappe haute', { ...saisieParDefaut(), Dw: '0,5' }],
  ['nappe profonde', { ...saisieParDefaut(), Dw: '20' }],
  ['base lisse', { ...saisieParDefaut(), baseRugueuse: false }],
  ['sans poids propre', { ...saisieParDefaut(), ep: '0' }],
  ['deux directions', { ...saisieParDefaut(), HLG: '20', MLG: '120' }],
  ['permutee', permutee()],
  ['soulevee', soulevee()],
  ['soulevee 2e', soulevee({ generation: '2e' })],
  ['hors base', horsBase()],
  ['hors base 2e', horsBase({ generation: '2e' })],
  ['hors base les deux', horsBase({ comportement: 'les_deux' })],
  ['tassement', avecTassement()],
  ['tassement 2e', avecTassement({ generation: '2e' })],
  ['tassement filante', avecTassement({ ...filante(), avecTassement: true, couches: [COUCHE_1] })],
  ['tassement brut, souple', avecTassement({ pNette: false, raideur: 'souple' })],
  ['couches seules', avecTassement({ avecElastique: false })],
];
