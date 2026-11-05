/**
 * Les traits du dessin (coupe et plan), repris par le SVG exporte et par la note.
 * Les classes sont celles que `dessin.ts` pose sur ses elements.
 */
export const STYLES_TRACE = `
svg .terrain { fill: #efe6d6; stroke: none; }
svg .sol { stroke: var(--texte-doux); stroke-width: 1.2; }
svg .hachure { stroke: var(--neutre); stroke-width: 1; fill: none; }
svg .semelle { fill: var(--beton); stroke: var(--texte); stroke-width: 1.2; }
svg .nappe { stroke: var(--traction); stroke-width: 1.2; stroke-dasharray: 6 4; fill: none; }
svg .efficace { fill: var(--traction); fill-opacity: 0.12; stroke: var(--traction); stroke-width: 1.2; }
svg .efficace-trame { stroke: var(--traction); stroke-width: 0.8; }
svg .resultante { stroke: var(--traction); stroke-width: 2; }
svg .effort-t { stroke: var(--compression); stroke-width: 2; }
svg .tete-traction { fill: var(--traction); }
svg .tete-compression { fill: var(--compression); }
svg .tete-neutre { fill: var(--neutre); }
svg .tete-cote { stroke: var(--texte-doux); stroke-width: 1.2; fill: none; }
svg .force-traction { fill: var(--traction); font-size: 12px; font-weight: 600; font-family: var(--sans); }
svg .valeur-traction { fill: var(--traction); font-size: 11px; font-family: var(--sans); }
svg .losange { fill: none; stroke: var(--compression); stroke-width: 1.2; stroke-dasharray: 5 3; }
svg .ellipse-service { fill: none; stroke: var(--compression); stroke-width: 1.2; stroke-dasharray: 5 3; }
svg .point-application { fill: #fff; stroke: var(--texte); stroke-width: 2; }
svg .cote { stroke: var(--texte-faible); stroke-width: 0.8; fill: var(--texte-faible); font-size: 11px; font-family: var(--sans); }
svg .etiquette { fill: var(--texte-faible); font-size: 11px; font-family: var(--sans); }
svg .alerte-dessin { fill: var(--compression); font-size: 11px; font-family: var(--sans); }
`;
