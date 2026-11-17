/**
 * Annexe nationale luxembourgeoise (lot E, audit R4). Module PUR.
 *
 * Profil 1re generation construit a partir du profil recommande de sol-ec7 et de la table
 * commune `AN_LU` d'aedificium-ui : chaque coefficient porte sa source ILNAS, presumee tant
 * que l'annexe n'est pas lue. L'annexe luxembourgeoise ne couvre pas la 2e generation.
 */

import { valeurLu } from 'aedificium-ui';
import { clauseDeSource, profil1g, reetiqueter1g, type Profil1g } from 'sol-ec7';

export function profilLu1g(): Profil1g {
  return reetiqueter1g(
    profil1g(),
    'Luxembourg, ILNAS-EN 1997-1/AN-LU:2020 (valeurs présumées, à vérifier)',
    '2026-11-17',
    (v, chemin) => valeurLu('EN 1997-1', chemin, v, clauseDeSource(v.source)),
  );
}
