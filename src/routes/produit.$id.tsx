import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingBag, Zap, ArrowLeft, Check } from "lucide-react";
import { getProduct, formatFCFA, fetchProductFromSupabase } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useAdmin } from "@/lib/admin";
import { ProductCard } from "@/components/ProductCard";
import { toast } from "sonner";

export const Route = createFileRoute("/produit/$id")({
  loader: async ({ params }) => {
    // Try static first, then Supabase
    let product = getProduct(params.id);
    if (!product) {
      product = (await fetchProductFromSupabase(params.id)) || undefined;
    }
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — ZANDO` },
          { name: "description", content: loaderData.product.description },
          { property: "og:title", content: `${loaderData.product.name} — ZANDO` },
          { property: "og:description", content: loaderData.product.description },
          { property: "og:image", content: loaderData.product.image },
        ]
      : [],
  }),
  component: ProductPage,
  notFoundComponent: () => (
    <div className="container-z py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Produit introuvable</h1>
      <Link to="/catalogue" className="mt-4 inline-block text-primary hover:underline">
        ← Retour à la boutique
      </Link>
    </div>
  ),
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { products: allProducts } = useAdmin();
  const { add } = useCart();
  const navigate = useNavigate();

  const allImages = [product.image, ...(product.images ?? [])].filter(Boolean);
  const [selectedImage, setSelectedImage] = useState(product.image);

  const similar = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const handleAdd = () => {
    // We pass the selected image as well if needed for the cart
    add({ ...product, image: selectedImage });
    toast.success("Ajouté au panier", { description: product.name });
  };

  const handleBuy = () => {
    add({ ...product, image: selectedImage });
    navigate({ to: "/checkout" });
  };

  return (
    <div className="container-z py-8 md:py-12">
      <Link
        to="/catalogue"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-border">
            <img
              src={selectedImage}
              alt={product.name}
              className="aspect-square w-full object-contain p-6 transition-all duration-300"
            />
            {discount > 0 && (
              <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground">
                -{discount}%
              </span>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-white transition-all ${
                    selectedImage === img
                      ? "border-primary scale-95 shadow-md"
                      : "border-transparent hover:border-muted-foreground/30"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx}`}
                    className="h-full w-full object-contain p-2"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {product.category}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl text-balance">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold">{formatFCFA(product.price)}</span>
            {product.oldPrice && (
              <span className="text-lg text-muted-foreground line-through">
                {formatFCFA(product.oldPrice)}
              </span>
            )}
          </div>

          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          {allImages.length > 1 && (
            <div className="mt-8">
              <span className="text-sm font-bold uppercase tracking-wider">Choisir le modèle</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`h-12 w-12 overflow-hidden rounded-full border-2 bg-white transition-all ${
                      selectedImage === img
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Model ${idx}`}
                      className="h-full w-full object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <ul className="mt-8 space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="h-3 w-3" />
              </div>{" "}
              Livraison à domicile (Pointe-Noire & Brazzaville)
            </li>
            <li className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="h-3 w-3" />
              </div>{" "}
              Paiement à la réception ou Mobile Money
            </li>
            <li className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="h-3 w-3" />
              </div>{" "}
              Garantie authenticité ZANDO
            </li>
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleAdd}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-foreground px-6 py-4 text-sm font-bold text-foreground transition-all hover:bg-foreground hover:text-background active:scale-95"
            >
              <ShoppingBag className="h-4 w-4" /> Ajouter au panier
            </button>
            <button
              onClick={handleBuy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-primary/20 active:scale-95"
            >
              <Zap className="h-4 w-4" /> Acheter maintenant
            </button>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-display text-2xl font-bold md:text-3xl">Vous aimerez aussi</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
