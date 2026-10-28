// Alle verzoeken naar de WordPress-website van NEO Radio staan in dit bestand.
// Zie het technisch ontwerp (04-ontwerp/technisch-ontwerp) voor de endpoints.

const BASIS_URL = 'https://www.neoradio.nl/wp-json';

async function haalOp(pad) {
  const antwoord = await fetch(BASIS_URL + pad);
  if (!antwoord.ok) {
    throw new Error(`Ophalen mislukt (${antwoord.status}): ${pad}`);
  }
  return antwoord.json();
}

// Nieuws
export function haalNieuwsOp(categorieId) {
  const filter = categorieId ? `&categories=${categorieId}` : '';
  return haalOp(`/wp/v2/posts?_embed&per_page=20${filter}`);
}

export function haalBerichtOp(id) {
  return haalOp(`/wp/v2/posts/${id}?_embed`);
}

export function haalCategorieenOp() {
  return haalOp('/wp/v2/categories?per_page=100');
}

// Info
export function haalPaginasOp() {
  return haalOp('/wp/v2/pages?per_page=100');
}

// Live score (eigen plugin, bestaat nog niet op de echte website)
export function haalKlassenOp() {
  return haalOp('/neo/v1/klassen');
}

export function haalLivescoreOp() {
  return haalOp('/neo/v1/livescore');
}

export function haalUitslagenOp(klasseId) {
  return haalOp(`/neo/v1/uitslagen?klasse=${klasseId}`);
}
