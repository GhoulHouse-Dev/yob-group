import Link from "next/link";
export default function ThankYou() {
  return (
    <main id="sisalto">
      <div className="container page-intro">
        <span className="eyebrow">YHTEYDENOTTO</span>
        <h1>Kohdearviopyyntö</h1>
        <p className="lead">
          Vastaanottokuittaus näytetään lomakkeella vasta onnistuneen lähetyksen
          jälkeen.
        </p>
        <Link className="button" href="/yhteys#kohdearvio">
          Palaa lomakkeelle
        </Link>
      </div>
    </main>
  );
}
