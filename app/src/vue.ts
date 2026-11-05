/**
 * Rendu HTML des verdicts, volets et blocs. PUR : aucun calcul ici, sauf les
 * presentations tirees du resultat (rapport e/(B/3), largeurs de jauge).
 * Tout vient du resultat du noyau (`form.ts`) ou du calcul.
 */

import { type BlocResultat, nombreAffiche, notationHtml, tauxAffiche } from 'aedificium-ui';
import type { Calcul, Resultat } from './form';
import { phrase, textes } from './textes';

type Cas = Resultat['combinaisons'][number]['cas'][number];
type Analyse = 'drainee' | 'nonDrainee';
type ClefTaux = keyof Resultat['tauxMax'];
interface Candidat {
  nom: string;
  cas: Cas;
  taux: number;
}

/** Nombre affiche ; une valeur non finie ne sort jamais en clair. */
const aff = (v: number, d = 1): string => (Number.isFinite(v) ? nombreAffiche(v, d) : textes().vue.nonCalculable);
const taux = (v: number): string => (Number.isFinite(v) ? tauxAffiche(v) : textes().vue.nonCalculable);
const sym = (s: string): string => notationHtml(s);

/** Largeur de jauge, bornee a 100 ; 100 pour un taux infini, 0 pour NaN. */
function largeur(t: number): string {
  if (Number.isNaN(t)) return '0';
  if (!Number.isFinite(t)) return t > 0 ? '100' : '0';
  return String(Math.min(100, Math.max(0, Math.round(t * 1000) / 10)));
}

/** Fraction lisible pour une limite de service (1/3, 1/6, 1/9), sinon nombre. */
const FRACTIONS: [number, string][] = [
  [1 / 3, '1/3'],
  [1 / 6, '1/6'],
  [1 / 9, '1/9'],
];
function fraction(limite: number): string {
  const f = FRACTIONS.find(([v]) => Math.abs(v - limite) < 1e-9);
  return f ? f[1] : aff(limite, 3);
}

interface Carte {
  nom: string;
  clause: string;
  taux: number;
  detail: string;
  alertes?: string[];
  cle?: ClefTaux;
  depasse?: boolean;
}

/** Une carte de verdict. Un taux non fini ou au-dela de 1 est marque `depasse`. */
function carte(c: Carte): string {
  const depasse = c.depasse === true || !(c.taux <= 1) || (c.alertes?.length ?? 0) > 0;
  const attr = c.cle ? ` data-verification="${c.cle}"` : '';
  const alertes = (c.alertes ?? []).map((a) => `<p class="alerte">${a}</p>`).join('');
  return (
    `<div class="verdict${depasse ? ' depasse' : ''}"${attr}>` +
    `<h3>${c.nom} <span class="clause">${c.clause}</span></h3>` +
    `<div class="jauge"><i style="width:${largeur(c.taux)}%"></i></div>` +
    `<span class="taux">${taux(c.taux)}</span>` +
    `<p>${c.detail}</p>${alertes}</div>`
  );
}

/** Analyse de chaque verification de `tauxMax` : quelle analyse, et glissement ou portance. */
const ANALYSE: Record<ClefTaux, { analyse: Analyse; glissement: boolean }> = {
  portanceDrainee: { analyse: 'drainee', glissement: false },
  portanceNonDrainee: { analyse: 'nonDrainee', glissement: false },
  glissementDraine: { analyse: 'drainee', glissement: true },
  glissementNonDraine: { analyse: 'nonDrainee', glissement: true },
};

/** Le cas de plus fort taux pour une verification ; le premier en cas d'egalite. */
function candidat(r: Resultat, cle: ClefTaux): Candidat | null {
  const { analyse, glissement } = ANALYSE[cle];
  let best: Candidat | null = null;
  for (const c of r.combinaisons) {
    for (const x of c.cas) {
      const a = x[analyse];
      if (!a) continue;
      const v = glissement ? a.glissement.taux : a.taux;
      if (best === null || v > best.taux) best = { nom: c.nom, cas: x, taux: v };
    }
  }
  return best;
}

