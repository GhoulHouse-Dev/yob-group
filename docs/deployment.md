# Vercel-käyttöönotto ja palautus

## Nykyinen julkaisupohja

GitHub-projekti käyttää Next.js:n Node.js-ajoympäristöä. `pnpm build` tekee Next.js-tuotantokäännöksen. Aiemman yksityisen Sites-esikatselun alustaohje on arkistoitu `platform.md`-tiedostoon. `yob.fi`-domainin DNS-asetuksia ei muuteta tätä Vercel-demojulkaisua varten.

## Projekti Verceliin

1. Tuo GitHubista `GhoulHouse-Dev/yob-group` käyttäjän hyväksymään Vercel-työtilaan.
2. Projektin nimi: `yob-group`. Framework: Next.js. Root Directory: repositorion juuri.
3. Node.js-versio: 24.x. `vercel.json` käyttää komentoja `pnpm install --frozen-lockfile` ja `pnpm build`.
4. Jätä lomakkeen lähetys pois päältä. `.env.example` sisältää mahdolliset asetukset; mitään avaimia ei tarvita demon julkaisuun.
5. Julkaise `main`-haaran tarkistettu commit. Vercel määrittää projektille `vercel.app`-osoitteen; lopullinen nimi vahvistetaan julkaisun tuloksesta.
6. Varmista Ready-tila, etusivu, kaikki palvelusivut, yhteydenottopolku, 404 ja esikatselun 503-vastaus. Säilytä noindex demo- ja asiakashyväksyntävaiheessa.

Vercelin alidomain ei vaadi oman domainin ostoa. Työtilan hosting-tilaus ja käyttörajat ovat erillinen asia; tämä toteutus ei muuta tilausta tai hanki maksullista domainia.

GitHub Actions suorittaa TypeScriptin, ESLintin, testit ja Next.js-käännöksen. Vercelin Git-integraatio hoitaa julkaisut, kun repositorio on tuotu ja liitetty projektiin. GitHub Actions ei tarvitse Vercel-avainta tätä mallia varten.

## Lomakkeen aktivointi

| Muuttuja | Tarkoitus |
|---|---|
| `LEAD_INTAKE_ENABLED` | `true` aktivoi lähetyksen vain, jos muut asetukset ovat olemassa |
| `RESEND_API_KEY` | Salainen sähköpostipalvelun avain |
| `LEAD_FROM` | Vahvistettuun lähettäjädomainiin kuuluva osoite |
| `LEAD_RECIPIENT` | Asiakkaan hyväksymä vastaanottaja |

Aseta muuttujat Vercelin projektin Environment Variables -asetuksiin. Salaisuusavaimet eivät kuulu GitHubiin. Paikallisessa Next.js-testissä käytä gitignoreen kuuluvaa `.env.local`-tiedostoa. Vercelin ympäristömuuttujamuutoksen jälkeen tarvitaan uusi julkaisu. Sivuilla näkyvä aktivointitila ja tietosuojateksti on päivitettävä samassa hyväksytyssä muutoksessa.

Ennen aktivointia hyväksy vastaanottaja, käsittelyperuste, tietosuojateksti, säilytysaika ja palveluntarjoajat. Ota käyttöön pysyvä nopeusrajoitus ja bottisuoja julkaisualustalla. Asiakkaan hyväksymällä testivastaanottajalla tarkista yksi onnistunut lähetys, samaa tunnistetta käyttävä uudelleenyritys sekä lähetyspalvelun virhetilanne. Vahvista liitteiden toimitus. Vasta sen jälkeen muuta tuotannon aktivointiasetus.

Lomake rajoittaa liitteet kolmeen tiedostoon ja 3 Mt:n yhteiskokoon. Yksittäisen tiedoston raja on 3 Mt. Palvelin lukee enintään 3,5 Mt:n multipart-rungon; näin myös lomakkeen metatiedoille jää tilaa Vercelin 4,5 MB:n Function-rajan sisällä. Rajat ovat teknisiä, eivät asiakkaan palvelulupauksia. [Vercel Functions -rajat](https://vercel.com/docs/functions/limitations).

Vanha kohdearviolomake välittää pyynnöt sähköpostiin. Uusi tarjouslaskuri tallentaa koko tarjouspyynnön yksityiseen objektitallennukseen ennen sähköpostivälitystä ja edellyttää lisäasetuksia. Liitteet lähetetään erillisessä upload-vaiheessa. Asetukset, kuittaukset ja mittaus: [quote-calculator.md](quote-calculator.md). Tallennus ja säilytys vahvistetaan tietosuojaselosteeseen ennen aktivointia.

## Varsinainen yrityssivusto

Hyväksy ensin `content-handover.md`. Vahvista hosting ja nykyisen sivuston siirtosuunnitelma. Lisää oikean domainin canonical-osoitteet ja sitemap. Poista vasta hyväksytystä varsinaisesta sivustosta `app/layout.tsx`-tiedoston noindex-asetus ja `app/robots.ts`-tiedoston yleinen esto. Säilytä kiitos- ja sisäiset sivut indeksoinnin ulkopuolella.

GitHubin asetuksissa suositeltu `main`-haaran suojaus: pull requestit ja pakollinen `Typecheck, lint, tests and build` -tarkistus, force-pushin ja haaran poiston esto. Vaatimus yhdestä hyväksyvästä katselmoinnista edellyttää toista nimettyä ylläpitäjää. Palvelinasetuksia ei ole asetettu koodimuutoksen mukana.

## Palautus

Palauta Vercelistä viimeinen toimiva Deployment tai julkaise toimivaksi kirjattu commit uudelleen. Älä force-pushaa päähaaraa. Tarvittaessa sulje lomake muuttamalla `LEAD_INTAKE_ENABLED=false` ja julkaisemalla muutos; yhteystietolinkit jäävät käyttöön. Poista vaarantunut avain käytöstä palveluntarjoajalla ja korvaa se Vercelin salaisuutena. Tarkista palautuksen jälkeen etusivu, palvelusivu ja yhteydenotto.

## WebMCP

Tuetussa selaimessa `stage_kohdearviopyynto` voi validoida ja valmistella näkyvän lomakkeen. Työkalu ei lähetä viestiä. Tuki tunnistetaan käyttöhetkellä. Tuetun selainkontekstin toiminnallinen työkalutesti ei ollut saatavilla toteutussessiossa; tavallinen lomake toimii ilman WebMCP:tä.
