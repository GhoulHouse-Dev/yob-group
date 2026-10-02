import Link from "next/link";
export default function NotFound() {
  return (
    <main id="sisalto">
      <div className="page-intro container">
        <span className="eyebrow">404</span>
        <h1>Sivua ei löytynyt.</h1>
        <p className="lead">
          Voit palata etusivulle tai tutustua palveluihimme.
        </p>
        <Link className="button" href="/palvelut">
          Tutustu palveluihin
        </Link>
      </div>
    </main>
  );
}
