/**
 * Les dessins de l'interface : la coupe de la semelle (terrain, nappe, efforts
 * N et T, rectangle sur B', cotes) et le plan (surface efficace, point
 * d'application, losange et ellipse de service). PUR : aucun texte n'est lu
 * au chargement du module.
 *
 * Echelle reelle, une seule echelle par dessin. Le dessin ne calcule rien
 * d'autre que des proportions tirees du resultat. Aucun NaN ni Infinity
 * n'atteint un attribut.
 */

import { nombreAffiche, notationSvg } from 'aedificium-ui';
import type { Calcul, Resultat } from './form';
import { ponctuer, textes } from './textes';

export interface Vue {
  combinaison: string;
  sens: 'defavorable' | 'favorable';
  analyse: 'drainee' | 'nonDrainee';
}

const LARGEUR = 560;
/** Coupe : hauteur maximale, marges en metres autour de la semelle. */
const HAUTEUR_COUPE = 420;
const MARGE_X_COUPE = 1.6;
const MARGE_HAUT = 1.0;
const MARGE_BAS_COUPE = 1.2;
/** Au-dela de D + 2,5 m, la nappe est tracee a cette profondeur et le dessin le dit. */
const PROFONDEUR_NAPPE_MAX = 2.5;
/** Plan : hauteur maximale hors legende, marges en metres. */
const HAUTEUR_PLAN = 340;
const LEGENDE = 80;
const MARGE_X_PLAN = 1.0;
const MARGE_HAUT_PLAN = 0.5;
const MARGE_BAS_PLAN = 0.9;

const DEFS =
  '<defs>' +
  '<pattern id="ml-eff" width="7" height="7" patternUnits="userSpaceOnUse"><path class="efficace-trame" d="M0 7L7 0"/></pattern>' +
  '<marker id="ml-tr" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path class="tete-traction" d="M0 0L10 5L0 10z"/></marker>' +
  '<marker id="ml-tc" viewBox="0 0 8 8" refX="4" refY="4" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path class="tete-cote" d="M1 7L7 1"/></marker>' +
  '</defs>';

const TRAITS = 'marker-start="url(#ml-tc)" marker-end="url(#ml-tc)"';

/** Nombre fini, ou `repli`. */
const fini = (v: number, repli = 0): number => (Number.isFinite(v) ? v : repli);

/** Attribut numerique, jamais NaN ni Infinity. */
const attr = (v: number): string => (Number.isFinite(v) ? String(Number(v.toFixed(2))) : '0');

/** Nombre affiche, sans NaN. */
const nb = (v: number, decimales: number): string => nombreAffiche(fini(v), decimales);

/** Tout texte de SVG. */
const tx = (s: string): string => notationSvg(ponctuer(s));

const SENS: Vue['sens'][] = ['defavorable', 'favorable'];

/** Analyse portee par chaque verification du gouvernant. */
const ANALYSE_DE: Record<Resultat['gouvernant']['verification'], Vue['analyse']> = {
  portanceDrainee: 'drainee',
  glissementDraine: 'drainee',
  portanceNonDrainee: 'nonDrainee',
  glissementNonDraine: 'nonDrainee',
};

function casDe(r: Resultat, vue: Vue) {
  const c = r.combinaisons.find((x) => x.nom === vue.combinaison);
  const k = c?.cas.find((x) => x.sens === vue.sens);
  if (!k) throw new Error(`vue inconnue : ${vue.combinaison} ${vue.sens}`);
  return k;
}

/** Chaque combinaison, dans les deux sens, avec chaque analyse presente. */
export function vuesDisponibles(r: Resultat): Vue[] {
  const vues: Vue[] = [];
  for (const c of r.combinaisons) {
    for (const sens of SENS) {
      const k = c.cas.find((x) => x.sens === sens);
      if (!k) continue;
      if (k.drainee) vues.push({ combinaison: c.nom, sens, analyse: 'drainee' });
      if (k.nonDrainee) vues.push({ combinaison: c.nom, sens, analyse: 'nonDrainee' });
    }
  }
  return vues;
}

/** La vue qui s'ouvre d'abord : le cas gouvernant. */
export function vueGouvernante(r: Resultat): Vue {
  const vues = vuesDisponibles(r);
  const g = r.gouvernant;
  const analyse = ANALYSE_DE[g.verification];
  return (
    vues.find((v) => v.combinaison === g.combinaison && v.sens === g.sens && v.analyse === analyse) ??
    vues.find((v) => v.combinaison === g.combinaison && v.sens === g.sens) ??
    vues[0] ?? { combinaison: g.combinaison, sens: g.sens, analyse: 'drainee' }
  );
}

