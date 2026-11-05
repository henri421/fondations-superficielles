/**
 * Cablage de l'interface des fondations superficielles.
 *
 * Ce module ne calcule RIEN : il tient la saisie, appelle le noyau par `form`,
 * et confie la mise en forme aux modules purs. La generation n'est qu'un champ
 * de la saisie : la basculer ne touche a aucune valeur saisie.
 */

import {
  blocsEnTexte,
  definirLangue,
  echapper,
  langueDuDocument,
  noteDeCalculHtml,
  notationHtml,
  ouvrirOuTelecharger,
  resultatsEnCsv,
  svgAutonome,
  telecharger,
} from 'aedificium-ui';
import type { Resultat } from './form';
import { lireSaisie, relire, saisieParDefaut, serialiser, verifier, type Calcul, type Saisie } from './form';
import { coupe, planSvg, vuesDisponibles, vueGouvernante, type Vue } from './dessin';
import { STYLES_TRACE } from './export';
import { noteDuCalcul } from './note';
import { textes } from './textes';
import { blocEntrees, blocsResultat, messageDErreur, verdictsHtml, voletsHtml } from './vue';
import './style.css';

// La langue d'abord : tout rendu la lit (`index.html` ou `en/index.html`).
definirLangue(langueDuDocument(document));

const CLE_SAISIE = 'fondations-superficielles/saisie';
const CLE_CARTOUCHE = 'fondations-superficielles:cartouche';

function exige<T extends Element>(selecteur: string): T {
  const e = document.querySelector<T>(selecteur);
  if (e === null) throw new Error(textes().messages.elementAbsent(selecteur));
  return e;
}

const formulaire = exige<HTMLFormElement>('#formulaire');
const zones = {
  erreur: exige<HTMLElement>('[data-role="erreur"]'),
  couches: exige<HTMLElement>('[data-role="couches"]'),
  vues: exige<HTMLElement>('[data-role="vues"]'),
  sens: exige<HTMLElement>('[data-role="sens"]'),
  analyses: exige<HTMLElement>('[data-role="analyses"]'),
  coupe: exige<HTMLElement>('[data-role="coupe"]'),
  plan: exige<HTMLElement>('[data-role="plan"]'),
  verdicts: exige<HTMLElement>('[data-role="verdicts"]'),
  volets: exige<HTMLElement>('[data-role="volets"]'),
};
const champProjet = exige<HTMLInputElement>('[data-role="projet"]');
const champElement = exige<HTMLInputElement>('[data-role="element"]');

function charger(): Saisie | null {
  try {
    const t = window.localStorage.getItem(CLE_SAISIE);
    return t === null ? null : relire(t);
  } catch {
    return null;
  }
}

function memoriser(): void {
  try {
    window.localStorage.setItem(CLE_SAISIE, serialiser(saisie));
  } catch {
    // Stockage indisponible : la page fonctionne sans.
  }
}

function lireCartouche(): { projet: string; element: string } {
  try {
    const t = window.localStorage.getItem(CLE_CARTOUCHE);
    if (t === null) return { projet: '', element: '' };
    const c = JSON.parse(t) as { projet?: unknown; element?: unknown };
    return {
      projet: typeof c.projet === 'string' ? c.projet : '',
      element: typeof c.element === 'string' ? c.element : '',
    };
  } catch {
    return { projet: '', element: '' };
  }
}

let saisie: Saisie = charger() ?? saisieParDefaut();

interface Dernier {
  calcul: Calcul;
  resultat: Resultat;
}
let dernier: Dernier | null = null;
let vue: Vue | null = null;

type Racine = Record<string, unknown>;

function valeurDuChamp(cle: string): string | boolean {
  return (saisie as unknown as Racine)[cle] as string | boolean;
}

function ecrireLeChamp(cle: string, valeur: string | boolean): void {
  (saisie as unknown as Racine)[cle] = valeur;
}

function ecrireSaisie(): void {
  for (const e of formulaire.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-champ]')) {
    const cle = e.dataset.champ;
    if (cle === undefined) continue;
    const v = valeurDuChamp(cle);
    if (e instanceof HTMLInputElement && e.type === 'checkbox') e.checked = v === true;
    else e.value = String(v);
  }
  dessinerCouches();
  ajusterAffichage();
}