/** Soulevement et resultante hors de la base, dits en clair pour une analyse. */
function anomalies(r: Resultat, analyse: Analyse): string[] {
  const t = textes().vue;
  let horsBase = false;
  let soulevement = false;
  for (const c of r.combinaisons) {
    for (const x of c.cas) {
      const a = x[analyse];
      if (!a) continue;
      if (a.horsBase) horsBase = true;
      if (analyse === 'drainee' && x.drainee && x.drainee.N <= 0) soulevement = true;
    }
  }
  const out: string[] = [];
  if (horsBase) out.push(t.alertes.horsBase);
  if (soulevement) out.push(t.alertes.soulevement);
  return out;
}

/** Corps de la carte ELU : une equation du cas le plus defavorable de la verification. */
function detailElu(cle: ClefTaux, x: Cas): string {
  const t = textes().vue;
  const d = x.drainee;
  const nd = x.nonDrainee;
  if (cle === 'portanceDrainee' && d) {
    return `${sym("N'_d")} = ${aff(d.N)} ${t.unites.kN} ≤ ${sym('R_d')} = ${aff(d.R_d)} ${t.unites.kN}`;
  }
  if (cle === 'portanceNonDrainee' && nd) {
    return `${sym('N_d')} = ${aff(x.N_d)} ${t.unites.kN} ≤ ${sym('R_d')} = ${aff(nd.R_d)} ${t.unites.kN}`;
  }
  if (cle === 'glissementDraine' && d) {
    return `${sym('T_d')} = ${aff(x.T_d)} ${t.unites.kN} ≤ ${sym('R_d')} = ${aff(d.glissement.R_d)} ${t.unites.kN}`;
  }
  if (cle === 'glissementNonDraine' && nd) {
    return `${sym('T_d')} = ${aff(x.T_d)} ${t.unites.kN} ≤ ${sym('R_d')} = ${aff(nd.glissement.R_d)} ${t.unites.kN}`;
  }
  return '';
}

function carteElu(r: Resultat, cle: ClefTaux, g2: boolean): string {
  const t = textes().vue;
  const { analyse, glissement } = ANALYSE[cle];
  const cand = candidat(r, cle);
  const clause = glissement
    ? g2
      ? t.clauses.glissement2
      : t.clauses.glissement1
    : g2
      ? t.clauses.portance2
      : t.clauses.portance1;
  const detail = cand ? `${phrase(cand.nom)}, ${t.sens[cand.cas.sens]} : ${detailElu(cle, cand.cas)}` : '';
  return carte({
    nom: t.cartes[cle],
    clause,
    taux: r.tauxMax[cle] as number,
    detail,
    alertes: glissement ? [] : anomalies(r, analyse),
    cle,
  });
}

/** Excentricite de la 1re generation : e_B / (B/3), pire cas sur les deux analyses. */
function excentricite1(r: Resultat): string {
  const t = textes().vue;
  let pire: { eB: number; B: number; taux: number } | null = null;
  for (const c of r.combinaisons) {
    for (const x of c.cas) {
      for (const a of [x.drainee, x.nonDrainee]) {
        if (!a) continue;
        const B = r.B;
        const v = a.eB / (B / 3);
        if (pire === null || v > pire.taux) pire = { eB: a.eB, B, taux: v };
      }
    }
  }
  if (pire === null) return '';
  return carte({
    nom: t.cartes.excentricite,
    clause: t.clauses.excentricite1,
    taux: pire.taux,
    detail: `${sym('e_B')} = ${aff(pire.eB, 3)} m ≤ ${sym('B/3')} = ${aff(pire.B / 3, 3)} m`,
  });
}

/** Excentricite de la 2e generation : permanentes et totales, valeur et limite du noyau. */
function excentricite2(r: Resultat): string {
  const t = textes().vue;
  const e = r.els;
  if (!e) return '';
  return (['permanentes', 'totales'] as const)
    .map((k) => {
      const l = e[k];
      return carte({
        nom: `${t.cartes.excentricite}, ${t.excentriciteDeux[k]}`,
        clause: t.clauses.excentricite2,
        taux: l.valeur / l.limite,
        detail: `${sym('e')} = ${aff(l.valeur, 3)} ≤ ${fraction(l.limite)}`,
        depasse: !l.ok,
      });
    })
    .join('');
}

