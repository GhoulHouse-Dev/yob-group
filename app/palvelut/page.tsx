import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, ServiceCards } from "@/components/site-content";
export const metadata: Metadata = {
  title: "Rakennus- ja korjauspalvelut",
  description:
    "Injektointi, vedeneristys, rakennekorjaukset, väestönsuojat, betonirakentaminen, timanttityöt ja saneeraukset.",
};
export default function Services() {
  return (
    <main id="sisalto">
      <PageIntro
        eyebrow="PALVELUT"
        title="Lähtökohtana kohteesi tarve."
        description="Tutustu rakennus- ja korjauspalveluihimme. Jos et tiedä sopivaa menetelmää, voit aloittaa kuvaamalla kohteen ja havaitun ongelman."
      />
      <section className="container section subpage-section">
        <ServiceCards all />
      </section>
      <section className="page-cta">
        <div className="container">
          <div>
            <h2>Et tarvitse valmista diagnoosia.</h2>
            <p>
              Paikkakunta, kohteen tyyppi ja lyhyt kuvaus tarpeesta riittävät
              yhteydenoton lähtötiedoiksi.
            </p>
          </div>
          <Link className="button" href="/yhteys#kohdearvio">
            Pyydä kohdearvio
          </Link>
        </div>
      </section>
    </main>
  );
}
