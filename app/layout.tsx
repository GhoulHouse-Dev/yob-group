import type { Metadata } from "next";
import { Header, Footer } from "@/components/site-shell";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Injektointi ja rakennekorjaukset | YOB Group Oy",
    template: "%s | YOB Group Oy",
  },
  description:
    "YOB Group Oy: injektointi, rakenteiden tiivistys, vedeneristys ja rakennekorjaukset. Tutustu palveluihin ja kerro kohteestasi.",
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fi">
      <head>
        <link
          rel="preload"
          href="/fonts/inter-variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <a className="skip-link" href="#sisalto">
          Siirry sisältöön
        </a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
