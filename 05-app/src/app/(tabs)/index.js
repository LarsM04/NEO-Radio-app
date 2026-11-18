// Het Home-scherm, zoals in het ontwerpdocument (04-ontwerp/designs, pagina 3).
// Van boven naar beneden:
// 1. De radio-kaart (zwart) met de grote rode afspeelknop
// 2. De Live kijken-kaart met een foto
// 3. Uitslagen (de laatste voetbaluitslagen)
// 4. Laatste nieuws (echte berichten van neoradio.nl)

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { haalLivescoreOp, haalNieuwsOp } from '../../api/wordpress';
import { kleuren } from '../../constants/kleuren';

// Een paar extra kleuren uit het ontwerp die nog niet in kleuren.js staan.
const donkergroen = '#355f13'; // voor groene tekst op een lichte achtergrond
const lichtgroen = '#f3f6ee'; // achtergrond van de uitslag-kaartjes
const randGroen = '#e3ead8'; // dunne randjes

// Hoeveel uitslagen we op Home laten zien. De rest staat op het Score-scherm.
const AANTAL_UITSLAGEN = 3;

// De tekst rechtsboven in een uitslag-kaartje, bijvoorbeeld "Afgelopen" of "Live 67'".
function statusTekst(wedstrijd) {
  if (wedstrijd.status === 'afgelopen') return 'Afgelopen';
  if (wedstrijd.status === 'rust') return 'Rust';
  if (wedstrijd.status === 'bezig') return wedstrijd.minuut_tekst ? `Live ${wedstrijd.minuut_tekst}'` : 'Live';
  return `Aftrap ${wedstrijd.aftrap.slice(11, 16)}`; // "2026-10-10T14:30:00" -> "14:30"
}

// Het logo van een club. Heeft de club (nog) geen logo, dan een leeg wit rondje.
function Logo({ club }) {
  if (club.logo) {
    return <Image source={{ uri: club.logo }} style={styles.logoRondje} resizeMode="contain" />;
  }
  return <View style={styles.logoRondje} />;
}

// WordPress stuurt sommige tekens als code, zoals &#8211; voor een streepje.
// Deze functie maakt daar weer gewone tekens van.
function maakTekstSchoon(tekst) {
  return tekst
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, ''); // haalt HTML-codes zoals <p> weg
}

