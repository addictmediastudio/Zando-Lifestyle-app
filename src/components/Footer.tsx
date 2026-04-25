import { Phone, Mail, MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/zando-logo.png";

export function Footer() {
  return (
    <footer className="mt-24 bg-[oklch(0.2_0.025_50)] text-[oklch(0.96_0.01_75)]">
      <div className="container-z grid gap-10 py-14 md:grid-cols-4">
        <div>
          <img
            src={logo}
            alt="ZANDO Boutique Lifestyle"
            className="h-20 w-auto md:h-24"
            width={320}
            height={128}
          />
          <p className="mt-4 text-sm text-background/70">
            Votre style, partout avec vous. Boutique lifestyle premium au Congo.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary">Boutique</h4>
          <ul className="mt-4 space-y-2 text-sm text-background/80">
            <li>
              <Link to="/catalogue" className="hover:text-primary">
                Tous les produits
              </Link>
            </li>
            <li>
              <Link to="/catalogue" search={{ cat: "Mode" }} className="hover:text-primary">
                Mode
              </Link>
            </li>
            <li>
              <Link to="/catalogue" search={{ cat: "Cosmétiques" }} className="hover:text-primary">
                Cosmétiques
              </Link>
            </li>
            <li>
              <Link to="/catalogue" search={{ cat: "Accessoires" }} className="hover:text-primary">
                Accessoires
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm text-background/80">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span>+242 05 545 70 46</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span>contact.zandocg@gmail.com</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Pointe-Noire, Congo</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary">Livraison</h4>
          <p className="mt-4 text-sm text-background/80">
            Livraison rapide à Pointe-Noire et Brazzaville. Paiement Mobile Money ou à la livraison.
          </p>
        </div>
      </div>
      <div className="border-t border-background/10">
        <div className="container-z flex flex-wrap items-center justify-between gap-2 py-6 text-xs text-background/60">
          <span>© {new Date().getFullYear()} ZANDO — Tous droits réservés.</span>
          <Link to="/admin" className="hover:text-primary">
            Espace admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
