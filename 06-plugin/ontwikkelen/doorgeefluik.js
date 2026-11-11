// Doorgeefluik tussen de app op je telefoon en de lokale WordPress (LocalWP).
//
// LocalWP is alleen op je eigen laptop bereikbaar. Dit script luistert op je wifi-netwerk
// en stuurt verzoeken van de app door naar neoradio.local. Alleen de live-score-API
// (/wp-json/neo/v1/...) gaat door; de rest van de WordPress-kopie blijft afgeschermd.
//
// Starten (vanuit de map van de repository):
//   node 06-plugin/ontwikkelen/doorgeefluik.js
//
// Instellen kan met omgevingsvariabelen:
//   POORT    poort van het doorgeefluik      (standaard 8787)
//   WP_HOST  domein van je LocalWP-site      (standaard neoradio.local)

const http = require('http');
const os = require('os');

const POORT = Number(process.env.POORT || 8787);
const WP_HOST = process.env.WP_HOST || 'neoradio.local';
const TOEGESTAAN = '/wp-json/neo/v1/';

const server = http.createServer((verzoek, antwoord) => {
  if (!verzoek.url.startsWith(TOEGESTAAN)) {
    antwoord.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    antwoord.end('Alleen de live-score-API is via het doorgeefluik bereikbaar.');
    log(verzoek, 403);
    return;
  }

  const doorsturen = http.request(
    {
      hostname: WP_HOST,
      port: 80,
      path: verzoek.url,
      method: verzoek.method,
      headers: { ...verzoek.headers, host: WP_HOST },
    },
    (wp) => {
      antwoord.writeHead(wp.statusCode, wp.headers);
      wp.pipe(antwoord);
      log(verzoek, wp.statusCode);
    }
  );

  doorsturen.on('error', (fout) => {
    antwoord.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    antwoord.end(
      JSON.stringify({
        code: 'neo_wordpress_onbereikbaar',
        message: `De lokale WordPress (${WP_HOST}) reageert niet. Staat de site aan in Local?`,
      })
    );
    log(verzoek, 502, fout.message);
  });

  verzoek.pipe(doorsturen);
});

function log(verzoek, status, extra = '') {
  const tijd = new Date().toLocaleTimeString('nl-NL');
  console.log(`${tijd}  ${status}  ${verzoek.method.padEnd(6)} ${verzoek.url} ${extra}`);
}

server.listen(POORT, '0.0.0.0', () => {
  // De adressen van deze laptop op het netwerk, zodat je weet wat de telefoon moet gebruiken.
  const adressen = Object.values(os.networkInterfaces())
    .flat()
    .filter((a) => a && a.family === 'IPv4' && !a.internal)
    .map((a) => a.address);

  console.log(`Doorgeefluik naar ${WP_HOST} staat aan.`);
  console.log('');
  console.log('Bereikbaar op:');
  console.log(`  http://localhost:${POORT}${TOEGESTAAN}livescore   (deze laptop en de webversie)`);
  adressen.forEach((adres) => console.log(`  http://${adres}:${POORT}${TOEGESTAAN}livescore   (telefoon op hetzelfde wifi)`));
  console.log('');
  console.log('De app vindt dit adres vanzelf. Laat dit venster open terwijl je test. Stoppen met Ctrl+C.');
  console.log('');
});