/** Le tassement : pression, methodes renseignees, sans jauge ni seuil. */
function groupeTassement(r: Resultat): string {
  const t = textes().vue;
  const ts = r.tassement;
  if (!ts) return '';
  const el = ts.elastique
    ? `<br>${t.tassement.elastique} : ${aff(ts.elastique.s_mm)} mm (${sym('I_s')} = ${aff(ts.elastique.Is, 2)})`
    : '';
  const co = ts.couches
    ? `<br>${t.tassement.couches} : ${aff(ts.couches.centre_mm)} mm ${t.tassement.auCentre} ; ${aff(ts.couches.coin_mm)} mm ${t.tassement.auCoin}`
    : '';
  if (!el && !co) return '';
  return (
    `<section class="groupe-verdicts" data-groupe="tassement"><h2>${t.groupes.tassement}</h2>` +
    `<div class="verdict constat"><h3>${t.cartes.tassement} <span class="clause">${t.clauses.tassement}</span></h3>` +
    `<p>${t.tassement.pression} = ${aff(ts.p)} ${t.unites.kPa}${el}${co}</p></div>` +
    `<span class="note">${t.tassement.constat}</span></section>`
  );
}

export function verdictsHtml(r: Resultat): string {
  const t = textes().vue;
  const g2 = r.generation === '2e';
  const cles = (Object.keys(r.tauxMax) as ClefTaux[]).filter((k) => r.tauxMax[k] !== null);
  const elu = cles.map((k) => carteElu(r, k, g2)).join('');
  const plafond = r.combinaisons.some((c) => c.cas.some((x) => x.nonDrainee?.glissement.limite04))
    ? `<p class="alerte">${t.alertes.plafond04}</p>`
    : '';
  const exc = g2 ? excentricite2(r) : excentricite1(r);
  return (
    `<section class="groupe-verdicts" data-groupe="elu"><h2>${t.groupes.elu}</h2>${elu}${plafond}</section>` +
    `<section class="groupe-verdicts" data-groupe="excentricite"><h2>${t.groupes.excentricite}</h2>${exc}</section>` +
    groupeTassement(r)
  );
}

/** Ligne du tableau de portance et de glissement, drainee ou non drainee. */
function ligneCas(nom: string, x: Cas, a: Analyse, gouverne: boolean): string {
  const t = textes().vue;
  const cl = gouverne ? ' class="gouverne"' : '';
  const entete = `<td>${phrase(nom)}</td><td>${t.sens[x.sens]}</td><td>${t.analyses[a]}</td>`;
  const v = a === 'drainee' ? x.drainee : x.nonDrainee;
  if (!v) return '';
  const effort = a === 'drainee' ? (x.drainee as NonNullable<Cas['drainee']>).N : x.N_d;
  return (
    `<tr${cl}>${entete}` +
    `<td class="n">${aff(effort)}</td><td class="n">${aff(x.T_d)}</td>` +
    `<td class="n">${aff(v.eB, 3)}</td><td class="n">${aff(v.Bp, 3)}</td><td class="n">${aff(v.A, 2)}</td>` +
    `<td class="n">${aff(v.q_u)}</td><td class="n">${aff(v.R_d)}</td><td class="n">${taux(v.taux)}</td>` +
    `<td class="n">${aff(v.glissement.R_d)}</td><td class="n">${taux(v.glissement.taux)}</td></tr>`
  );
}

