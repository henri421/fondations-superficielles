/**
 * Contenu de la note de calcul commune (`noteDeCalculHtml` d'aedificium-ui).
 *
 * Module PUR : aucun calcul. Les lignes d'entree et les blocs de resultat viennent
 * de `vue.ts` (`blocEntrees`, `blocsResultat`) ; les verifications sont les taux du
 * noyau, rangés par combinaison, et l'excentricite de 1re generation est le rapport
 * e/(B/3) que la carte de l'ecran presente deja.
 */

import { type ElementNote, type LigneResultat, type NoteDeCalcul, type VerificationNote, nombreAffiche } from 'aedificium-ui';
import type { Calcul, Resultat } from './form';
import { coupe, planSvg, vueGouvernante } from './dessin';
import { phrase, ponctuer, textes } from './textes';
import { blocEntrees, blocsResultat } from './vue';
import { VERSION_OUTIL } from './version';

type Cas = Resultat['combinaisons'][number]['cas'][number];
type Analyse = 'drainee' | 'nonDrainee';
type Section = 'geometrie' | 'materiaux' | 'hypotheses' | 'charges';

interface Coefficient {
  valeur: number;
  source: string;
}

const NORMES: Record<Resultat['generation'], string> = {
  '1re': 'EN 1997-1:2004',
  '2e': 'EN 1997-1:2024, EN 1997-3:2025, EN 1990:2023',
};

/** Symboles des coefficients rendus par le noyau ; une cle inconnue s'affiche telle quelle. */
const SYM_COEF: Record<string, string> = {
  gG_dst: 'γG,dst',
  gG_stb: 'γG,stb',
  gQ_dst: 'γQ,dst',
  gQ_stb: 'γQ,stb',
  gPhi: 'γφ′',
  gC: 'γc′',
  gCu: 'γcu',
  gRv: 'γRv',
};

const GEOMETRIE = new Set(['B', 'L', 'D', 'e_s', 'gamma_c']);
const CHARGES = new Set(['V_G', 'V_Q', 'H_BG', 'H_BQ', 'H_LG', 'H_LQ', 'M_BG', 'M_BQ', 'M_LG', 'M_LQ']);

const ok = (taux: number): boolean => Number.isFinite(taux) && taux <= 1;
const verif = (nom: string, clause: string, taux: number): VerificationNote => ({ nom, clause, taux, ok: ok(taux) });
const maxOuNan = (xs: number[]): number => (xs.length === 0 ? NaN : Math.max(...xs));
const bloc = (titre: string, lignes: LigneResultat[]): ElementNote => ({ type: 'bloc', bloc: { titre, lignes, note: null } });

/** Verifications : portance et glissement par combinaison et par analyse (pire cas des deux sens), puis l'excentricite. */
function verificationsDe(r: Resultat): VerificationNote[] {
  const t = textes();
  const n = t.note;
  const v = t.vue;
  const g2 = r.generation === '2e';
  const out: VerificationNote[] = [];

  const analyses: Analyse[] = [];
  if (r.tauxMax.portanceDrainee !== null) analyses.push('drainee');
  if (r.tauxMax.portanceNonDrainee !== null) analyses.push('nonDrainee');

  const mesure = (x: Cas, a: Analyse) => (a === 'drainee' ? x.drainee : x.nonDrainee);
  for (const c of r.combinaisons) {
    for (const a of analyses) {
      const portance = maxOuNan(c.cas.flatMap((x) => (mesure(x, a) ? [mesure(x, a)!.taux] : [])));
      const glissement = maxOuNan(c.cas.flatMap((x) => (mesure(x, a) ? [mesure(x, a)!.glissement.taux] : [])));
      const nom = `${phrase(c.nom)} · ${v.analyses[a]}`;
      out.push(verif(`${nom} · ${n.portance}`, g2 ? v.clauses.portance2 : v.clauses.portance1, portance));
      out.push(verif(`${nom} · ${n.glissement}`, g2 ? v.clauses.glissement2 : v.clauses.glissement1, glissement));
    }
  }

  if (r.els !== null) {
    for (const k of ['permanentes', 'totales'] as const) {
      const l = r.els[k];
      out.push(verif(`${n.excentricite} · ${v.excentriciteDeux[k]}`, v.clauses.excentricite2, l.valeur / l.limite));
    }
  } else {
    // Presentation de la carte d'excentricite : e_B / (B/3), pire cas sur les deux analyses.
    const rapports: number[] = [];
    for (const c of r.combinaisons) {
      for (const x of c.cas) {
        for (const a of [x.drainee, x.nonDrainee]) {
          if (a) rapports.push(a.eB / (r.B / 3));
        }
      }
    }
    out.push(verif(n.excentricite, v.clauses.excentricite1, maxOuNan(rapports)));
  }
  return out;
}