// Maakt van een datum als "2026-10-05T10:00:00" een mooie datum: "5 oktober 2026".
function mooieDatum(datum) {
  return new Date(datum).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function HomeScherm() {
  // "state" = het geheugen van het scherm. Verandert het, dan tekent het scherm zichzelf opnieuw.
  const [nieuws, setNieuws] = useState([]); // de nieuwsberichten (eerst een leeg lijstje)
  const [laden, setLaden] = useState(true); // true zolang we nog aan het ophalen zijn
  const [uitslagen, setUitslagen] = useState(null); // de wedstrijden van de laatste speelronde (null = nog aan het laden)

  // useEffect draait één keer als het scherm opent: dan halen we het nieuws op.
  useEffect(() => {
    haalNieuwsOp()
      .then((berichten) => setNieuws(berichten.slice(0, 3))) // alleen de 3 nieuwste
      .catch(() => setNieuws([])) // lukt het niet (geen internet)? Dan een leeg lijstje
      .finally(() => setLaden(false)); // klaar met laden
  }, []);

  // De uitslagen halen we op elke keer dat je naar Home gaat, zodat de stand klopt.
  // Ze komen uit de live-score-plugin, net als op het Score-scherm.
  useFocusEffect(
    useCallback(() => {
      haalLivescoreOp()
        .then((data) => {
          // De plugin geeft de wedstrijden per klasse. Wij maken er één lijstje van,
          // en onthouden bij elke wedstrijd de korte naam van de klasse ("2e klasse").
          const wedstrijden = data.klassen.flatMap((klasse) =>
            klasse.wedstrijden.map((wedstrijd) => ({ ...wedstrijd, klasse: klasse.korte_naam }))
          );
          setUitslagen(wedstrijden.slice(0, AANTAL_UITSLAGEN));
        })
        .catch(() => setUitslagen([])); // geen verbinding? Dan geen uitslagen
    }, [])
  );

  return (
    // ScrollView = een scherm waar je doorheen kunt scrollen (naar beneden vegen).
    <ScrollView style={styles.scherm} contentContainerStyle={styles.inhoud}>
      {/* ---------- 1. DE RADIO-KAART ---------- */}
      {/* Link + asChild: de hele kaart wordt een knop naar het scherm Live luisteren. */}
      <Link href="/live/luisteren" asChild>
        <Pressable style={styles.radioKaart}>
          {/* Bovenste regel: het rode LIVE-labeltje en "Nu op NEO Radio" */}
          <View style={styles.rij}>
            <View style={styles.liveLabel}>
              <View style={styles.witStipje} />
              <Text style={styles.liveTekst}>LIVE</Text>
            </View>
            <Text style={styles.nuOp}>Nu op NEO Radio</Text>
          </View>

          {/* Naam van het programma. Nu nog vast; later komt dit uit WordPress. */}
          <Text style={styles.programma}>Nathans Nummers</Text>
          <Text style={styles.radioUitleg}>Luister live mee, waar je ook bent</Text>

          {/* De grote afspeelknop met de groene ring uit het logo */}
          <View style={[styles.rij, { marginTop: 20 }]}>
            <View style={styles.groeneRing}>
              <View style={styles.rodeKnop}>
                <MaterialCommunityIcons name="play" size={44} color={kleuren.wit} />
              </View>
            </View>
            <View style={{ marginLeft: 20 }}>
              <Text style={styles.tikTekst}>Tik om te luisteren</Text>
              <Text style={styles.openSpeler}>Open de speler ›</Text>
            </View>
          </View>
        </Pressable>
      </Link>

      {/* ---------- 2. DE LIVE KIJKEN-KAART ---------- */}
      <Link href="/live/kijken" asChild>
        <Pressable style={styles.witteKaart}>
          {/* De foto, met een witte afspeelknop in het midden */}
          <View>
            <Image source={require('../../../assets/live-kijken.jpg')} style={styles.foto} />
            <View style={styles.witteRondje}>
              <MaterialCommunityIcons name="play" size={32} color={kleuren.zwart} />
            </View>
          </View>

          {/* Onder de foto: icoon, titel, uitleg en een pijltje */}
          <View style={[styles.rij, { padding: 16 }]}>
            <MaterialCommunityIcons name="television-play" size={28} color={donkergroen} />
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={styles.kaartTitel}>Live kijken</Text>
              <Text style={styles.kaartUitleg}>Livestream, samenvattingen en interviews</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={28} color={donkergroen} />
          </View>
        </Pressable>
      </Link>

      {/* ---------- 3. UITSLAGEN ---------- */}
      <View style={styles.kopRij}>
        <Text style={styles.kop}>Uitslagen</Text>
        <Link href="/livescore" style={styles.alles}>
          Alles ›
        </Link>
      </View>
      <Text style={styles.onderKop}>Laatste speelronde</Text>

      {/* Nog aan het laden? Dan een draaiend rondje. Geen wedstrijden? Dan een zinnetje. */}
      {uitslagen === null ? <ActivityIndicator color={kleuren.groen} style={{ marginTop: 16 }} /> : null}
      {uitslagen?.length === 0 ? <Text style={styles.status}>Nog geen uitslagen.</Text> : null}

      {/* .map() is een "loop": hij doet hetzelfde voor elk ding in het lijstje.
          Hier maakt hij voor elke uitslag één kaartje. Tik je erop, dan ga je naar het Score-scherm. */}
      {uitslagen?.map((wedstrijd) => {
        const gepland = wedstrijd.status === 'gepland'; // nog niet begonnen: nog geen goals
        const live = wedstrijd.status === 'bezig';

        return (
          <Link key={wedstrijd.id} href="/livescore" asChild>
            <Pressable style={styles.uitslag}>
              <View style={styles.kopRij}>
                <Text style={styles.klasse}>{wedstrijd.klasse}</Text>
                <Text style={[styles.status, live && styles.liveStatus]}>{statusTekst(wedstrijd)}</Text>
              </View>
              {/* Thuisploeg: het clublogo, de naam en de goals */}
              <View style={styles.teamRij}>
                <Logo club={wedstrijd.thuis} />
                <Text style={styles.team}>{wedstrijd.thuis.naam}</Text>
                <Text style={styles.goals}>{gepland ? '-' : wedstrijd.score.thuis}</Text>
              </View>
              {/* Uitploeg: precies hetzelfde */}
              <View style={styles.teamRij}>
                <Logo club={wedstrijd.uit} />
                <Text style={styles.team}>{wedstrijd.uit.naam}</Text>
                <Text style={styles.goals}>{gepland ? '-' : wedstrijd.score.uit}</Text>
              </View>
            </Pressable>
          </Link>
        );
      })}

      {/* ---------- 4. LAATSTE NIEUWS ---------- */}
      <View style={styles.kopRij}>
        <Text style={styles.kop}>Laatste nieuws</Text>
        <Link href="/nieuws" style={styles.alles}>
          Alles ›
        </Link>
      </View>

      {/* Zijn we nog aan het laden? Dan een draaiend rondje. */}
      {laden ? <ActivityIndicator color={kleuren.groen} style={{ marginTop: 16 }} /> : null}

      {nieuws.map((bericht) => {
        // De foto van het bericht zit diep verstopt in de data van WordPress.
        // Het ?. betekent: "als het er is". Zo crasht de app niet als er geen foto is.
        const fotoUrl = bericht._embedded?.['wp:featuredmedia']?.[0]?.source_url;

        return (
          <Link key={bericht.id} href={`/nieuws/${bericht.id}`} asChild>
            <Pressable style={styles.witteKaart}>
              {fotoUrl ? <Image source={{ uri: fotoUrl }} style={styles.foto} /> : null}
              <View style={{ padding: 16 }}>
                <Text style={styles.kaartTitel}>{maakTekstSchoon(bericht.title.rendered)}</Text>
                <Text style={styles.datum}>{mooieDatum(bericht.date)}</Text>
              </View>
            </Pressable>
          </Link>
        );
      })}
    </ScrollView>
  );
}

// Alle stijlen (kleuren, maten, afstanden) bij elkaar, net als CSS op een website.
const styles = StyleSheet.create({
  // Het hele scherm
  scherm: { flex: 1, backgroundColor: kleuren.wit },
  inhoud: { padding: 16, paddingBottom: 32 },
  // Zet dingen naast elkaar (in een rij) in plaats van onder elkaar
  rij: { flexDirection: 'row', alignItems: 'center' },

  // 1. Radio-kaart
  radioKaart: {
    backgroundColor: kleuren.zwart,
    borderRadius: 24, // ronde hoeken
    padding: 20,
  },
  liveLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: kleuren.liveRood,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  witStipje: { width: 8, height: 8, borderRadius: 4, backgroundColor: kleuren.wit, marginRight: 6 },
  liveTekst: { color: kleuren.wit, fontWeight: 'bold', fontSize: 14 },
  nuOp: { color: kleuren.wit, fontSize: 17, marginLeft: 10 },
  programma: { color: kleuren.wit, fontSize: 30, fontWeight: '800', marginTop: 14 },
  radioUitleg: { color: '#d6d6d6', fontSize: 17, marginTop: 4 },
  groeneRing: {
    width: 104,
    height: 104,
    borderRadius: 52, // de helft van de breedte = een rondje
    borderWidth: 6,
    borderColor: kleuren.groen,
    borderRightColor: 'transparent', // rechts een stukje open, net als de "C" in het logo
    alignItems: 'center',
    justifyContent: 'center',
  },
  rodeKnop: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: kleuren.rood,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tikTekst: { color: kleuren.wit, fontSize: 19, fontWeight: 'bold' },
  openSpeler: { color: kleuren.groen, fontSize: 17, fontWeight: 'bold', marginTop: 8 },

  // 2. Witte kaart (Live kijken en nieuws)
  witteKaart: {
    backgroundColor: kleuren.wit,
    borderRadius: 24,
    marginTop: 16,
    overflow: 'hidden', // knipt de foto af in de ronde hoeken
    borderWidth: 1,
    borderColor: randGroen,
  },
  foto: { width: '100%', height: 200 }, // hele breedte van de kaart, 200 hoog
  witteRondje: {
    position: 'absolute', // bovenop de foto
    top: '50%',
    left: '50%',
    width: 64,
    height: 64,
    marginTop: -32, // de helft omhoog, zodat hij precies in het midden staat
    marginLeft: -32,
    borderRadius: 32,
    backgroundColor: kleuren.wit,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kaartTitel: { fontSize: 20, fontWeight: '800', color: kleuren.zwart },
  kaartUitleg: { fontSize: 17, color: kleuren.grijs, marginTop: 2 },
  datum: { fontSize: 15, color: kleuren.grijs, marginTop: 6 },

  // 3. Uitslagen en de koppen
  kopRij: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kop: { fontSize: 28, fontWeight: '800', color: kleuren.zwart, marginTop: 28 },
  alles: { fontSize: 17, fontWeight: 'bold', color: donkergroen, marginTop: 28, padding: 8 },
  onderKop: { fontSize: 15, color: kleuren.grijs, marginBottom: 4 },
  uitslag: {
    backgroundColor: lichtgroen,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: randGroen,
    padding: 14,
    marginTop: 12,
  },
  klasse: { fontSize: 14, fontWeight: 'bold', color: kleuren.zwart },
  status: { fontSize: 14, color: kleuren.grijs },
  liveStatus: { color: kleuren.liveRood, fontWeight: 'bold' }, // rood als de wedstrijd bezig is
  teamRij: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  logoRondje: { width: 28, height: 28, borderRadius: 14, backgroundColor: kleuren.wit },
  team: { flex: 1, fontSize: 17, color: kleuren.zwart, marginLeft: 10 },
  goals: { fontSize: 20, fontWeight: 'bold', color: kleuren.zwart },
});
