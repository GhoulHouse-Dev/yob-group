# YOB Group Oy — verkkosivusto

Suomenkielinen, responsiivinen verkkosivusto rakenteiden korjaus-, tiivistys- ja vahvistamispalveluille. Toteutus sisältää etusivun, palveluhakemiston, seitsemän palvelusivua, yrityssivun, yhteystiedot ja tietosuojasivun.

**Tila:** Vercel-julkaisua varten valmisteltu esikatselu. Varsinaisen yrityssivuston sisältöhyväksynnät ja lomakkeen lähetysasetukset ovat vielä avoinna. Hakukoneindeksointi on tarkoituksella estetty. Tietosuojateksti on luonnos, ei valmis rekisteriseloste.

## Teknologia

- React 19, TypeScript ja Next.js App Router -rajapinnat
- Next.js:n Node.js-ajoympäristö sekä Vercel-julkaisu
- Paikallinen Inter-fontti ja pakatut WebP-kuvat
- Zod-validointi selaimessa ja palvelimella
- Resend-lähetysrajapinta, joka aktivoidaan vain asetuksilla

Oletuskomennot käyttävät Next.js:ää ja sopivat suoraan Verceliin. Aiemman yksityisen Sites-esikatselun Vinext-käännös on säilytetty erillisillä `dev:sites`-, `build:sites`- ja `start:sites`-komennoilla. Vercel-julkaisu ei käytä beta-ajoympäristöä.

## Käynnistys

Node.js 24 on CI:ssä käytetty versio. Pakettienhallinta: `pnpm@11.25.0` (`packageManager`-kenttä).

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Käytä kehityspalvelimen tulostamaa paikallista osoitetta. `vercel.json` määrittää Next.js-käännöksen ja lukitun asennuksen. `.openai/hosting.json` kuuluu aiempaan yksityiseen esikatseluun; Vercel ei käytä sitä.

## Tarkistukset

```sh
pnpm typecheck
pnpm lint --max-warnings 0
pnpm test
pnpm build
```

GitHub Actions suorittaa samat neljä vaihetta pull requesteissa ja `main`-haaran muutoksissa. CI:llä on vain lähdekoodin lukuoikeus eikä se julkaise tuotantoon. Lomakkeen testit käyttävät korvattua palveluntarjoajaa; oikeita sähköposteja ei lähetetä.

## Rakenne

| Hakemisto | Sisältö |
|---|---|
| `app/` | Sivut, metatiedot, robots ja lähetysrajapinta |
| `components/` | Navigaatio, palvelunäkymät ja lomake |
| `lib/site.ts` | Palvelu- ja yhteyshenkilösisällöt |
| `lib/inquiry.ts` | Yhteinen validointi ja liiterajat |
| `lib/inquiry-server.ts` | Rajoitettu lähetys ja sähköpostipalvelun kuittaus |
| `public/` | Logo, havainnekuvat, favicon ja fontti lisensseineen |
| `tests/` | Lähetysrajapinnan onnistumis- ja virhetilat |
| `docs/` | Käyttöönotto, sisältöpuutteet ja alustan tekniset ohjeet |

## Lomake ja tietosuoja

Lähetys on oletuksena pois päältä. Lomake näyttää esikatselutilan, ja rajapinta palauttaa `503`, ellei kaikkia lähetysasetuksia ole määritetty. Puhelin- ja sähköpostilinkit toimivat ilman lähetysintegraatiota.

Muuttujat ovat `.env.example`-tiedostossa. Resend edellyttää vahvistettua lähettäjädomainia. Vahvista vastaanottaja ja henkilötietojen käsittely ennen avaimen asentamista. Älä koskaan lisää avaimia GitHubiin. Liiteraja on 3 Mt yhteensä, jotta pyyntö mahtuu Vercelin Function-rajapinnan kokorajaan. Aktivointiohje: [docs/deployment.md](docs/deployment.md).

## Sisältö ja kuvat

Yritystiedot perustuvat YOB:n nykyiseen verkkosivustoon. Palvelukuvat on merkitty havainnekuviksi. Ne eivät todista toteutettuja asiakaskohteita. Kuvien käyttöoikeudet ja yritystiedot on vahvistettava asiakkaalta ennen julkista käyttöönottoa. Inter-fontin OFL-lisenssi on `public/fonts/OFL.txt`-tiedostossa. Muista riippuvuuksista säilytetään alkuperäiset lisenssit.

Avoimet hyväksynnät: [docs/content-handover.md](docs/content-handover.md). Kehitysohje: [CONTRIBUTING.md](CONTRIBUTING.md). Tietoturvailmoitukset: [SECURITY.md](SECURITY.md).

Koodin ja yritysmateriaalien käyttöoikeus sekä mahdollinen avoimen lähdekoodin lisenssi: [puuttuu: selvitä asiakkaalta]. Julkinen repositorio ei itsessään myönnä käyttöoikeutta YOB:n brändimateriaaleihin.
