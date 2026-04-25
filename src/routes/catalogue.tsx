import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { products, categories, type Category } from "@/lib/products";
import { useAdmin } from "@/lib/admin";
import { ProductCard } from "@/components/ProductCard";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  cat: fallback(
    z
      .enum(["Mode", "Cosmétiques", "Accessoires", "Électronique", "Maison", "Sport", "Enfants"])
      .optional(),
    undefined,
  ).default(undefined),
});

export const Route = createFileRoute("/catalogue")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Boutique — ZANDO" },
      {
        name: "description",
        content: "Découvrez tous les produits ZANDO : mode, cosmétiques et accessoires.",
      },
      { property: "og:title", content: "Boutique ZANDO" },
      { property: "og:description", content: "Catalogue complet ZANDO." },
    ],
  }),
  component: CataloguePage,
});

function CataloguePage() {
  const { products } = useAdmin();
  const { cat } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"pop" | "price-asc" | "price-desc">("pop");
  const [maxPrice, setMaxPrice] = useState(100000);

  const filtered = useMemo(() => {
    let list = [...products];
    if (cat) list = list.filter((p) => p.category === cat);
    if (query.trim()) list = list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    list = list.filter((p) => p.price <= maxPrice);
    if (sort === "pop") list.sort((a, b) => b.popularity - a.popularity);
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [products, cat, query, sort, maxPrice]);

  const setCat = (c?: Category) => navigate({ search: { cat: c } });

  return (
    <div className="container-z py-10 md:py-14">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold md:text-5xl">Boutique</h1>
        <p className="mt-2 text-muted-foreground">
          {filtered.length} produit{filtered.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit…"
          className="w-full rounded-full border border-input bg-background py-3 pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setCat(undefined)}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition",
            !cat
              ? "border-foreground bg-foreground text-background"
              : "border-border hover:border-foreground",
          )}
        >
          Tous
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              cat === c
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-foreground",
            )}
          >
            {c}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-muted-foreground">Prix max:</span>
            <input
              type="range"
              min={5000}
              max={100000}
              step={5000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="accent-primary"
            />
            <span className="font-medium tabular-nums">
              {maxPrice.toLocaleString("fr-FR")} FCFA
            </span>
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="pop">Popularité</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center text-muted-foreground">
          Aucun produit ne correspond à votre recherche.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
