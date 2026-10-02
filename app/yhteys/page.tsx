import { deliveryAvailable } from "@/lib/delivery-config";
import type { Metadata } from "next";
import { PageIntro, ContactCards } from "@/components/site-content";
import { InquiryForm } from "@/components/inquiry-form";
export const metadata: Metadata = {
  title: "Yhteystiedot ja kohdearviopyyntö",
  description:
    "Ota yhteyttä YOB Group Oy:n yhteyshenkilöihin tai kuvaa kohteesi ja korjaustarpeesi kohdearviopyynnöllä.",
};
export default async function Contact({
  searchParams,
}: {
  searchParams: Promise<{
    palvelu?: string;
  }>;
}) {
  const { palvelu } = await searchParams;
  return (
    <main id="sisalto">
      <PageIntro
        eyebrow="YHTEYSTIEDOT"
        title="Kerro kohteestasi."
        description="Kuvaa korjaustarve ja jätä yhteystietosi. Sopivaa palvelua tai korjausmenetelmää ei tarvitse tietää etukäteen."
      />
      <section
        className="container section subpage-section inquiry-grid"
        id="kohdearvio"
      >
        <div className="inquiry-intro">
          <h2>Kohdearviopyyntö</h2>
          <p>
            Aloita kohteen paikkakunnasta ja havaitusta korjaustarpeesta. Kuvat
            ja suunnitelmat ovat vapaaehtoisia.
          </p>
          <p>Voit myös ottaa suoraan yhteyttä alla oleviin henkilöihin.</p>
        </div>
        <InquiryForm initialService={palvelu} enabled={deliveryAvailable()} />
      </section>
      <section className="section company-section">
        <div className="container">
          <h2>Yhteyshenkilöt</h2>
          <ContactCards />
        </div>
      </section>
    </main>
  );
}
