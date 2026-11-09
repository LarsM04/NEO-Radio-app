import { kleuren } from '../constants/kleuren';

// Kleuren: eerst die van jullie kleuren.js, anders de huisstijlkleur uit het onderzoek.
export const K = {
  groen: kleuren.groen ?? '#81BB19',
  donkergroen: kleuren.donkergroen ?? '#355F13',
  zwart: kleuren.zwart ?? '#171614',
  wit: kleuren.wit ?? '#FFFFFF',
  licht: '#F3F6EE',
  rand: '#E3EAD8',
  grijs: '#575760',
};

export const RUBRIEKEN = ['Alles', 'Voetbalnieuws', 'Overig sportnieuws', 'Algemeen nieuws', "Theo's Mening"];

const ontcijfer = (s = '') =>
  String(s)
    .replace(/&#8217;|&rsquo;/g, '’').replace(/&#8211;|&ndash;/g, '–').replace(/&#8230;/g, '…')
    .replace(/&#038;|&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"');

const tekst = (v) => (typeof v === 'string' ? v : v?.rendered ?? '');

// Maakt van een WordPress-bericht (of jullie eigen object) altijd hetzelfde object.
export function naarBericht(p) {
  const html = tekst(p.content ?? p.tekst ?? p.inhoud ?? '');
  return {
    id: String(p.id),
    titel: ontcijfer(tekst(p.title ?? p.titel)),
    rubriek: p._embedded?.['wp:term']?.[0]?.[0]?.name ?? p.rubriek ?? p.categorie ?? 'Algemeen nieuws',
    datum: p.date ?? p.datum,
    auteur: p._embedded?.author?.[0]?.name ?? p.auteur ?? 'Studio NEO',
    afbeelding: p._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? p.afbeelding ?? p.foto ?? p.image ?? null,
    alineas: htmlNaarAlineas(html),
  };
}

export function htmlNaarAlineas(html = '') {
  return html
    .split(/<\/p>|<br\s*\/?>\s*<br\s*\/?>/i)
    .map((a) => ontcijfer(a.replace(/<[^>]+>/g, '')).trim())
    .filter(Boolean);
}

export const maakDatum = (iso) =>
  iso ? new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : '';