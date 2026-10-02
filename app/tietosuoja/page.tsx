import type { Metadata } from "next";
import { PageIntro } from "@/components/site-content";
export const metadata: Metadata = { title: "Tietosuoja esikatselussa" };
export default function Privacy() {
  return (
    <main id="sisalto">
      <PageIntro
        eyebrow="TIETOSUOJA"
        title="Tietosuoja esikatselussa"
        description="Tämä sivusto on yksityinen esikatselu. Lomakkeen viestinvälitys ei ole käytössä."
      />
      <article className="container legal-copy">
        <h2>Lomakkeen tiedot</h2>
        <p>
          Lomakkeelle kirjoitetut tiedot säilyvät sivun käytön ajan selaimen
          muistissa. Niitä ei tallenneta selaimen pysyvään tallennustilaan.
          Lähetysrajapinta ei esikatselussa välitä yhteydenottoa YOB:lle eikä
          tallenna lomakkeen sisältöä.
        </p>
        <h2>Suorat yhteydenotot</h2>
        <p>
          Puhelin- ja sähköpostilinkit avaavat laitteen puhelin- tai
          sähköpostisovelluksen. Viestiä ei lähetetä automaattisesti.
        </p>
        <h2>Seuranta</h2>
        <p>
          Sivustoon ei ole lisätty analytiikka- tai markkinointipalveluita.
          Sivuston yksityistä käyttöoikeutta hallinnoi esikatselupalvelu.
        </p>
        <h2>Ennen julkista käyttöönottoa</h2>
        <p>
          Rekisterinpitäjä, käsittelyperuste, vastaanottajat, säilytysajat sekä
          rekisteröidyn oikeuksien toteuttaminen: [puuttuu: selvitä
          asiakkaalta].
        </p>
      </article>
    </main>
  );
}
