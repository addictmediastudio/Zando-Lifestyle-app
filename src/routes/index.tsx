import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Truck, Shield, Sparkles } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { products, categories } from "@/lib/products";
import { useAdmin } from "@/lib/admin";
import { ProductCard } from "@/components/ProductCard";
import { CongoFlag } from "@/components/CongoFlag";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZANDO — Votre style, partout avec vous" },
      {
        name: "description",
        content:
          "Découvrez la boutique lifestyle ZANDO : mode, cosmétiques, accessoires premium livrés rapidement au Congo Brazzaville 🇨🇬.",
      },
      { property: "og:title", content: "ZANDO — Votre style, partout avec vous" },
      { property: "og:description", content: "Boutique lifestyle premium au Congo Brazzaville 🇨🇬." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { products: allProducts } = useAdmin();
  const featured = allProducts.filter((p) => p.featured);
  const promos = allProducts.filter((p) => p.oldPrice).slice(0, 4);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-white text-foreground">
        <div className="container-z grid items-center gap-10 py-16 md:grid-cols-2 md:py-24 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block rounded-full border border-background/20 bg-background/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
              Nouvelle collection
            </span>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] text-balance md:text-6xl lg:text-7xl">
              Votre style,
              <br />
              <span className="text-primary">partout</span> avec vous.
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">
              Mode, cosmétiques et accessoires premium. Livraison rapide à Pointe-Noire et
              Brazzaville <CongoFlag className="inline-block w-4 h-auto ml-1 mb-0.5 rounded-[1px] shadow-sm" />.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/catalogue"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
              >
                Découvrir <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/catalogue"
                search={{ cat: "Cosmétiques" }}
                className="inline-flex items-center rounded-full border border-border px-7 py-3.5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Cosmétiques
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
              <img
                src={hero}
                alt="ZANDO lifestyle"
                className="h-full w-full object-cover"
                width={1536}
                height={1280}
              />
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-xl">
              -20% Collection
            </div>
          </motion.div>
        </div>

        {/* Promo banner */}
        <div className="border-y border-border bg-white text-foreground">
          <div className="container-z flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-3 text-sm font-medium">
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4" /> Livraison rapide à Pointe-Noire
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Paiement à la livraison
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Produits authentiques
            </span>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-z py-16 md:py-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold md:text-4xl">Catégories</h2>
            <p className="mt-1 text-muted-foreground">Trouvez exactement ce que vous cherchez.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {categories.map((c) => {
            const img = allProducts.find((p) => p.category === c)?.image;
            return (
              <Link
                key={c}
                to="/catalogue"
                search={{ cat: c }}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted"
              >
                <img
                  src={img}
                  alt={c}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-5 text-background">
                  <span className="font-display text-2xl font-bold">{c}</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container-z py-8 md:py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold md:text-4xl">En vedette</h2>
            <p className="mt-1 text-muted-foreground">Sélection ZANDO du moment.</p>
          </div>
          <Link
            to="/catalogue"
            className="hidden text-sm font-semibold text-primary hover:underline sm:inline"
          >
            Voir tout →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* PROMOS */}
      {promos.length > 0 && (
        <section className="container-z py-16 md:py-20">
          <div className="rounded-3xl bg-foreground p-6 text-background md:p-12">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">
                  Offres du moment
                </span>
                <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
                  Profitez-en avant la fin.
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
              {promos.map((p) => (
                <div key={p.id} className="[&_p]:text-background/60 [&_h3]:text-background">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
