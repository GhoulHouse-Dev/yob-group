import type { Metadata } from "next";
import { QuoteCalculator } from "@/components/quote-calculator";
import { PageIntro } from "@/components/site-content";
import { quoteDeliveryAvailable } from "@/lib/delivery-config";
export const metadata: Metadata = {
  title: "Tarjouspyyntölaskuri",
  description: "Valitse työ, ilmoita kohteen lähtötiedot ja kokoa tarjouspyyntö YOB Groupille. Sopivaa korjausmenetelmää ei tarvitse tietää etukäteen.",
};
export default function QuotePage() {
  return <main id="sisalto">
    <PageIntro eyebrow="TARJOUSPYYNTÖLASKURI" title="Aloitetaan kohteestasi." description="Valitse työ ja kerro lähtötilanteesta. Laskuri kokoaa tiedot tarjouspyyntöä varten. Hinta vahvistetaan kohdekohtaisessa tarjouksessa." />
    <section className="container section subpage-section quote-page">
      <QuoteCalculator enabled={quoteDeliveryAvailable()} instance="page" analyticsEnabled={process.env.QUOTE_ANALYTICS_ENABLED === "true"} />
    </section>
  </main>;
}