/** Facteurs de portance du cas gouvernant d'une analyse. */
function facteurs(gouv: Candidat | null, a: Analyse): string {
  const t = textes().vue;
  if (!gouv) return '';
  const x = gouv.cas;
  const titre = `${phrase(gouv.nom)}, ${t.sens[x.sens]}, ${t.analyses[a]}`;
  if (a === 'drainee' && x.drainee) {
    const f = x.drainee.facteurs;
    return (
      `<details class="deriv"><summary>${t.volets.facteurs}</summary><div class="defile"><table><thead><tr>` +
      `<th></th><th class="n">N</th><th class="n">s</th><th class="n">i</th><th class="n">d</th></tr></thead><tbody>` +
      `<tr><td>c</td><td class="n">${aff(f.Nc, 3)}</td><td class="n">${aff(f.sc, 3)}</td><td class="n">${aff(f.ic, 3)}</td><td class="n">${aff(f.dc, 3)}</td></tr>` +
      `<tr><td>q</td><td class="n">${aff(f.Nq, 3)}</td><td class="n">${aff(f.sq, 3)}</td><td class="n">${aff(f.iq, 3)}</td><td class="n">${aff(f.dq, 3)}</td></tr>` +
      `<tr><td>γ</td><td class="n">${aff(f.Ngamma, 3)}</td><td class="n">${aff(f.sgamma, 3)}</td><td class="n">${aff(f.igamma, 3)}</td><td class="n">—</td></tr>` +
      `</tbody></table><p>${titre} : ${sym('m')} = ${aff(f.m, 3)} ; ${sym('q_u')} = ${aff(x.drainee.q_u)} ${t.unites.kPa}.</p></div></details>`
    );
  }
  if (a === 'nonDrainee' && x.nonDrainee) {
    const f = x.nonDrainee.facteurs;
    return (
      `<details class="deriv"><summary>${t.volets.facteurs}</summary><div class="defile"><table><thead><tr>` +
      `<th></th><th class="n">s</th><th class="n">i</th><th class="n">d</th></tr></thead><tbody>` +
      `<tr><td>c</td><td class="n">${aff(f.sc, 3)}</td><td class="n">${aff(f.ic, 3)}</td><td class="n">${aff(f.dc, 3)}</td></tr>` +
      `</tbody></table><p>${titre} : ${sym('q_u')} = ${aff(x.nonDrainee.q_u)} ${t.unites.kPa}.</p></div></details>`
    );
  }
  return '';
}

/** Symboles des coefficients partiels rendus par le noyau ; une cle inconnue s'affiche telle quelle. */
const SYM_COEF: Record<string, string> = {
  gG_dst: 'γ<sub>G,dst</sub>',
  gG_stb: 'γ<sub>G,stb</sub>',
  gQ_dst: 'γ<sub>Q,dst</sub>',
  gQ_stb: 'γ<sub>Q,stb</sub>',
  gPhi: 'γ<sub>φ′</sub>',
  gC: 'γ<sub>c′</sub>',
  gCu: 'γ<sub>cu</sub>',
  gRv: 'γ<sub>Rv</sub>',
};

/** Symbole d'un coefficient : table connue, sinon la cle avec son indice. */
const symboleCoef = (k: string): string => SYM_COEF[k] ?? (k.includes('_') ? `${k.replace('_', '<sub>')}</sub>` : k);

interface Coefficient {
  valeur: number;
  source: string;
}

/** Coefficients partiels de chaque combinaison, avec leur source, sans calcul. */
function coefficientsHtml(r: Resultat): string {
  const t = textes().vue;
  const lignes = r.coefficients
    .flatMap((c) =>
      Object.entries(c)
        .filter(([g]) => g !== 'nom')
        .flatMap(([g, coefs]) =>
          Object.entries(coefs as Record<string, Coefficient>).map(
            ([k, co]) =>
              `<tr><td>${phrase(c.nom)}</td><td>${(t.groupesCoef as Record<string, string>)[g] ?? g}</td><td>${symboleCoef(k)}</td>` +
              `<td class="n">${aff(co.valeur, 2)}</td><td>${phrase(co.source)}</td></tr>`,
          ),
        ),
    )
    .join('');
  return (
    `<details class="deriv"><summary>${t.volets.coefficients}</summary><div class="defile"><table><thead><tr>` +
    `<th>${t.colonnes.combinaison}</th><th>${t.colonnes.groupe}</th><th>${t.colonnes.coefficient}</th>` +
    `<th class="n">${t.colonnes.valeur}</th><th>${t.colonnes.source}</th>` +
    `</tr></thead><tbody>${lignes}</tbody></table></div></details>`
  );
}

