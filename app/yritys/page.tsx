import type { Metadata } from "next";
import { PageIntro, ContactCards } from "@/components/site-content";
export const metadata: Metadata = {
  title: "Yritys ja yhteyshenkilöt",
  description:
    "YOB Group Oy on erikoistunut rakenteiden korjaamiseen, tiivistämiseen ja vahvistamiseen. Tutustu yhteyshenkilöihin.",
};
export default function Company() {
  return (
    <main id="sisalto">
      <PageIntro
        eyebrow="YRITYS"
        title="YOB Group Oy työn takana."
        description="Rakenteiden korjaus, tiivistys ja vahvistaminen."
      />
      <section className="container section subpage-section">
        <div className="company-copy">
          <h2>Palvelut korjausrakentamisen tarpeisiin.</h2>
          <div>
            <p>
              YOB Group Oy on erikoistunut vaativien rakenteiden korjaamiseen,
              tiivistämiseen ja vahvistamiseen. Palveluihimme kuuluvat
              injektointi, vedeneristys sekä rakennus- ja korjaustyöt.
            </p>
            <p>Y-tunnus 3573940-3</p>
          </div>
        </div>
        <h2>Yhteyshenkilöt</h2>
        <ContactCards />
      </section>
    </main>
  );
}
