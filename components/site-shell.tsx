"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, Mail } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
const navigation = [
  { href: "/palvelut", label: "Palvelut" },
  { href: "/yritys", label: "Yritys" },
  { href: "/yhteys", label: "Yhteystiedot" },
];
export function Header() {
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" aria-label="YOB Group Oy etusivu" className="brand">
          <img
            src="/images/logo.jpg"
            alt="YOB Group Oy"
            width="180"
            height="126"
          />
        </Link>
        <nav className="desktop-nav" aria-label="Päänavigaatio">
          {navigation.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={path.startsWith(n.href) ? "page" : undefined}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="button header-cta" href="/yhteys#kohdearvio">
            Pyydä kohdearvio
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="menu-trigger">
                <Menu aria-hidden="true" /> <span>Valikko</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              className="mobile-sheet"
              showCloseButton={false}
              aria-describedby={undefined}
            >
              <div className="sheet-top">
                <SheetTitle>YOB Group Oy</SheetTitle>
                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    className="close-menu"
                    aria-label="Sulje valikko"
                  >
                    <X aria-hidden="true" />
                  </Button>
                </SheetClose>
              </div>
              <nav aria-label="Mobiilinavigaatio">
                {navigation.map((n) => (
                  <SheetClose key={n.href} asChild>
                    <Link
                      href={n.href}
                      aria-current={
                        path.startsWith(n.href) ? "page" : undefined
                      }
                    >
                      {n.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <SheetClose asChild>
                <Link className="button" href="/yhteys#kohdearvio">
                  Pyydä kohdearvio
                </Link>
              </SheetClose>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div>
          <p className="footer-name">
            YOB Group Oy<span>.</span>
          </p>
          <p>
            Rakenteiden korjaus,
            <br />
            tiivistys ja vahvistaminen.
          </p>
          <p className="fineprint">Y-tunnus 3573940-3</p>
        </div>
        <div>
          <h2>Palvelut</h2>
          <Link href="/palvelut/injektointi">Injektointi ja tiivistys</Link>
          <Link href="/palvelut/vedeneristys">Vedeneristys</Link>
          <Link href="/palvelut/rakennekorjaukset">Rakennekorjaukset</Link>
          <Link href="/palvelut">Kaikki palvelut</Link>
        </div>
        <div>
          <h2>Yhteystiedot</h2>
          <a href="tel:+358453509738">
            <Phone aria-hidden="true" size={16} />
            045 3509 738
          </a>
          <a href="mailto:sami@yob.fi">
            <Mail aria-hidden="true" size={16} />
            sami@yob.fi
          </a>
          <Link href="/yhteys">Kaikki yhteyshenkilöt</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} YOB Group Oy</span>
        <div>
          <Link href="/yritys">Yritys</Link>
          <Link href="/tietosuoja">Tietosuoja</Link>
        </div>
      </div>
    </footer>
  );
}
