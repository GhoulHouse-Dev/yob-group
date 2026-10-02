# Tietoturvailmoitukset

Älä julkaise haavoittuvuuden hyödyntämisohjetta, henkilötietoja tai API-avaimia julkisessa issue-keskustelussa. Ota yhteyttä repositorion omistajaan GitHubin kautta. Private vulnerability reporting -toiminnon käyttöönotto: [puuttuu: selvitä asiakkaalta].

Salaisuudet asetetaan vain julkaisualustan ympäristömuuttujiksi. `.env.example` sisältää pelkät muuttujien nimet. Lähetysrajapinta on oletusarvoisesti pois päältä, tarkistaa alkuperän sekä kentät ja rajoittaa rungon sekä liitteiden kokoa. Lähetys hyväksytään vasta sähköpostipalvelun kuittauksen jälkeen. Yhteydenottajien tietoja ei lokiteta sovelluksessa.

Ennen julkisen lomakkeen aktivointia ota käyttöön julkaisualustan pysyvä nopeusrajoitus / bottisuoja. Sovelluksen honeypot ja Origin-tarkistus eivät yksin korvaa tätä. Vahvista lisäksi lähettäjädomain, vastaanottaja, palveluntarjoajat ja tietosuojateksti. Turvallisuuden vastuuhenkilö ja käsittelyn käytäntö: [puuttuu: selvitä asiakkaalta].
