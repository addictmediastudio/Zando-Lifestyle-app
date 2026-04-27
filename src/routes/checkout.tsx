import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatFCFA } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Commande — ZANDO" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const { user, orders, addOrder, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState("");

  // Adresse par défaut : profil utilisateur, sinon dernière commande
  const lastOrder = orders[0];
  const defaults = useMemo(
    () => ({
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      address: user?.address ?? lastOrder?.address ?? "",
      city: user?.city ?? lastOrder?.city ?? "Pointe-Noire",
    }),
    [user, lastOrder],
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string)?.trim();
    const phone = (fd.get("phone") as string)?.trim();
    const address = ((fd.get("address") as string) ?? "").trim();
    const city = ((fd.get("city") as string) ?? "Pointe-Noire").trim();
    const payValue = (fd.get("pay") as string) ?? "momo";
    const payment = payValue === "cod" ? "À la livraison" : "Mobile Money";

    if (!name || !phone) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    setLoading(true);
    const snapshotItems = items.map((i) => ({ ...i }));
    const snapshotTotal = total;
    let id = "";

    try {
      if (payValue === "momo") {
        // Paiement OpenPay via Edge Function
        const { data, error } = await supabase.functions.invoke("openpay", {
          body: {
            phonenumber: phone,
            operator: phone.startsWith("05") || phone.startsWith("04") ? "MTN" : "AIRTEL",
            orderData: {
              items: snapshotItems,
              total: snapshotTotal,
              name,
              phone,
              city,
              address,
              userId: user?.id,
            },
          },
        });

        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);
        id = data.orderId;
      } else {
        // Paiement à la livraison
        if (user) {
          await updateProfile({ name, phone, city, address });
          const created = await addOrder({
            items: snapshotItems,
            total: snapshotTotal,
            payment,
            city,
            address,
          });
          if (created) id = created.id;
        } else {
          // Mode invité (on génère un ID local pour l'affichage)
          id = "ZD-" + Math.random().toString(36).slice(2, 8).toUpperCase();
        }
      }

      setOrderId(id);
      setDone(true);
      clear();
      toast.success("Commande confirmée 🎉", {
        description: `Numéro ${id} — ${formatFCFA(snapshotTotal)} • paiement ${payment}`,
        duration: 6000,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du paiement");
      console.error("Payment error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="container-z py-24 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold md:text-4xl">
          Merci pour votre commande !
        </h1>
        <p className="mt-3 text-muted-foreground">
          Votre numéro de commande est{" "}
          <span className="font-mono font-semibold text-foreground">{orderId}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Notre équipe vous contactera au numéro fourni pour confirmer la livraison.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-background hover:bg-foreground/90"
        >
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    navigate({ to: "/panier" });
    return null;
  }

  return (
    <div className="container-z py-10 md:py-14">
      <h1 className="font-display text-4xl font-bold md:text-5xl">Finaliser la commande</h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section className="rounded-2xl border border-border p-6">
            <h2 className="font-display text-lg font-bold">Informations client</h2>
            {user && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs text-foreground">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  Formulaire pré-rempli avec les informations de votre compte
                  <span className="font-semibold"> ({user.email})</span>. Vous pouvez les modifier
                  ci-dessous.
                </span>
              </div>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                key={`name-${defaults.name}`}
                label="Nom complet *"
                name="name"
                required
                defaultValue={defaults.name}
              />
              <Field
                key={`phone-${defaults.phone}`}
                label="Téléphone *"
                name="phone"
                type="tel"
                placeholder="🇨🇬 +242 …"
                required
                defaultValue={defaults.phone}
              />
              <Field
                key={`addr-${defaults.address}`}
                label="Adresse"
                name="address"
                placeholder="Quartier, rue, point de repère…"
                className="sm:col-span-2"
                defaultValue={defaults.address}
              />
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium">Ville</label>
                <select
                  key={`city-${defaults.city}`}
                  name="city"
                  defaultValue={defaults.city}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option>Pointe-Noire</option>
                  <option>Brazzaville</option>
                </select>
              </div>
            </div>
            {!user && (
              <p className="mt-3 text-xs text-muted-foreground">
                Astuce :{" "}
                <Link to="/compte" className="font-semibold text-primary hover:underline">
                  connectez-vous
                </Link>{" "}
                pour pré-remplir vos informations et garder un historique de vos commandes.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-border p-6">
            <h2 className="font-display text-lg font-bold">Mode de paiement</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Radio
                name="pay"
                value="momo"
                defaultChecked
                label="Mobile Money"
                hint="Airtel / MTN"
              />
              <Radio name="pay" value="cod" label="À la livraison" hint="Cash à la réception" />
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl bg-foreground p-6 text-background lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold">Votre commande</h2>
          <div className="mt-4 space-y-3">
            {items.map(({ product, qty }) => (
              <div key={product.id} className="flex justify-between gap-3 text-sm">
                <span className="text-background/80">
                  {product.name} <span className="text-background/50">× {qty}</span>
                </span>
                <span className="font-medium tabular-nums">{formatFCFA(product.price * qty)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-baseline justify-between border-t border-background/15 pt-4">
            <span className="font-semibold">Total</span>
            <span className="font-display text-2xl font-bold text-primary">
              {formatFCFA(total)}
            </span>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Traitement..." : "Valider la commande"}
          </button>
          <p className="mt-3 text-center text-xs text-background/60">
            Besoin d'aide ? 🇨🇬 +242 05 545 70 46
          </p>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  className,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  defaultValue?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

function Radio({
  name,
  value,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  hint: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition has-[:checked]:border-primary has-[:checked]:bg-primary/5">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="mt-1 accent-primary"
      />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}
