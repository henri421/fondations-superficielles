/** Squelette (T3). */

import type { Calcul, Resultat } from './form';

export interface Vue {
  combinaison: string;
  sens: 'defavorable' | 'favorable';
  analyse: 'drainee' | 'nonDrainee';
}

export function vuesDisponibles(_r: Resultat): Vue[] {
  throw new Error('a ecrire');
}

export function vueGouvernante(_r: Resultat): Vue {
  throw new Error('a ecrire');
}

export function coupe(_calcul: Calcul, _r: Resultat, _vue: Vue, _options: { cotes: boolean }): string {
  throw new Error('a ecrire');
}

export function planSvg(_calcul: Calcul, _r: Resultat, _vue: Vue): string {
  throw new Error('a ecrire');
}