/** Tranches de tassement : une ligne par tranche, avec son regime. Rien sans methode de couches. */
function tranchesHtml(r: Resultat): string {
  const t = textes().vue;
  const detail = r.tassement?.couches?.detail;
  if (!detail) return '';
  const lignes = detail
    .map(
      (d) =>
        `<tr data-tranche><td class="n">${aff(d.z, 2)}</td><td class="n">${aff(d.sigma0)}</td>` +
        `<td class="n">${aff(d.dSigmaCentre)}</td><td class="n">${aff(d.dSigmaCoin)}</td>` +
        `<td>${phrase(d.regime)}</td>` +
        `<td class="n">${aff(d.sCentre_mm, 1)}</td><td class="n">${aff(d.sCoin_mm, 1)}</td></tr>`,
    )
    .join('');
  return (
    `<details class="deriv"><summary>${t.volets.tranches}</summary><div class="defile"><table><thead><tr>` +
    `<th class="n">${t.tranches.z}</th><th class="n">${t.tranches.sigma0}</th>` +
    `<th class="n">${t.tranches.dSigmaCentre}</th><th class="n">${t.tranches.dSigmaCoin}</th>` +
    `<th>${t.tranches.regime}</th><th class="n">${t.tranches.centre}</th><th class="n">${t.tranches.coin}</th>` +
    `</tr></thead><tbody>${lignes}</tbody></table></div></details>`
  );
}

export function voletsHtml(r: Resultat): string {
  const t = textes().vue;
  const gD = candidat(r, 'portanceDrainee');
  const gN = candidat(r, 'portanceNonDrainee');

  const lignes = r.combinaisons
    .flatMap((c) =>
      c.cas.flatMap((x) => [
        x.drainee ? ligneCas(c.nom, x, 'drainee', gD !== null && x === gD.cas) : '',
        x.nonDrainee ? ligneCas(c.nom, x, 'nonDrainee', gN !== null && x === gN.cas) : '',
      ]),
    )
    .join('');

  return (
    `<details class="deriv" open><summary>${t.volets.elu}</summary>` +
    `<div class="defile"><table><thead><tr>` +
    `<th>${t.colonnes.combinaison}</th><th>${t.colonnes.sens}</th><th>${t.colonnes.analyse}</th>` +
    `<th class="n">${sym(t.colonnes.effort)}</th><th class="n">${sym(t.colonnes.tranchant)}</th>` +
    `<th class="n">${sym(t.colonnes.excentricite)}</th><th class="n">${sym(t.colonnes.largeur)}</th><th class="n">${sym(t.colonnes.aire)}</th>` +
    `<th class="n">${sym(t.colonnes.qu)}</th><th class="n">${sym(t.colonnes.rd)}</th><th class="n">${sym(t.colonnes.taux)}</th>` +
    `<th class="n">${sym(t.colonnes.rdGl)}</th><th class="n">${sym(t.colonnes.tauxGl)}</th>` +
    `</tr></thead><tbody>${lignes}</tbody></table>` +
    `<p>${t.volets.uniteElu}</p></div></details>` +
    facteurs(gD, 'drainee') +
    facteurs(gN, 'nonDrainee') +
    tranchesHtml(r) +
    coefficientsHtml(r) +
    `<details class="deriv"><summary>${t.volets.hypotheses}</summary>` +
    `<div><ul>${t.hypotheses.map((h) => `<li>${h}</li>`).join('')}</ul></div></details>`
  );
}

