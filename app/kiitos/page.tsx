import Link from "next/link";
import { cookies } from "next/headers";
import { receiptCookie, verifyToken } from "@/lib/quote/session";
export default async function ThankYou() {
  const token = (await cookies()).get(receiptCookie)?.value;
  const received = process.env.QUOTE_SESSION_SECRET && verifyToken(token, process.env.QUOTE_SESSION_SECRET, "receipt");
  return (
    <main id="sisalto">
      <div className="container page-intro">
        <span className="eyebrow">YHTEYDENOTTO</span>
        <h1>{received ? "Kiitos tarjouspyynnöstäsi." : "Tarjouspyyntö"}</h1>
        <p className="lead">
          {received ? "Tarjouspyyntösi on tallennettu ja välitetty YOB Groupille. YOB ottaa yhteyttä antamiesi tietojen perusteella työn sisällön ja hinnan täsmentämiseksi." : "Täytä tarjouspyyntö kohteesi lähtötiedoilla. Vastaanotto vahvistetaan onnistuneen lähetyksen jälkeen."}
        </p>
        <Link className="button" href="/tarjouspyynto">
          Palaa lomakkeelle
        </Link>
      </div>
    </main>
  );
}
