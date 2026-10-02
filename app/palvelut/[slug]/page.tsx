import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { services } from "@/lib/site";
import { PageIntro } from "@/components/site-content";
export async function generateMetadata({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = services.find((s) => s.slug === slug);
  return { title: s?.title ?? "Palvelua ei löytynyt", description: s?.short };
}
export default async function Service({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;
  const s = services.find((s) => s.slug === slug);
  if (!s) notFound();
  return (
    <main id="sisalto">
      <PageIntro
        eyebrow="YOB / PALVELUT"
        title={s.title}
        description={s.intro}
      />
      <section className="container service-detail">
        <div>
          <h2>Palvelun sisältö</h2>
          <ul className="detail-list">
            {s.needs.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <h2>Kerro kohteen lähtötilanteesta</h2>
          <p>{s.description}</p>
          <Link className="text-link" href="/palvelut">
            Kaikki palvelut
          </Link>
        </div>
        {s.image ? (
          <figure>
            <img
              src={"/images/" + s.image}
              alt={s.title + " havainnekuva"}
              width="700"
              height="467"
            />
            <figcaption className="fineprint">Palvelun havainnekuva</figcaption>
          </figure>
        ) : (
          <div className="empty-state">
            <h2>Kohdearviopyynnön lähtötiedot</h2>
            <p>
              Kohteen paikkakunta, työn kuvaus ja yhteystietosi. Voit lisätä
              kuvia tai suunnitelmia sekä toivotun ajankohdan.
            </p>
            <Link
              className="button"
              href={"/yhteys?palvelu=" + s.slug + "#kohdearvio"}
            >
              Pyydä kohdearvio
            </Link>
          </div>
        )}
      </section>
      <section className="page-cta">
        <div className="container">
          <div>
            <h2>Kerro kohteestasi.</h2>
            <p>
              Sopivaa korjausmenetelmää ei tarvitse valita itse. Kuvaa tarve
              omin sanoin.
            </p>
          </div>
          <Link
            className="button"
            href={"/yhteys?palvelu=" + s.slug + "#kohdearvio"}
          >
            Pyydä kohdearvio
          </Link>
        </div>
      </section>
    </main>
  );
}
