import { deliveryAvailable } from "@/lib/delivery-config";
import Link from "next/link";
import { ServiceCards, Steps, ContactCards } from "@/components/site-content";
import { InquiryForm } from "@/components/inquiry-form";
export default function Home() {
  return (
    <main id="sisalto">
      <section className="hero container">
        <div className="hero-copy">
          <span className="eyebrow">YOB GROUP OY / KORJAUSRAKENTAMINEN</span>
          <h1>
            Vaativien rakenteiden <span>korjaus ja tiivistys</span>
          </h1>
          <p className="lead">
            Injektointi, vedeneristys ja rakennekorjaukset. Kerro kohteestasi ja
            korjaustarpeesta.
          </p>
          <Link href="/yhteys#kohdearvio" className="button">
            Pyydä kohdearvio
          </Link>
          <p className="hero-note">
            Sopivaa korjausmenetelmää ei tarvitse tietää etukäteen.
          </p>
        </div>
        <figure className="hero-visual">
          <img
            src="/images/injektointi.webp"
            alt="Injektoinnin palvelukuva: työväline betonirakenteen käsittelyssä"
            width="933"
            height="1400"
            fetchPriority="high"
          />
          <figcaption>
            <span>PALVELUN HAVAINNEKUVA</span>
            <strong>Injektointi ja tiivistys</strong>
          </figcaption>
        </figure>
      </section>
      <div className="specialties container" aria-label="Palvelupainotukset">
        <span>Injektointi</span>
        <span>Vedeneristys</span>
        <span>Rakennekorjaukset</span>
        <span>Rakenteiden vahvistaminen</span>
      </div>
      <section className="section services-section" id="palvelut">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">PALVELUMME</span>
              <h2>
                Palvelut rakenteiden
                <br className="desktop-break" /> korjaukseen
              </h2>
            </div>
            <p>
              Vuotaako rakenne tai näkyykö betonissa halkeamia? Aloita
              korjaustarpeen kuvauksesta.
            </p>
          </div>
          <ServiceCards />
          <div className="service-bottom">
            <p>
              Myös väestönsuojat, betonirakentaminen, timanttityöt sekä
              saneeraukset ja tilamuutokset.
            </p>
            <Link className="text-link" href="/palvelut">
              Katso kaikki palvelut
            </Link>
          </div>
        </div>
      </section>
      <section className="problem-section">
        <div className="container problem-grid">
          <div>
            <span className="eyebrow">KOHDE ENSIN</span>
            <h2>
              Ongelman voi kuvata
              <br /> omin sanoin.
            </h2>
          </div>
          <div>
            <p>
              Millaisesta rakenteesta on kyse? Missä vaurio tai vuoto sijaitsee?
              Kuvaus, paikkakunta ja mahdolliset kuvat auttavat kertomaan
              lähtötilanteesta.
            </p>
            <p>
              Jos et tiedä sopivaa palvelua, voit jättää palveluvalinnan
              avoimeksi.
            </p>
            <Link className="button button-light" href="/yhteys#kohdearvio">
              Pyydä kohdearvio
            </Link>
          </div>
        </div>
      </section>
      <Steps />
      <section className="section company-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOB GROUP OY</span>
              <h2>Tekijät työn takana</h2>
            </div>
            <div>
              <p>
                YOB Group Oy on erikoistunut rakenteiden korjaamiseen,
                tiivistämiseen ja vahvistamiseen.
              </p>
              <Link className="text-link" href="/yritys">
                Tutustu yritykseen
              </Link>
            </div>
          </div>
          <ContactCards />
        </div>
      </section>
      <section className="section inquiry-section" id="kohdearvio">
        <div className="container inquiry-grid">
          <div className="inquiry-intro">
            <span className="eyebrow">OTA YHTEYTTÄ</span>
            <h2>
              Kerro
              <br /> kohteestasi.
            </h2>
            <p>
              Kuvaa korjaustarve ja jätä yhteystietosi. Sopivaa palvelua tai
              korjausmenetelmää ei tarvitse valita itse.
            </p>
            <a className="text-link" href="tel:+358453509738">
              Voit myös soittaa: 045 3509 738
            </a>
          </div>
          <InquiryForm enabled={deliveryAvailable()} />
        </div>
      </section>
    </main>
  );
}