export function blocEntrees(calcul: Calcul): BlocResultat {
  const t = textes().vue;
  const e = t.entrees;
  const d = calcul.donnees;
  const lignes: { symbole: string; libelle: string; valeur: string }[] = [];
  const ligne = (symbole: string, libelle: string, valeur: string): void => {
    lignes.push({ symbole, libelle, valeur });
  };

  ligne(e.symboleGeneration, e.generation, t.generations[calcul.generation]);
  if (calcul.generation === '1re') {
    ligne(e.symboleApproche, e.approche, calcul.approche);
  } else {
    const o = calcul.options;
    ligne(e.symboleApproche, e.approche, t.approches2e[o.approche]);
    ligne(e.symboleClasse, e.classe, o.consequences);
    ligne(e.symboleDimensions, e.dimensions, o.dimensionsControlees ? e.oui : e.non);
    ligne(e.symboleProfondeur, e.profondeur, o.profondeurComptee ? e.oui : e.non);
  }

  ligne('B', e.largeur, `${aff(d.B, 2)} m`);
  if (d.L !== null) ligne('L', e.longueur, `${aff(d.L, 2)} m`);
  ligne('D', e.encastrement, `${aff(d.D, 2)} m`);
  ligne('e_s', e.epaisseur, `${aff(d.ep, 2)} m`);
  ligne('gamma_c', e.gammaBeton, `${aff(d.gammaBeton, 1)} kN/m³`);

  const a = d.actions;
  ligne('V_G', e.permanentes, `${aff(a.V_G)} kN`);
  ligne('V_Q', e.variables, `${aff(a.V_Q)} kN`);
  ligne('H_BG', e.horizontales, `${aff(a.H_BG)} kN`);
  ligne('H_BQ', e.horizontales, `${aff(a.H_BQ)} kN`);
  ligne('M_BG', e.moments, `${aff(a.M_BG)} kN·m`);
  ligne('M_BQ', e.moments, `${aff(a.M_BQ)} kN·m`);
  if (d.L !== null) {
    ligne('H_LG', e.horizontales, `${aff(a.H_LG)} kN`);
    ligne('H_LQ', e.horizontales, `${aff(a.H_LQ)} kN`);
    ligne('M_LG', e.moments, `${aff(a.M_LG)} kN·m`);
    ligne('M_LQ', e.moments, `${aff(a.M_LQ)} kN·m`);
  }

  const s = d.sol;
  if (s.phi !== null) {
    ligne('φ′', e.phi, `${aff(s.phi)} °`);
    ligne('c′', e.cohesion, `${aff(s.c)} kPa`);
  }
  if (s.cu !== null) {
    ligne('c_u', e.cu, `${aff(s.cu)} kPa`);
    ligne('eau', e.eauInterface, s.eauInterface ? e.oui : e.non);
  }
  ligne('γ', e.gamma, `${aff(s.gamma, 2)} kN/m³`);
  ligne('γ_sat', e.gammaSat, `${aff(s.gammaSat, 2)} kN/m³`);
  ligne('base', e.baseRugueuse, s.baseRugueuse ? e.oui : e.non);
  if (s.Dw !== null) ligne('D_w', e.nappe, `${aff(s.Dw, 2)} m`);

  const ts = d.tassement;
  if (ts) {
    ligne('p', e.pression, ts.pNette ? e.nette : e.brute);
    if (ts.elastique) {
      ligne('E_m', e.modules, `${aff(ts.elastique.Em, 0)} kPa`);
      ligne('ν', e.poisson, aff(ts.elastique.nu, 2));
      ligne('raideur', e.raideur, ts.elastique.raideur === 'rigide' ? e.rigide : e.souple);
    }
    (ts.couches ?? []).forEach((c, i) => {
      ligne(e.symboleCouche(i + 1), e.couche(i + 1), `h = ${aff(c.h, 2)} m ; σ′p = ${aff(c.sigmaP, 0)} kPa`);
    });
  }

  return { titre: e.titre, lignes, note: null };
}