/** Dimensions a dessiner : B nominal (largeur saisie), L (null en filante), D, e, nappe. */
function geometrie(calcul: Calcul, r: Resultat) {
  const d = calcul.donnees;
  const B = Number.isFinite(r.B) && r.B > 0 ? r.B : d.B;
  const L = d.L !== null && Number.isFinite(d.L) && d.L > 0 ? d.L : null;
  const Dw = d.sol.Dw !== null && Number.isFinite(d.sol.Dw) && d.sol.Dw >= 0 ? d.sol.Dw : null;
  return { B, L, D: fini(d.D), ep: fini(d.ep), Dw };
}

interface Lecture {
  N: number;
  T: number;
  A: number;
  eB: number;
  eL: number;
  /**
   * Largeur efficace selon B. Le noyau rend B' <= L' : parmi (Bp, Lp), la plus proche de
   * B - 2 e_B est celle qui se lit selon B ; l'autre donne la longueur efficace.
   */
  Beff: number;
  /** Longueur efficace selon L ; null en filante. */
  Leff: number | null;
  /** Vide quand le dessin trace la surface efficace ; sinon, ce qu'il faut dire en clair. */
  messages: string[];
}

function lire(calcul: Calcul, r: Resultat, vue: Vue): Lecture {
  const k = casDe(r, vue);
  const an = vue.analyse === 'drainee' ? k.drainee : k.nonDrainee;
  if (!an) throw new Error(`analyse absente : ${vue.analyse}`);
  const { B } = geometrie(calcul, r);
  const N = vue.analyse === 'drainee' && k.drainee ? k.drainee.N : k.N_d;
  const alertes = textes().vue.alertes;
  const messages: string[] = [];
  if (Number.isFinite(N) && N <= 0) messages.push(alertes.soulevement);
  if (an.horsBase) messages.push(alertes.horsBase);
  // Largeur de calcul du noyau : B, ou Bd = B - 0,1 m en 2e generation sans dimensions controlees.
  const Bcalc = calcul.generation === '2e' && !calcul.options.dimensionsControlees ? B - 0.1 : B;
  const nominal = Bcalc - 2 * an.eB;
  let Beff = an.Bp;
  let Leff: number | null = null;
  if (an.Lp !== null) {
    const proche = Math.abs(an.Bp - nominal) <= Math.abs(an.Lp - nominal);
    Beff = proche ? an.Bp : an.Lp;
    Leff = proche ? an.Lp : an.Bp;
  }
  const valide =
    Number.isFinite(N) && Number.isFinite(Beff) && Beff > 0 && (Leff === null || (Number.isFinite(Leff) && Leff > 0));
  if (!valide && messages.length === 0) {
    messages.push(`${textes().vue.dessin.surfaceEfficace} : ${textes().vue.nonCalculable}`);
  }
  return {
    N: fini(N),
    T: fini(k.T_d),
    A: fini(an.A),
    eB: fini(an.eB),
    eL: fini(an.eL),
    Beff,
    Leff,
    messages,
  };
}

/**
 * La coupe de la semelle, dans la vue demandee.
 *
 * Echelle unique. Le terrain est a y = ySol ; la base est a la profondeur D, la
 * semelle occupe D - e a D. Le rectangle sur B' se place sous la base, aligne
 * sur le bord droit de la semelle ; la resultante passe par x = e_B.
 */
