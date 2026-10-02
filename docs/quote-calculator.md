# Tarjouspyyntölaskuri

Laskuri on etusivun palveluosuuden jälkeen ja omalla `/tarjouspyynto`-sivulla.
Viisi vaihetta keräävät palvelun, kohteen, laajuustiedot, kuvauksen ja liitteet
sekä yhteystiedot. Palvelun vaihtaminen tyhjentää edellisen palvelun mitat.
Timanttiporauksella ja sahauksella on eri mittakentät. Tuntemattoman mitan voi
ilmoittaa erikseen, ja desimaalipilkku normalisoidaan palvelimella.

## Hinta ja lähetys

Hyväksyttyä hinnastoa ei ole. Laskuri ei näytä euromääräistä arviota eikä käytä
esimerkkihintoja. `/api/quote-estimate` palauttaa validoiduille tiedoille
`quote_only`-tuloksen. Hinnaston määrittely on erillinen jatkotyö.

Laskuri käyttää nykyistä `/api/inquiries`-rajapintaa. Uusi `quoteDetails`-kenttä
validoidaan palvelimella, palvelun on vastattava lomakkeen palveluvalintaa,
ja sähköpostiyhteenveto muodostetaan tarkistetuista tiedoista. Selaimen
lähettämiä hintoja ei hyväksytä. Vanha kohdearviolomake toimii edelleen.

`LEAD_INTAKE_ENABLED` ja nykyiset lähetysasetukset ohjaavat lähettämistä.
Esikatselussa uusi laskuri vain tarkistaa syötteet, ei lähetä viestiä, eikä näytä
vastaanottokuittausta. Yhteystietoja tai liitteitä ei tallenneta selaimen
pysyvään tallennustilaan. Liiterajat säilyvät kolmessa tiedostossa ja 3 MiB:n
yhteiskoossa. Vastaanottajareititys käyttää nykyistä `LEAD_RECIPIENT`-asetusta.

## Tarkistukset 2.10.2026

- TypeScript ja koko projektin ESLint läpäisivät.
- 21 automaattista testiä läpäisi, sisältäen 13 aiemman lomakkeen testiä.
- Next.js:n tuotantokäännös läpäisi.
- Tuotantopalvelimen HTTP-testit läpäisivät etusivulle, laskurisivulle,
  arviointirajapinnalle ja suljetun lomakkeen 503-vastaukselle.
- Selaimen visuaalinen tarkistus on tehtävä julkaistusta versiosta: tämän
  työympäristön selain esti paikallisen localhost-testiosoitteen avaamisen.
- Oikeaan asiakkaan sähköpostiin ei lähetetty testiviestejä.

HTTP-alkuperän tarkistus vertaa Origin-otsaketta selaimen kohdeosoitetta
vastaavaan Host-otsakkeeseen. Tämä toimii myös silloin, kun Next.js muodostaa
sisäisen Request-osoitteen kuunteluosoitteesta. Vieras alkuperä, eri protokolla
ja puuttuva Origin hylätään edelleen.

Ennen asiakaslähetyksen aktivointia vahvistetaan vastaanottaja ja nykyisessä
käyttöönotto-ohjeessa kuvatut lähetysasetukset. Hinnat, hinnoitteluehdot ja
palvelukohtaiset vastaanottajat: [puuttuu: selvitä asiakkaalta].