/** Les couches de tassement vivent dans la zone `data-role="couches"`, une par ligne. */
function dessinerCouches(): void {
  zones.couches.innerHTML = saisie.couches
    .map(
      (c, i) => `<tr>
        <td><input type="text" inputmode="decimal" data-couche="${i}" data-couche-champ="h" value="${echapper(c.h)}" aria-label="h de la couche ${i + 1}" /></td>
        <td><input type="text" inputmode="decimal" data-couche="${i}" data-couche-champ="gammaEff" value="${echapper(c.gammaEff)}" aria-label="γ’ de la couche ${i + 1}" /></td>
        <td><input type="text" inputmode="decimal" data-couche="${i}" data-couche-champ="Cc" value="${echapper(c.Cc)}" aria-label="Cc de la couche ${i + 1}" /></td>
        <td><input type="text" inputmode="decimal" data-couche="${i}" data-couche-champ="Cs" value="${echapper(c.Cs)}" aria-label="Cs de la couche ${i + 1}" /></td>
        <td><input type="text" inputmode="decimal" data-couche="${i}" data-couche-champ="e0" value="${echapper(c.e0)}" aria-label="e0 de la couche ${i + 1}" /></td>
        <td><input type="text" inputmode="decimal" data-couche="${i}" data-couche-champ="sigmaP" value="${echapper(c.sigmaP)}" aria-label="σ’p de la couche ${i + 1}" /></td>
        <td><button type="button" data-action="retirer-couche" data-couche="${i}" aria-label="Retirer la couche ${i + 1}">&times;</button></td>
      </tr>`
    )
    .join('');
}

function montrerErreur(message: string | null): void {
  zones.erreur.hidden = message === null;
  zones.erreur.innerHTML = message === null ? '' : notationHtml(message);
}

/** Les lignes qui dependent d'un choix s'affichent avec lui ; leur valeur reste en memoire. */
function ajusterAffichage(): void {
  for (const b of formulairesBoutons('[data-forme]')) {
    b.setAttribute('aria-pressed', String(b.dataset.forme === saisie.forme));
  }
  for (const b of formulairesBoutons('[data-comportement]')) {
    b.setAttribute('aria-pressed', String(b.dataset.comportement === saisie.comportement));
  }
  for (const b of formulairesBoutons('[data-generation]')) {
    b.setAttribute('aria-pressed', String(b.dataset.generation === saisie.generation));
  }
  for (const g of formulaire.querySelectorAll<HTMLElement>('[data-groupe]')) {
    g.hidden = g.dataset.groupe !== saisie.generation;
  }
  for (const z of formulaire.querySelectorAll<HTMLElement>('[data-si-forme]')) {
    z.hidden = z.dataset.siForme !== saisie.forme;
  }
  for (const z of formulaire.querySelectorAll<HTMLElement>('[data-si-sol]')) {
    const nonDraine = z.dataset.siSol === 'non-drainee';
    z.hidden = nonDraine ? saisie.comportement === 'draine' : saisie.comportement === 'non_draine';
  }
  for (const z of formulaire.querySelectorAll<HTMLElement>('[data-si-nappe]')) {
    z.hidden = !saisie.avecNappe;
  }
}

function formulairesBoutons(selecteur: string): HTMLButtonElement[] {
  return [...formulaire.querySelectorAll<HTMLButtonElement>(selecteur)];
}

function optionsDessin(): { cotes: boolean } {
  return { cotes: exige<HTMLInputElement>('[data-option="cotes"]').checked };
}

const memeVue = (a: Vue, b: Vue): boolean =>
  a.combinaison === b.combinaison && a.sens === b.sens && a.analyse === b.analyse;

type Axe = 'combinaison' | 'sens' | 'analyse';

