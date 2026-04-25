import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Truck,
  ShieldCheck,
  ArrowRight,
  Tag,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { formatFCFA } from "@/lib/products";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/panier")({
  head: () => ({
    meta: [
      { title: "Panier — ZANDO" },
      {
        name: "description",
        content:
          "Vérifiez vos articles, ajustez les quantités et passez votre commande en toute simplicité.",
      },
    ],
  }),
  component: CartPage,
});

const FREE_SHIPPING_THRESHOLD = 50000;
const SHIPPING_FEE = 2000;

function CartPage() {
  const { items, setQty, remove, total, count, clear } = useCart();
  const [promo, setPromo] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const handleQtyChange = (id: string, current: number, next: number, name: string) => {
    if (next < 1) return;
    setQty(id, next);
    const verb = next > current ? "augmentée" : "réduite";
    toast.success("Quantité mise à jour", {
      description: `${name} — quantité ${verb} à ${next}`,
    });
  };

  const applyPromo = () => {
    const code = promo.trim().toUpperCase();
    if (!code) {
      toast.error("Saisissez un code promo");
      return;
    }
    if (code === appliedCode) {
      toast.info("Code déjà appliqué", { description: `${code} est déjà actif sur votre panier` });
      return;
    }
    if (code === "ZANDO10") {
      const amount = Math.round(total * 0.1);
      setDiscount(amount);
      setAppliedCode(code);
      toast.success("Code promo appliqué 🎉", {
        description: `${code} — vous économisez ${formatFCFA(amount)}`,
      });
    } else {
      setDiscount(0);
      setAppliedCode("");
      toast.error("Code promo invalide", { description: `“${code}” n'est pas reconnu` });
    }
  };

  const removePromo = () => {
    if (!appliedCode) return;
    const removed = appliedCode;
    setDiscount(0);
    setAppliedCode("");
    setPromo("");
    toast("Promo retirée", { description: `Le code ${removed} a été retiré du panier` });
  };

  if (items.length === 0) {
    return (
      <div className="container-z py-24 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-muted">
          <ShoppingBag className="h-9 w-9 text-muted-foreground" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold">Votre panier est vide</h1>
        <p className="mt-2 text-muted-foreground">Découvrez nos produits et ajoutez vos favoris.</p>
        <Link
          to="/catalogue"
          className="mt-8 inline-flex rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Voir la boutique
        </Link>
      </div>
    );
  }

  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const progress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100);
  const grandTotal = Math.max(0, total - discount) + shipping;

  return (
    <div className="container-z py-6 pb-28 md:py-14 lg:pb-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-5xl">Votre panier</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {count} {count > 1 ? "articles" : "article"} dans votre panier
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" /> Vider le panier
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Vider le panier ?</AlertDialogTitle>
              <AlertDialogDescription>
                Tous les articles seront supprimés. Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const removed = count;
                  clear();
                  setDiscount(0);
                  setAppliedCode("");
                  setPromo("");
                  toast.success("Panier vidé", {
                    description: `${removed} ${removed > 1 ? "articles ont" : "article a"} été supprimés`,
                  });
                }}
              >
                Vider
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Free shipping progress */}
      <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4">
        <div className="flex items-center gap-2 text-sm">
          <Truck className="h-4 w-4 text-primary" />
          {remainingForFree > 0 ? (
            <span>
              Plus que <strong className="text-foreground">{formatFCFA(remainingForFree)}</strong>{" "}
              pour la livraison gratuite 🎉
            </span>
          ) : (
            <span className="font-medium text-primary">
              Vous bénéficiez de la livraison gratuite !
            </span>
          )}
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {items.map(({ product, qty }) => {
            const lineTotal = product.price * qty;
            return (
              <div
                key={product.id}
                className="group relative flex gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-primary/40 sm:gap-4 sm:p-4"
              >
                <Link to="/produit/$id" params={{ id: product.id }} className="shrink-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-20 w-20 rounded-xl object-cover sm:h-28 sm:w-28"
                  />
                </Link>
                <div className="flex flex-1 flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        to="/produit/$id"
                        params={{ id: product.id }}
                        className="font-medium hover:text-primary"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                        {product.category}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatFCFA(product.price)} <span className="text-xs">/ unité</span>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        remove(product.id);
                        toast.success("Article retiré", {
                          description: `${product.name} a été supprimé de votre panier`,
                        });
                      }}
                      className="text-muted-foreground transition hover:text-destructive"
                      aria-label="Retirer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1 rounded-full border border-border bg-background">
                      <button
                        onClick={() => handleQtyChange(product.id, qty, qty - 1, product.name)}
                        disabled={qty <= 1}
                        className="grid h-9 w-9 place-items-center rounded-l-full transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Diminuer la quantité"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">
                        {qty}
                      </span>
                      <button
                        onClick={() => handleQtyChange(product.id, qty, qty + 1, product.name)}
                        className="grid h-9 w-9 place-items-center rounded-r-full transition hover:text-primary"
                        aria-label="Augmenter la quantité"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Sous-total
                      </p>
                      <span className="font-display text-lg font-bold">
                        {formatFCFA(lineTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
          >
            ← Continuer mes achats
          </Link>
        </div>

        <aside className="hidden h-fit space-y-4 lg:sticky lg:top-24 lg:block">
          <div className="rounded-2xl bg-foreground p-6 text-background">
            <h2 className="font-display text-xl font-bold">Récapitulatif</h2>

            {/* Promo */}
            <div className="mt-5">
              <label
                htmlFor="promo"
                className="text-xs uppercase tracking-wider text-background/60"
              >
                Code promo
              </label>
              <div className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-background/50" />
                  <input
                    id="promo"
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    placeholder="ZANDO10"
                    className="h-10 w-full rounded-full border border-background/20 bg-background/5 pl-9 pr-3 text-sm text-background placeholder:text-background/40 focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  onClick={applyPromo}
                  className="rounded-full bg-background/10 px-4 text-sm font-semibold text-background transition hover:bg-background/20"
                >
                  Appliquer
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-2.5 text-sm">
              <div className="flex justify-between text-background/70">
                <span>
                  Sous-total ({count} {count > 1 ? "articles" : "article"})
                </span>
                <span className="text-background">{formatFCFA(total)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-primary">
                  <span className="flex items-center gap-2">
                    Réduction{" "}
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      {appliedCode}
                    </span>
                    <button
                      onClick={removePromo}
                      className="text-[11px] text-background/60 underline-offset-2 hover:text-background hover:underline"
                    >
                      retirer
                    </button>
                  </span>
                  <span>− {formatFCFA(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-background/70">
                <span>Livraison</span>
                <span className={shipping === 0 ? "font-medium text-primary" : "text-background"}>
                  {shipping === 0 ? "Gratuite" : formatFCFA(shipping)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-background/15 pt-4">
              <span className="font-semibold">Total TTC</span>
              <span className="font-display text-2xl font-bold text-primary">
                {formatFCFA(grandTotal)}
              </span>
            </div>

            <Link
              to="/checkout"
              className="group mt-6 flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Passer la commande
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Reassurance */}
          <div className="rounded-2xl border border-border p-5">
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">
                  Livraison rapide à{" "}
                  <span className="font-medium text-foreground">Pointe-Noire</span> et Brazzaville
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">
                  Paiement sécurisé — Mobile Money ou à la livraison
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Tag className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">
                  Essayez le code <strong className="text-foreground">ZANDO10</strong> pour −10%
                </span>
              </li>
            </ul>
          </div>
        </aside>

        {/* Mobile compact summary (inline, before sticky bar) */}
        <div className="rounded-2xl bg-foreground p-5 text-background lg:hidden">
          <h2 className="font-display text-lg font-bold">Récapitulatif</h2>
          <div className="mt-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-background/50" />
                <input
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  placeholder="Code promo"
                  className="h-10 w-full rounded-full border border-background/20 bg-background/5 pl-9 pr-3 text-sm text-background placeholder:text-background/40 focus:border-primary focus:outline-none"
                />
              </div>
              <button
                onClick={applyPromo}
                className="rounded-full bg-background/10 px-4 text-sm font-semibold text-background transition hover:bg-background/20"
              >
                Appliquer
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-background/70">
                <span>Sous-total</span>
                <span className="text-background">{formatFCFA(total)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-primary">
                  <span className="flex items-center gap-2">
                    {appliedCode}
                    <button
                      onClick={removePromo}
                      className="text-[11px] text-background/60 underline"
                    >
                      retirer
                    </button>
                  </span>
                  <span>− {formatFCFA(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-background/70">
                <span>Livraison</span>
                <span className={shipping === 0 ? "font-medium text-primary" : "text-background"}>
                  {shipping === 0 ? "Gratuite" : formatFCFA(shipping)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
        <div className="container-z flex items-center gap-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total TTC</p>
            <p className="font-display text-xl font-bold leading-tight">{formatFCFA(grandTotal)}</p>
          </div>
          <Link
            to="/checkout"
            className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90"
          >
            Commander
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
