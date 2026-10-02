# Tarjouspyyntölaskuri — palvelimen arvio ja erilliset liitteet

## Käyttäjäpolku

Etusivulla ja `/tarjouspyynto`-sivulla on sama viisivaiheinen komponentti:
1. Palvelu (pakollinen; myös En tiedä menetelmää).
2. Paikkakunta, asiakastyyppi ja palvelukohtaiset kohdetiedot.
3. Palvelun tarvitsemat mitat/laajuus. En tiedä on sallittu erikseen.
4. Kuvaus, ajankohta ja vapaaehtoiset kuvat/suunnitelmat.
5. Palvelimen arvio ja yhteenveto ensin. `Pyydä tarkka tarjous` avaa yhteystiedot.

Palvelun vaihtaminen tyhjentää vanhan palvelun lähtötiedot. Timanttiporauksella
ja sahauksella on omat mittakentät. Edellisiin vaiheisiin palaaminen mitätöi
näytetyn arvion; seuraava eteneminen hakee uuden tuloksen.

## Arviointirajapinta

`POST /api/quote-estimate` saa vain yhteisen strict/discriminated union -scheman
mukaiset palvelu-, kohde- ja mittatiedot. Yhteystietoja, liitteitä ja hintoja
ei hyväksytä. Runko on rajattu 16 KiB:iin, Origin tarkistetaan, välimuisti on pois.

`lib/quote/pricing.ts` on server-only-hinnoittelun lähde. YOB:n hinnastoa ei ole
vahvistettu, joten kaikki nykyiset palvelut palauttavat `manual_quote`-tuloksen:
`pricing_unavailable`, tai tuntematon menetelmä `unsupported_scope`. Ei arvauksia
eikä fallback-hintoja. `estimated`-vastauksen käyttöliittymä ja vastausschema
on tehty valmiiksi; niiden lisääminen tuotantohinnoitteluun vaatii hyväksytyt
hintasäännöt, soveltamisrajat, ALV-käsittelyn ja version.

Arvio palauttaa lisäksi palvelimen HMAC-allekirjoittaman `estimateToken`-arvon,
kun palvelimen salaisuus on asetettu. Tunniste sitoo tuloksen validoituihin
lähtötietoihin ja on voimassa kaksi tuntia. `/api/inquiries` tarkistaa
allekirjoituksen ja vastaavuuden; se ei laske hintaa eikä hyväksy clientin
lähettämää hinta-arviota. Esikatselu toimii ilman salaisuutta ja näyttää vain
manuaalisen tarjouspolun; lähetys ei tällöin aktivoidu.

## Erillinen upload

Kuvavaiheessa eteneminen lähettää liitteet ensin `POST /api/quote-uploads`-
rajapintaan. Final inquiry on pienikokoinen JSON ja sisältää vain `{id}`-viitteet.
Palvelin tarkistaa tyypin, tiedoston alkuotsakkeen, määrän (3) ja yhteiskoon
(3 MiB). Sallittu: JPG, PNG, WebP, PDF. Tämä ei ole virustarkistuspalvelu.

Tiedostot ovat yksityisen S3-yhteensopivan tallennuksen JSON-objekteissa.
Selaimelle ei anneta julkisia URL-osoitteita, bucket-avaimia tai tunnuksia.
Upload-istunto on allekirjoitettu HttpOnly/SameSite=Strict-eväste (HTTPS:llä Secure).
Liiteviitteet tarkistetaan tätä istuntoa vasten. Muiden istuntojen tunnisteet,
URL:t, puuttuvat ja vanhentuneet liitteet sekä liian suuri kokonaisuus hylätään.

Väliaikaiset liitteet ovat voimassa kaksi tuntia. Määritä bucketille
`quote-uploads/`-prefiksin automaattinen poistokäytäntö (esimerkiksi vuorokauden
päästä); koodi ei itse ajasta poistoa. Tätä prefiksiä ei käytetä pysyvien liidien
liitteiden ainoana kopiona: validoitu liidi sisältää omat kestävät liitekopiot.

## Lopullinen tallennus ja lähetys

`POST /api/inquiries` JSON-polku tarkistaa contact-, quote- ja attachment-
schemat sekä arviointitunnisteen. Tallennus tehdään yksityiseen
`quote-leads/`-objektiin ennen sähköpostivälitystä. Liidi sisältää yhteystiedot,
kohdetiedot, palvelimen vahvistaman arvion, liitekopiot ja välitystilan.

Idempotency-Key muodostaa liidin avaimen. Samaa avainta ja sisältöä käyttävä
on onnistuneen lähetyksen jälkeen uusintakuittaus; muuttunut sisältö hylätään
409-vastauksella. Ensiluonti käyttää ehdollista S3 PUT -pyyntöä. Providerin
uudelleenyritys käyttää aina samaa sähköpostin idempotenssiavainta.

