import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import { services, contacts, steps } from "@/lib/site";
export function ServiceCards({ all = false }: { all?: boolean }) {
  const Heading = all ? "h2" : "h3";
  return (
    <div className="services-grid">
      {(all ? services : services.slice(0, 3)).map((s, i) => (
        <article
          className={"service-card " + (!s.image ? "text-card" : "")}
          key={s.slug}
        >
          {s.image && (
            <figure className="service-image">
              <img
                src={"/images/" + s.image}
                alt={s.title + " havainnekuva"}
                width="700"
                height="467"
                loading="lazy"
              />
              <figcaption>Palvelun havainnekuva</figcaption>
            </figure>
          )}
          <div className="service-body">
            <span className="service-number">
              {String(i + 1).padStart(2, "0")} / {s.label}
            </span>
            <Heading>{s.title}</Heading>
            <p>{s.short}</p>
            <Link className="text-link" href={"/palvelut/" + s.slug}>
              Tutustu palveluun<span className="sr-only"> {s.title}</span>
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
export function Steps() {
  return (
    <section className="section steps-section">
      <div className="container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LÄHTÖTIEDOISTA LIIKKEELLE</span>
            <h2>Näin pääset alkuun</h2>
          </div>
          <Link className="button" href="/yhteys#kohdearvio">
            Pyydä kohdearvio
          </Link>
        </div>
        <ol className="steps-grid">
          {steps.map((s, i) => (
            <li key={s.title}>
              <span className="step-number" aria-hidden="true">
                0{i + 1}
              </span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
export function ContactCards() {
  return (
    <div className="contacts-grid">
      {contacts.map((c) => (
        <article className="contact-card" key={c.email}>
          <div className="initials" aria-hidden="true">
            {c.initials}
          </div>
          <h3>{c.name}</h3>
          <p className="contact-role">{c.role}</p>
          <a href={"tel:" + c.tel}>
            <Phone aria-hidden="true" size={18} />
            {c.phone}
          </a>
          <a href={"mailto:" + c.email}>
            <Mail aria-hidden="true" size={18} />
            {c.email}
          </a>
        </article>
      ))}
    </div>
  );
}
export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-intro container">
      <Link href="/" className="breadcrumb">
        Etusivu
      </Link>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p className="lead">{description}</p>
    </div>
  );
}