export function coupe(calcul: Calcul, r: Resultat, vue: Vue, options: { cotes: boolean }): string {
  const lec = lire(calcul, r, vue);
  const { B, D, ep, Dw } = geometrie(calcul, r);
  const dwAff = Dw === null ? null : Math.min(Dw, D + PROFONDEUR_NAPPE_MAX);
  const profondeur = Math.max(D, dwAff ?? 0);
  const hauteurM = MARGE_HAUT + profondeur + MARGE_BAS_COUPE;
  const k = Math.min(LARGEUR / (B + 2 * MARGE_X_COUPE), HAUTEUR_COUPE / hauteurM);
  const H = hauteurM * k;
  const cx = LARGEUR / 2;
  const X = (m: number): number => cx + m * k;
  const Y = (z: number): number => (MARGE_HAUT + z) * k;
  const ySol = Y(0);
  const yBase = Y(D);
  const ySup = Y(D - ep);
  const hE = 0.5 * ep * k;
  const yE = yBase + 4;
  const t = textes().vue.dessin;
  const out: string[] = [];

  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LARGEUR} ${attr(H)}" role="img" aria-label="${tx(t.coupe)}">`,
    DEFS,
    `<rect class="terrain" x="0" y="${attr(ySol)}" width="${LARGEUR}" height="${attr(H - ySol)}"/>`,
    `<line class="sol" x1="0" y1="${attr(ySol)}" x2="${LARGEUR}" y2="${attr(ySol)}"/>`,
    `<text class="etiquette" x="6" y="${attr(ySol - 6)}">${tx(t.terrain)}</text>`,
  );

  if (Dw !== null && dwAff !== null) {
    const yN = Y(dwAff);
    const hors = Dw > dwAff ? ` (${t.horsDessin})` : '';
    out.push(
      `<line class="nappe" x1="0" y1="${attr(yN)}" x2="${LARGEUR}" y2="${attr(yN)}"/>`,
      `<text class="etiquette" x="6" y="${attr(yN - 6)}">${tx(`${t.nappe} : ${nb(Dw, 2)} m${hors}`)}</text>`,
    );
  }

  out.push(`<rect class="semelle" x="${attr(X(-B / 2))}" y="${attr(ySup)}" width="${attr(B * k)}" height="${attr(ep * k)}"/>`);

  const valide = lec.messages.length === 0;
  if (valide) {
    const wE = lec.Beff * k;
    out.push(
      `<rect class="efficace" x="${attr(X(B / 2) - wE)}" y="${attr(yE)}" width="${attr(wE)}" height="${attr(hE)}"/>`,
      `<text class="valeur-traction" x="${attr(X(B / 2) + 6)}" y="${attr(yE + hE / 2 + 4)}">${tx(`${t.largeurEfficace} = ${nb(lec.Beff, 2)} m`)}</text>`,
    );
  }

  const xN = X(Math.min(Math.max(lec.eB, -B / 2), B / 2));
  const yTete = ySol - 0.6 * k;
  out.push(
    `<line class="resultante" x1="${attr(xN)}" y1="${attr(yTete)}" x2="${attr(xN)}" y2="${attr(yBase - 2)}" marker-end="url(#ml-tr)"/>`,
    `<text class="force-traction" x="${attr(xN + 6)}" y="${attr(yTete + 12)}">${tx(`${t.effort} = ${nb(lec.N, 1)} kN`)}</text>`,
  );

  // T part du bord de la base, vers l'exterieur, comme dans la maquette : son
  // etiquette ne couvre ni la semelle ni le rectangle sur B'.
  const sens = lec.T >= 0 ? 1 : -1;
  const lT = Math.min(0.35 * B * k, 70);
  const xT0 = sens > 0 ? X(B / 2) + 2 : X(-B / 2) - 2;
  const xT1 = xT0 + sens * lT;
  out.push(
    `<line class="effort-t" x1="${attr(xT0)}" y1="${attr(yBase)}" x2="${attr(xT1)}" y2="${attr(yBase)}" marker-end="url(#ml-tr)"/>`,
    `<text class="force-traction" x="${attr(xT1 + sens * 8)}" y="${attr(yBase + 4)}" text-anchor="${sens > 0 ? 'start' : 'end'}">${tx(`${t.tranchant} = ${nb(lec.T, 1)} kN`)}</text>`,
  );

  lec.messages.forEach((message, i) => {
    out.push(`<text class="alerte-dessin" x="6" y="${attr(14 + i * 15)}">${tx(message.charAt(0).toUpperCase() + message.slice(1))}</text>`);
  });

  if (options.cotes) {
    const xD = X(-B / 2 - 0.3);
    const xE = X(B / 2 + 0.3);
    // La cote de B s'ecarte de la nappe pour que ligne et texte ne se croisent pas.
    let yCote = yE + hE + 18;
    if (dwAff !== null) {
      const yN = Y(dwAff);
      if (yN > yCote - 12 && yN < yCote + 20) yCote = yN + 14;
    }
    out.push(
      `<line class="cote" x1="${attr(xD)}" y1="${attr(ySol)}" x2="${attr(xD)}" y2="${attr(yBase)}" ${TRAITS}/>`,
      `<text class="cote" x="${attr(xD - 6)}" y="${attr((ySol + yBase) / 2)}" text-anchor="end">${tx(`${t.coteD} = ${nb(D, 2)} m`)}</text>`,
      `<line class="cote" x1="${attr(xE)}" y1="${attr(ySup)}" x2="${attr(xE)}" y2="${attr(yBase)}" ${TRAITS}/>`,
      `<text class="cote" x="${attr(xE + 6)}" y="${attr((ySup + yBase) / 2)}">${tx(`${t.coteEp} = ${nb(ep, 2)} m`)}</text>`,
      `<line class="cote" x1="${attr(X(-B / 2))}" y1="${attr(yCote)}" x2="${attr(X(B / 2))}" y2="${attr(yCote)}" ${TRAITS}/>`,
      `<text class="cote" x="${attr(cx)}" y="${attr(yCote + 14)}" text-anchor="middle">${tx(`${t.coteB} = ${nb(B, 2)} m`)}</text>`,
    );
  }

  out.push(`</svg>`);
  return out.join('');
}