/** Taux et resultats d'un cas : une ligne par analyse presente. */
function blocsCas(nom: string, x: Cas): BlocResultat[] {
  const t = textes().vue;
  const out: BlocResultat[] = [];
  const titre = `${phrase(nom)}, ${t.sens[x.sens]}`;
  if (x.drainee) {
    const v = x.drainee;
    out.push({
      titre: `${titre}, ${t.analyses.drainee}`,
      lignes: [
        { symbole: "N'_d", libelle: t.colonnes.effort, valeur: `${aff(v.N)} kN` },
        { symbole: 'T_d', libelle: t.colonnes.tranchant, valeur: `${aff(x.T_d)} kN` },
        { symbole: 'e_B', libelle: t.colonnes.excentricite, valeur: `${aff(v.eB, 3)} m` },
        { symbole: "B'", libelle: t.colonnes.largeur, valeur: `${aff(v.Bp, 3)} m` },
        { symbole: 'q_u', libelle: t.colonnes.qu, valeur: `${aff(v.q_u)} kPa` },
        { symbole: 'R_d', libelle: t.colonnes.rd, valeur: `${aff(v.R_d)} kN` },
        { symbole: 'taux', libelle: t.colonnes.taux, valeur: taux(v.taux) },
        { symbole: 'R_d,gl', libelle: t.colonnes.rdGl, valeur: `${aff(v.glissement.R_d)} kN` },
        { symbole: 'taux gl.', libelle: t.colonnes.tauxGl, valeur: taux(v.glissement.taux) },
      ],
      note: null,
    });
  }
  if (x.nonDrainee) {
    const v = x.nonDrainee;
    out.push({
      titre: `${titre}, ${t.analyses.nonDrainee}`,
      lignes: [
        { symbole: 'N_d', libelle: t.colonnes.effort, valeur: `${aff(x.N_d)} kN` },
        { symbole: 'T_d', libelle: t.colonnes.tranchant, valeur: `${aff(x.T_d)} kN` },
        { symbole: 'e_B', libelle: t.colonnes.excentricite, valeur: `${aff(v.eB, 3)} m` },
        { symbole: "B'", libelle: t.colonnes.largeur, valeur: `${aff(v.Bp, 3)} m` },
        { symbole: 'q_u', libelle: t.colonnes.qu, valeur: `${aff(v.q_u)} kPa` },
        { symbole: 'R_d', libelle: t.colonnes.rd, valeur: `${aff(v.R_d)} kN` },
        { symbole: 'taux', libelle: t.colonnes.taux, valeur: taux(v.taux) },
        { symbole: 'R_d,gl', libelle: t.colonnes.rdGl, valeur: `${aff(v.glissement.R_d)} kN` },
        { symbole: 'taux gl.', libelle: t.colonnes.tauxGl, valeur: taux(v.glissement.taux) },
      ],
      note: null,
    });
  }
  return out;
}

/** Tassement : pression et methodes renseignees, pour le CSV et la note. */
function blocTassement(r: Resultat): BlocResultat | null {
  const t = textes().vue;
  const ts = r.tassement;
  if (!ts) return null;
  const lignes: { symbole: string; libelle: string; valeur: string }[] = [
    { symbole: 'p', libelle: t.tassement.pression, valeur: `${aff(ts.p)} kPa` },
  ];
  if (ts.elastique) {
    lignes.push({ symbole: 's', libelle: t.tassement.elastique, valeur: `${aff(ts.elastique.s_mm)} mm` });
    lignes.push({ symbole: 'I_s', libelle: t.tassement.elastique, valeur: aff(ts.elastique.Is, 2) });
  }
  if (ts.couches) {
    lignes.push({ symbole: 'centre', libelle: t.tassement.couches, valeur: `${aff(ts.couches.centre_mm)} mm` });
    lignes.push({ symbole: 'coin', libelle: t.tassement.couches, valeur: `${aff(ts.couches.coin_mm)} mm` });
  }
  return { titre: t.cartes.tassement, lignes, note: null };
}

export function blocsResultat(r: Resultat): BlocResultat[] {
  const t = textes().vue;
  const cles = (Object.keys(r.tauxMax) as ClefTaux[]).filter((k) => r.tauxMax[k] !== null);
  const resultats: BlocResultat = {
    titre: t.resultats,
    lignes: cles.map((k) => ({ symbole: k, libelle: t.cartes[k], valeur: taux(r.tauxMax[k] as number) })),
    note: null,
  };
  const cas = r.combinaisons.flatMap((c) => c.cas.flatMap((x) => blocsCas(c.nom, x)));
  const tass = blocTassement(r);
  return [resultats, ...cas, ...(tass ? [tass] : [])];
}

export function messageDErreur(e: unknown): string {
  return phrase(e instanceof Error ? e.message : String(e));
}
