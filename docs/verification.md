# Toteutuksen tarkistus

Tarkistettu 2.10.2026 ennen esikatselun julkaisua:

- TypeScriptin tarkistus ja ESLint ilman varoituksia.
- 12 lähetysrajapinnan testiä: aktivointiehto, alkuperä, formaatti, yhteystiedot, liiterajat, idempotenssi sekä palveluntarjoajan onnistumis- ja virhetilat. Palveluntarjoaja korvataan testeissä; sähköposteja ei lähetetä.
- Etusivun työpöytänäkymä sekä 320, 390 ja 768 pikselin kehystetyt näkymät. Tarkistetuissa mobiilinäkymissä dokumentti ei ylittänyt käytettävissä olevaa leveyttä.
- Mobiilivalikon avaus, Escape-sulku ja navigointi näppäimistöllä.
- Pakollisten lomakekenttien virheet, yhteenvedon kohdistus ja tietojen säilyminen esikatselun 503-vastauksen jälkeen.
- Injektointisivun yhteydenottopainike esivalitsee palvelun yhteystietosivulla.

Rajaukset: tämä ei ole koko WCAG-kriteeristön sertifioiva auditointi. Oikean sähköpostipalvelun toimitusta ei testattu, koska asiakas ei ole vielä hyväksynyt vastaanottajaa ja lähetysasetuksia. WebMCP:n toiminnallinen työkalutesti ei ollut käytettävissä selaimessa. Erillistä HTTP-smoke-skriptiä ei voitu ajaa tässä ympäristössä esikatselun verkkorajauksen vuoksi; sen voi ajaa omassa paikallisessa ympäristössä asettamalla `YOB_SMOKE_ORIGIN` käynnissä olevan testipalvelimen osoitteeksi.

Tuotantokäännöksen ja GitHub Actions -ajon tulos tarkistetaan erikseen kyseistä commitia varten. Älä tulkitse tätä dokumenttia uuden commitin tai julkisen tuotannon hyväksynnäksi.

## Vercel-siirto 2.10.2026

Projektin oletuskäännös vaihdettiin Next.js:ään. Ympäristömuuttujat luetaan Node.js:n `process.env`-rajapinnasta. Lomakkeen tiedosto- ja yhteiskokoraja on 3 Mt, ja rungon palvelinraja 3,5 Mt. Yhteiskokorajan hylkäykselle lisättiin rajapintatesti.

TypeScript, ESLint, 13 rajapintatestiä ja Next.js:n tuotantokäännös läpäisivät tarkistukset. Paikallisella Next.js-tuotantopalvelimella tarkistettiin 13 sivua, kuusi staattista tiedostoa, 404-vastaus ja suljetun lomakkeen 503-vastaus. Vercelin käyttöönoton onnistuminen on tarkistettava julkaisualustalta erikseen.