/** Une rangee de boutons par axe (combinaison, sens, analyse), comme dans la maquette. */
function rangee(vues: Vue[], axe: Axe, libelle: (valeur: string) => string): string {
  const valeurs = [...new Set(vues.map((v) => v[axe]))];
  if (valeurs.length < 2 && axe === 'analyse') return '';
  return valeurs
    .map(
      (x) =>
        `<button type="button" data-axe="${axe}" data-valeur="${echapper(x)}" aria-pressed="${vue !== null && vue[axe] === x}">${echapper(libelle(x))}</button>`
    )
    .join('');
}

function dessinerVues(): void {
  const vues = dernier === null ? [] : vuesDisponibles(dernier.resultat);
  if (dernier !== null && (vue === null || !vues.some((v) => memeVue(v, vue as Vue)))) {
    vue = vueGouvernante(dernier.resultat) ?? vues[0] ?? null;
  }
  const t = textes().vue;
  zones.vues.innerHTML = rangee(vues, 'combinaison', (x) => x);
  zones.sens.innerHTML = rangee(vues, 'sens', (x) => t.sens[x as keyof typeof t.sens] ?? x);
  zones.analyses.innerHTML = rangee(vues, 'analyse', (x) => t.analyses[x as keyof typeof t.analyses] ?? x);
}

/** Change un axe de la vue courante ; garde les deux autres si ce cas existe. */
function choisirVue(axe: Axe, valeur: string): void {
  if (dernier === null) return;
  const vues = vuesDisponibles(dernier.resultat).filter((v) => v[axe] === valeur);
  const voulu = vue === null ? null : { ...vue, [axe]: valeur };
  vue = (voulu && vues.find((v) => memeVue(v, voulu as Vue))) ?? vues[0] ?? vue;
  dessinerVues();
  renduDessin();
}

function renduDessin(): void {
  if (dernier === null || vue === null) {
    zones.coupe.innerHTML = '';
    zones.plan.innerHTML = '';
    return;
  }
  zones.coupe.innerHTML = coupe(dernier.calcul, dernier.resultat, vue, optionsDessin());
  zones.plan.innerHTML = planSvg(dernier.calcul, dernier.resultat, vue);
}

function viderResultats(): void {
  dernier = null;
  vue = null;
  zones.vues.innerHTML = '';
  zones.sens.innerHTML = '';
  zones.analyses.innerHTML = '';
  zones.verdicts.innerHTML = '';
  zones.volets.innerHTML = '';
  renduDessin();
}

function recalculer(): void {
  memoriser();
  ajusterAffichage();
  const lecture = lireSaisie(saisie);
  if (!lecture.ok) {
    montrerErreur(lecture.message);
    viderResultats();
    return;
  }
  let resultat: Resultat;
  try {
    resultat = verifier(lecture.calcul);
  } catch (e) {
    montrerErreur(messageDErreur(e));
    viderResultats();
    return;
  }
  montrerErreur(null);
  dernier = { calcul: lecture.calcul, resultat };
  dessinerVues();
  zones.verdicts.innerHTML = verdictsHtml(resultat);
  zones.volets.innerHTML = voletsHtml(resultat);
  renduDessin();
}

formulaire.addEventListener('input', (evenement) => {
  const cible = evenement.target;
  if (!(cible instanceof HTMLInputElement || cible instanceof HTMLSelectElement)) return;

  const index = cible.dataset.couche;
  const champCouche = cible.dataset.coucheChamp;
  if (index !== undefined && champCouche !== undefined) {
    const i = Number(index);
    const couche = saisie.couches[i];
    if (couche === undefined) return;
    if (champCouche === 'h' || champCouche === 'gammaEff' || champCouche === 'Cc' || champCouche === 'Cs' || champCouche === 'e0' || champCouche === 'sigmaP') {
      couche[champCouche] = cible.value;
    }
    return recalculer();
  }

  const cle = cible.dataset.champ;
  if (cle === undefined) return;
  const valeur = cible instanceof HTMLInputElement && cible.type === 'checkbox' ? cible.checked : cible.value;
  ecrireLeChamp(cle, valeur);
  recalculer();
});

formulaire.addEventListener('change', (e) => {
  if (e.target instanceof HTMLSelectElement || (e.target instanceof HTMLInputElement && e.target.type === 'checkbox')) {
    e.target.dispatchEvent(new Event('input', { bubbles: true }));
  }
});