Tallennusvirhe ei lähetä sähköpostia. Providerin virhe jättää liidin talteen
uudelleenyritystä varten ja palauttaa virheen. Vahvistettu tallennus ja
sähköpostipalvelun kuittaus tuottavat onnistumisen. `/kiitos` näyttää vastaanoton
vain allekirjoitetulla, 10 minuutin kuittausevästeellä; suora avaus ei väitä
pyynnön saapuneen. Upload- ja kuittausevästeillä on eri allekirjoituskontekstit.

Vanha multipart-kohdearviolomake säilyy yhteensopivana ja käyttää edelleen
aiempaa sähköpostipolkua. Sen liitteitä ei siirretä tämän laskuripäivityksen mukana.

## Asetukset ja aktivointi

`.env.example` sisältää tallennuksen palvelinasetukset. Adapteri ei luo
palveluntarjoajan tiliä, bucketia tai maksullista palvelua. Tallennuspalvelu,
käsittelyalue, pääsynhallinta, säilytysaika ja kustannukset:
[puuttuu: selvitä asiakkaalta].

Laskurin lähetys aktivoituu vain, jos nykyiset Resend/lähetysasetukset sekä
kaikki `QUOTE_S3_*`-pakolliset asetukset ja vähintään 32-merkkinen satunnainen
`QUOTE_SESSION_SECRET` ovat olemassa. Käytä HTTPS-endpointia ilman path/query-
osaa, yksityistä bucketia ja prefikseihin rajattuja luku-/kirjoitusoikeuksia.
Julkaise alustan pysyvä nopeusrajoitus ja bottisuoja ennen aktivointia.

Esikatselussa kuvat ja yhteystiedot eivät lähde palvelimelle. Vain palvelun
lähtötiedot käsitellään arviointirajapinnassa ilman tallennusta. Tiedot eivät
mene selaimen pysyvään tallennustilaan. Älä aktivoi tuotantolähetystä ennen
tietosuojatekstin, vastaanottajan ja käsittelyehtojen hyväksyntää.

## Mittaus

Komponentti lähettää paikallisen `yob:quote` CustomEvent -tapahtuman. Kun
`QUOTE_ANALYTICS_ENABLED=true` ja tallennus on asetettu, sama metadata
lähetetään `/api/quote-events`-rajapintaan ja tallennetaan `quote-events/`-
prefiksiin. Ulkopuolista analytiikkapalvelua tai käyttäjätunnistetta ei lisätty.
Tapahtumat eivät sisällä yhteystietoja, vastauksia, kuvanimiä tai hintoja.
Strict schema hylkää ylimääräiset kentät. Esikatselutapahtumia ei tallenneta.

- `quote_started`: ensimmäinen palveluvalinta.
- `quote_step_completed`: validoitu eteneminen (vaihe 5 vasta vastaanoton jälkeen).
- `quote_estimate_generated`: palvelimen hyväksymä euromääräinen arvio.
- `quote_manual_required`: palvelimen manuaalinen tarjouspolku.
- `quote_contact_started`: yhteystietojen avaaminen arvion jälkeen.
- `quote_submitted`: palvelimen vahvistama tallennus ja sähköpostivälitys.

Jokainen tapahtuma/vaihe kirjataan kerran komponentin elinkaaren aikana.
Uudelleenlataus aloittaa uuden laskurikäyttökerran. Mittarit ovat tapahtumien
suhteita, eivät yksilöllisten henkilöiden lukuja. Arvioon pääsy =
(estimated + manual) / started; tarjouspyyntö = submitted / (estimated + manual).
Hyväksy mittaus ja määritä myös event-objektien säilytys ennen aktivointia.

## Tarkistus 2.10.2026

Automatisoidut testit käyttävät muistissa toimivaa korviketallennusta ja
korvattua sähköpostipalvelua. Oikeita kuvia, liidejä tai sähköposteja ei lähetetä.
YOB:n oikean bucketin ja Resendin kokonaispolku sekä Vercel-julkaisu ovat erillisiä
käyttöönoton tarkistuksia. Responsiivisuus pitää varmistaa selaimessa koissa
320, 390, 768 ja 1440 px.

Tässä muutoksessa TypeScript, ESLint (0 varoitusta), 31 automaattista testiä
ja Next.js-tuotantokäännös läpäisivät. Paikallisen tuotantopalvelimen HTTP-
testit läpäisivät etusivun ja laskurisivun, manuaalisen arvion, suljetun JSON-
lähetyksen/uploadin/analytiikan sekä kuittausevästeettömän kiitossivun.
Selaintesti jäi tekemättä: paikallinen Chromium puuttui, ja Playwrightin
lataus palautti kelvottoman/tyhjän paketin. 320/390/768/1440 px -hyväksyntää
ei ole väitetty läpäistyksi. Muutos pidetään luonnos-PR:nä tähän tarkistukseen asti.
