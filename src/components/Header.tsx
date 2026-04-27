import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, ShoppingBag, X, Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import logo from "@/assets/zando-logo.png";
import { CongoFlag } from "./CongoFlag";

const nav = [
  { to: "/", label: "Accueil" },
  { to: "/catalogue", label: "Boutique" },
  { to: "/panier", label: "Panier" },
  { to: "/compte", label: "Compte" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count } = useCart();
  const { location } = useRouterState();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 text-foreground transition-all duration-300",
        scrolled
          ? "border-b border-border bg-white/90 backdrop-blur-xl shadow-sm"
          : "border-b border-transparent bg-white",
      )}
    >
      {/* Top promo strip */}
      <div className="hidden bg-primary/10 text-primary md:block">
        <div className="container-z flex h-8 items-center justify-between text-[11px] font-medium uppercase tracking-[0.18em]">
          <span>Livraison rapide à Pointe-Noire & Brazzaville</span>
          <span className="opacity-80 inline-flex items-center gap-1.5"><CongoFlag className="w-3.5 h-auto rounded-[1px]" /> +242 05 545 70 46</span>
        </div>
      </div>

      <div className="container-z flex h-24 items-center justify-between gap-4 md:h-28">
        <Link to="/" className="flex items-center" aria-label="ZANDO — Accueil">
          <img
            src={logo}
            alt="ZANDO Boutique Lifestyle"
            className="h-20 w-auto md:h-24 drop-shadow-[0_0_20px_rgba(255,90,47,0.25)]"
            width={360}
            height={144}
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => {
            const active = location.pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active ? "text-foreground" : "text-foreground/70 hover:text-foreground",
                )}
              >
                {n.label}
                {active && (
                  <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            to="/catalogue"
            className="hidden h-11 w-11 items-center justify-center rounded-full border border-border bg-muted/30 text-foreground transition-colors hover:border-primary/60 hover:text-primary sm:flex"
            aria-label="Rechercher"
          >
            <Search className="h-[18px] w-[18px]" />
          </Link>
          <Link
            to="/compte"
            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-muted/30 text-foreground transition-colors hover:border-primary/60 hover:text-primary"
            aria-label="Compte"
          >
            <User className="h-[18px] w-[18px]" />
          </Link>
          <Link
            to="/panier"
            className="relative grid h-11 w-11 place-items-center rounded-full border border-primary/50 bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            aria-label="Panier"
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground ring-2 ring-white">
                {count}
              </span>
            )}
          </Link>
          <button
            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-muted/30 text-foreground hover:border-primary/60 hover:text-primary md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-white backdrop-blur-xl md:hidden">
          <nav className="container-z flex flex-col py-4">
            {nav.map((n) => {
              const active = location.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-3 text-base font-medium transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-foreground/80 hover:bg-muted hover:text-foreground",
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