/**
 * Le plan de la semelle : surface efficace centree sur le point d'application
 * (decale de e_B, e_L), losange de service (B/6 et L/6 du centre) et ellipse de
 * service (B/3 et L/3). En filante : une bande d'un metre, sans losange ni ellipse.
 */
export function planSvg(calcul: Calcul, r: Resultat, vue: Vue): string {
  const lec = lire(calcul, r, vue);
  const { B, L } = geometrie(calcul, r);
  const filante = L === null;
  const Hd = L ?? 1;
  const k = Math.min(LARGEUR / (B + 2 * MARGE_X_PLAN), HAUTEUR_PLAN / (MARGE_HAUT_PLAN + Hd + MARGE_BAS_PLAN));
  const cx = LARGEUR / 2;
  const cy = (MARGE_HAUT_PLAN + Hd / 2) * k;
  const bas = cy + (Hd * k) / 2;
  const H = (MARGE_HAUT_PLAN + Hd + MARGE_BAS_PLAN) * k + LEGENDE;
  const t = textes().vue.dessin;
  const u = textes().vue.unites;
  const valide = lec.messages.length === 0;
  const eLpx = filante ? 0 : lec.eL * k;
  const out: string[] = [];

  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LARGEUR} ${attr(H)}" role="img" aria-label="${tx(t.plan)}">`,
    DEFS,
    `<rect class="semelle" x="${attr(cx - (B * k) / 2)}" y="${attr(cy - (Hd * k) / 2)}" width="${attr(B * k)}" height="${attr(Hd * k)}"/>`,
  );

  if (!filante) {
    const bx = (B * k) / 6;
    const hy = (Hd * k) / 6;
    out.push(
      `<polygon class="losange" points="${attr(cx - bx)},${attr(cy)} ${attr(cx)},${attr(cy - hy)} ${attr(cx + bx)},${attr(cy)} ${attr(cx)},${attr(cy + hy)}"/>`,
      `<ellipse class="ellipse-service" cx="${attr(cx)}" cy="${attr(cy)}" rx="${attr((B * k) / 3)}" ry="${attr((Hd * k) / 3)}"/>`,
    );
  }

  if (valide) {
    const wE = lec.Beff * k;
    const hE = (lec.Leff ?? Hd) * k;
    out.push(
      `<rect class="efficace" x="${attr(cx + lec.eB * k - wE / 2)}" y="${attr(cy + eLpx - hE / 2)}" width="${attr(wE)}" height="${attr(hE)}"/>`,
      `<circle class="point-application" cx="${attr(cx + lec.eB * k)}" cy="${attr(cy + eLpx)}" r="4"/>`,
      `<text class="valeur-traction" x="6" y="14">${tx(`${t.aire} = ${nb(lec.A, 2)} ${u.m2}`)}</text>`,
    );
  } else {
    lec.messages.forEach((message, i) => {
      out.push(`<text class="alerte-dessin" x="6" y="${attr(14 + i * 15)}">${tx(message.charAt(0).toUpperCase() + message.slice(1))}</text>`);
    });
  }

  out.push(
    `<text class="etiquette" x="${attr(cx)}" y="${attr(bas + 16)}" text-anchor="middle">${tx(`${t.coteB} = ${nb(B, 2)} m`)}</text>`,
    filante
      ? `<text class="etiquette" x="${attr(cx + (B * k) / 2 + 6)}" y="${attr(cy + 4)}">${tx(t.parMetre)}</text>`
      : `<text class="etiquette" x="${attr(cx + (B * k) / 2 + 6)}" y="${attr(cy + 4)}">${tx(`${t.coteL} = ${nb(L ?? 0, 2)} m`)}</text>`,
  );

  const legende = [t.surfaceEfficace, t.pointApplication, ...(filante ? [] : [t.losange, t.ellipse])];
  const yLegende = (MARGE_HAUT_PLAN + Hd + MARGE_BAS_PLAN) * k + 14;
  legende.forEach((texte, i) => {
    out.push(`<text class="etiquette" x="6" y="${attr(yLegende + i * 15)}">${tx(texte)}</text>`);
  });

  out.push(`</svg>`);
  return out.join('');
}
