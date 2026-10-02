# Käyttöönotto ja palautus

## Nykyinen esikatselu

Toteutus on Cloudflare Workers -yhteensopiva Sites-projekti. Julkaisu rakennetaan lukituista riippuvuuksista ja tallennetaan yksityiseksi versioksi. Nykyisen `yob.fi`-domainin DNS-asetuksia ei muuteta tässä toteutuksessa.

1. Valitse hyväksytty Git-commit ja varmista, että CI läpäisee.
2. Aja `pnpm install --frozen-lockfile` ja neljä README:n tarkistusta.
3. Rakenna alustan julkaisutyönkululla Worker-paketti. Rakennettu palvelinkonfiguraatio löytyy `dist/server/wrangler.json`-tiedostosta.
4. Julkaise ensin yksityiseen esikatseluun. Tarkista jokainen sivu, palvelukohtainen yhteydenottopolku, 404 sekä lomakkeen virhetilat.
5. Kirjaa käyttöön otettu commit, julkaisuversion tunniste, tarkistuspäivä ja vastuuhenkilö.

Alustan yksityiskohtaiset kehitysohjeet ovat [platform.md](platform.md)-tiedostossa. GitHub Actions on tarkistusputki; automaattinen julkaisu ja sen tunnukset eivät ole vielä kytkettyjä.

## Lomakkeen aktivointi

| Muuttuja | Tarkoitus |
|---|---|
| `LEAD_INTAKE_ENABLED` | `true` aktivoi lähetyksen vain, jos muut asetukset ovat olemassa |
| `RESEND_API_KEY` | Salainen sähköpostipalvelun avain |
| `LEAD_FROM` | Vahvistettuun lähettäjädomainiin kuuluva osoite |
| `LEAD_RECIPIENT` | Asiakkaan hyväksymä vastaanottaja |

Aseta muuttujat Worker-julkaisualustan asetuksiin, ei repositorioon. Paikallisessa Worker-testissä käytä gitignoreen kuuluvaa `.dev.vars`-tiedostoa; muut paikalliset ympäristöt käyttävät alustan määrittelemää `.env`-käytäntöä. `.env.example` on pelkkä mallipohja.

Ennen aktivointia hyväksy vastaanottaja, käsittelyperuste, tietosuojateksti, säilytysaika ja palveluntarjoajat. Ota käyttöön pysyvä nopeusrajoitus ja bottisuoja julkaisualustalla. Asiakkaan hyväksymällä testivastaanottajalla tarkista yksi onnistunut lähetys, samaa tunnistetta käyttävä uudelleenyritys sekä lähetyspalvelun virhetilanne. Vahvista liitteiden toimitus. Vasta sen jälkeen muuta tuotannon aktivointiasetus.

Lomake rajoittaa liitteet kolmeen tiedostoon, 5 Mt tiedostoa kohden ja 8 Mt yhteensä. Nämä ovat toteutuksen teknisiä rajoja; asiakkaan toimintatavan hyväksyntä puuttuu. Palvelu ei tallenna pyyntöjä omaan tietokantaan. Viestien säilytys tapahtuu vastaanottajan sähköpostissa ja palveluntarjoajan ehdoilla, jotka tulee vahvistaa tietosuojaselosteeseen.

## Julkisen sivuston julkaisu

Hyväksy ensin [content-handover.md](content-handover.md). Vahvista hosting ja nykyisen sivuston siirtosuunnitelma. Lisää oikean domainin canonical-osoitteet, sitemap ja sosiaalisen jakamisen kuva. Poista vasta hyväksytystä julkisesta versiosta `app/layout.tsx`-tiedoston noindex-asetus ja `app/robots.ts`-tiedoston yleinen esto. Säilytä kiitos- ja sisäiset sivut indeksoinnin ulkopuolella.

GitHubin asetuksissa suositeltu `main`-haaran suojaus: pull requestit ja pakollinen `Typecheck, lint, tests and build` -tarkistus, force-pushin ja haaran poiston esto. Vaatimus vähintään yhdestä hyväksyvästä katselmoinnista edellyttää toista nimettyä ylläpitäjää. Näitä repositorion palvelinasetuksia ei ole asetettu tämän koodimuutoksen mukana.

## Palautus

Julkaise viimeinen toimivaksi kirjattu versio / commit uudelleen julkaisualustalla. Älä force-pushaa päähaaraa. Tarvittaessa sulje lomake heti muuttamalla `LEAD_INTAKE_ENABLED=false`; yhteystietolinkit jäävät käyttöön. Poista vaarantunut avain käytöstä palveluntarjoajalla ja korvaa se julkaisualustan salaisuutena. Tarkista palautuksen jälkeen etusivu, palvelusivu ja yhteydenotto.

## WebMCP

Tuetussa selaimessa `stage_kohdearviopyynto` voi validoida ja valmistella näkyvän lomakkeen. Työkalu ei lähetä viestiä. WebMCP on ehdotettu standardi ja tuki tunnistetaan käyttöhetkellä. Tuetun selainkontekstin toiminnallinen työkalutesti ei ollut saatavilla tässä toteutussessiossa; tavallinen lomake toimii ilman WebMCP:tä.