exige<HTMLInputElement>('[data-option="cotes"]').addEventListener('input', () => renduDessin());

document.addEventListener('click', (evenement) => {
  const cible = evenement.target;
  if (!(cible instanceof HTMLElement)) return;

  const forme = cible.dataset.forme;
  if (forme === 'isolee' || forme === 'filante') {
    saisie.forme = forme;
    return recalculer();
  }

  const comportement = cible.dataset.comportement;
  if (comportement === 'draine' || comportement === 'non_draine' || comportement === 'les_deux') {
    saisie.comportement = comportement;
    return recalculer();
  }

  const generation = cible.dataset.generation;
  if (generation === '1re' || generation === '2e') {
    saisie.generation = generation;
    ecrireSaisie();
    return recalculer();
  }

  const axe = cible.dataset.axe;
  if ((axe === 'combinaison' || axe === 'sens' || axe === 'analyse') && cible.dataset.valeur !== undefined) {
    return choisirVue(axe, cible.dataset.valeur);
  }

  const action = cible.dataset.action;
  if (action === undefined) return;

  if (action === 'ajouter-couche') {
    saisie.couches.push({ h: '2', gammaEff: '10', Cc: '0,25', Cs: '0,04', e0: '0,8', sigmaP: '120' });
    dessinerCouches();
    return recalculer();
  }
  if (action === 'retirer-couche') {
    const i = Number(cible.dataset.couche);
    if (Number.isInteger(i)) saisie.couches.splice(i, 1);
    dessinerCouches();
    return recalculer();
  }
  if (action === 'enregistrer') {
    return telecharger('fondations-superficielles.json', serialiser(saisie), 'application/json;charset=utf-8');
  }
  if (action === 'reinitialiser') {
    saisie = saisieParDefaut();
    ecrireSaisie();
    return recalculer();
  }

  if (!action.startsWith('exporter-')) return;
  if (dernier === null || vue === null) return montrerErreur(textes().messages.rienAExporter);
  const d = dernier;
  if (action === 'exporter-coupe') {
    const trace = coupe(d.calcul, d.resultat, vue, optionsDessin());
    telecharger('fondations-superficielles-coupe.svg', svgAutonome(trace, STYLES_TRACE), 'image/svg+xml;charset=utf-8');
  } else if (action === 'exporter-resultats') {
    const blocs = [blocEntrees(d.calcul), ...blocsResultat(d.resultat)];
    telecharger('fondations-superficielles-resultats.csv', resultatsEnCsv(blocsEnTexte(blocs)), 'text/csv;charset=utf-8');
  } else if (action === 'exporter-note') {
    const note = noteDuCalcul(d.calcul, d.resultat, cartouche());
    ouvrirOuTelecharger('fondations-superficielles-note.html', noteDeCalculHtml(note, STYLES_TRACE));
  }
});

function cartouche(): { projet: string; element: string; date: string } {
  return {
    projet: champProjet.value,
    element: champElement.value,
    date: new Date().toISOString().slice(0, 10),
  };
}

exige<HTMLInputElement>('[data-role="ouvrir"]').addEventListener('change', async (e) => {
  const entree = e.target as HTMLInputElement;
  const f = entree.files?.[0];
  entree.value = '';
  if (f === undefined) return;
  try {
    saisie = relire(await f.text());
  } catch (err) {
    return montrerErreur(messageDErreur(err));
  }
  ecrireSaisie();
  recalculer();
});

const cartoucheMemorise = lireCartouche();
champProjet.value = cartoucheMemorise.projet;
champElement.value = cartoucheMemorise.element;
exige<HTMLElement>('#sorties').addEventListener('input', () => {
  try {
    window.localStorage.setItem(
      CLE_CARTOUCHE,
      JSON.stringify({ projet: champProjet.value, element: champElement.value })
    );
  } catch {
    // Stockage indisponible : la page fonctionne sans.
  }
});

ecrireSaisie();
recalculer();

// Hors navigateur (tests), pas de service worker.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  void import('./pwa').then((m) => m.enregistrerServiceWorker());
}