/** Coefficients partiels de chaque combinaison, avec leur source, en lignes de note. */
function blocsCoefficients(r: Resultat): ElementNote[] {
  const t = textes();
  const groupes = t.vue.groupesCoef as Record<string, string>;
  return r.coefficients.map((c) => {
    const lignes: LigneResultat[] = Object.entries(c as unknown as Record<string, unknown>)
      .filter(([g]) => g !== 'nom')
      .flatMap(([g, coefs]) =>
        Object.entries(coefs as Record<string, Coefficient>).map(([k, co]) => ({
          symbole: SYM_COEF[k] ?? k,
          libelle: ponctuer(`${groupes[g] ?? g} : ${phrase(co.source)}`),
          valeur: Number.isFinite(co.valeur) ? nombreAffiche(co.valeur, 2) : t.vue.nonCalculable,
        })),
      );
    return bloc(ponctuer(`${t.note.coefficients} : ${phrase(c.nom)}`), lignes);
  });
}

/** Note du calcul courant, sans verdict global. */
export function noteDuCalcul(
  calcul: Calcul,
  r: Resultat,
  cartouche: { projet: string; element: string; date: string },
): NoteDeCalcul {
  const t = textes();
  const n = t.note;
  const e = t.vue.entrees;
  const g2 = r.generation === '2e';

  const entrees = blocEntrees(calcul);
  const HYPOTHESES = new Set([e.symboleGeneration, e.symboleApproche, e.symboleClasse, e.symboleDimensions, e.symboleProfondeur, 'D_w']);
  const sectionDe = (symbole: string): Section => {
    if (CHARGES.has(symbole)) return 'charges';
    if (HYPOTHESES.has(symbole)) return 'hypotheses';
    if (GEOMETRIE.has(symbole)) return 'geometrie';
    return 'materiaux';
  };
  const lignes = (s: Section): LigneResultat[] => entrees.lignes.filter((l) => sectionDe(l.symbole) === s);
  const titre = e.titre;

  const v = vueGouvernante(r);
  const calculs: ElementNote[] = [
    ...blocsResultat(r)
      .slice(1) // le premier bloc redit les taux des verdicts, en cles brutes : il reste a l'ecran
      .map((b): ElementNote => ({ type: 'bloc', bloc: b })),
    ...blocsCoefficients(r),
  ];

  // Les alertes du noyau sont des cles ; la note les dit en clair.
  const alertes: Record<string, string> = {
    hors_base: t.vue.alertes.horsBase,
    soulevement: t.vue.alertes.soulevement,
    excentricite_B: n.alertes.excentriciteB,
    excentricite_L: n.alertes.excentriciteL,
    els_permanentes: n.alertes.elsPermanentes,
    els_totales: n.alertes.elsTotales,
  };
  const avertissements = r.alertes.map((a) => alertes[a] ?? phrase(a));
  if (r.combinaisons.some((c) => c.cas.some((x) => x.nonDrainee?.glissement.limite04))) {
    avertissements.push(t.vue.alertes.plafond04);
  }

  return {
    cartouche: {
      version: VERSION_OUTIL,
      projet: cartouche.projet,
      element: cartouche.element.trim() === '' ? n.element : cartouche.element,
      date: cartouche.date,
      norme: NORMES[r.generation],
      outil: 'fondations-superficielles',
    },
    sections: {
      geometrie: [
        bloc(titre, lignes('geometrie')),
        { type: 'figure', svg: coupe(calcul, r, v, { cotes: true }), legende: n.legendeCoupe },
        { type: 'figure', svg: planSvg(calcul, r, v), legende: n.legendePlan },
      ],
      materiaux: [bloc(titre, lignes('materiaux'))],
      hypotheses: [
        bloc(titre, lignes('hypotheses')),
        { type: 'liste', items: [...(g2 ? n.recommandations2e : n.recommandations1re), ...t.vue.hypotheses] },
        { type: 'texte', texte: n.mention },
        { type: 'texte', texte: n.horsPerimetre },
      ],
      charges: [bloc(titre, lignes('charges'))],
      calculs,
    },
    verifications: verificationsDe(r),
    avertissements,
  };
}
