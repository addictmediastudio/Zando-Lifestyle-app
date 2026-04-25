import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type FormEvent, Fragment } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  LogOut,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Upload,
  ImagePlus,
  Star,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useAdmin, ADMIN_DEMO_CREDENTIALS } from "@/lib/admin";
import { categories, formatFCFA, type Category, type Product } from "@/lib/products";
import type { OrderStatus } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — ZANDO" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: AdminPage,
});

type Tab = "dashboard" | "orders" | "products" | "customers" | "promos";

function AdminPage() {
  const admin = useAdmin();
  const [tab, setTab] = useState<Tab>("dashboard");

  if (!admin.hydrated) {
    return <div className="container-z py-20 text-muted-foreground">Chargement…</div>;
  }

  if (!admin.isAdmin) return <AdminLogin />;

  return (
    <div className="container-z grid gap-6 py-10 md:grid-cols-[220px_1fr]">
      <aside className="space-y-1 rounded-2xl border border-border bg-card p-3">
        <div className="px-3 pb-3 pt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Espace admin
          </p>
          <p className="mt-1 text-sm font-bold">ZANDO</p>
        </div>
        <NavBtn
          icon={LayoutDashboard}
          label="Tableau de bord"
          active={tab === "dashboard"}
          onClick={() => setTab("dashboard")}
        />
        <NavBtn
          icon={ShoppingBag}
          label="Commandes"
          active={tab === "orders"}
          onClick={() => setTab("orders")}
          badge={admin.orders.length}
        />
        <NavBtn
          icon={Package}
          label="Produits"
          active={tab === "products"}
          onClick={() => setTab("products")}
          badge={admin.products.length}
        />
        <NavBtn
          icon={Users}
          label="Clients"
          active={tab === "customers"}
          onClick={() => setTab("customers")}
          badge={admin.customers.length}
        />
        <NavBtn
          icon={Tag}
          label="Codes promo"
          active={tab === "promos"}
          onClick={() => setTab("promos")}
          badge={admin.promos.length}
        />
        <button
          onClick={() => {
            admin.logoutAdmin();
            toast.success("Déconnecté de l'admin");
          }}
          className="mt-4 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Déconnexion
        </button>
      </aside>

      <section>
        {tab === "dashboard" && <Dashboard />}
        {tab === "orders" && <OrdersTab />}
        {tab === "products" && <ProductsTab />}
        {tab === "customers" && <CustomersTab />}
        {tab === "promos" && <PromosTab />}
      </section>
    </div>
  );
}

function NavBtn({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted"
      }`}
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" /> {label}
      </span>
      {typeof badge === "number" && (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-primary-foreground/20" : "bg-muted-foreground/15"}`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function AdminLogin() {
  const { loginAdmin } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginAdmin(email, password);
      toast.success("Bienvenue dans l'admin ZANDO");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-z grid place-items-center py-20">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Espace admin
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold">Connexion</h1>
        </div>
        <Field label="Email">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Mot de passe">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Démo : <code className="font-mono">{ADMIN_DEMO_CREDENTIALS.email}</code> /{" "}
          <code className="font-mono">{ADMIN_DEMO_CREDENTIALS.password}</code>
        </p>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Dashboard() {
  const { orders, customers, products, promos } = useAdmin();
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === "En préparation").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Vue d'ensemble de votre boutique.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenu total" value={formatFCFA(revenue)} />
        <Stat label="Commandes" value={orders.length} sub={`${pending} en attente`} />
        <Stat label="Clients" value={customers.length} />
        <Stat
          label="Produits"
          value={products.length}
          sub={`${promos.filter((p) => p.active).length} promos actives`}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-bold">Dernières commandes</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Aucune commande pour l'instant.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-mono">{o.id}</span>
                <span className="text-muted-foreground">{o.userName}</span>
                <span>{formatFCFA(o.total)}</span>
                <StatusBadge status={o.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, string> = {
    "En préparation": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    Expédiée: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    Livrée: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    Annulée: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status]}`}>
      {status}
    </span>
  );
}

function OrdersTab() {
  const { orders, updateOrderStatus, refresh } = useAdmin();
  const statuses: OrderStatus[] = ["En préparation", "Expédiée", "Livrée"];

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Commandes</h1>
          <p className="text-sm text-muted-foreground">{orders.length} commande(s) au total.</p>
        </div>
        <Button variant="outline" onClick={refresh}>
          Actualiser
        </Button>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">N°</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Ville</th>
              <th className="px-4 py-3">Articles</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Aucune commande.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.userId + o.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono">{o.id}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(o.date).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{o.userName}</div>
                  <div className="text-xs text-muted-foreground">{o.userEmail}</div>
                </td>
                <td className="px-4 py-3">{o.city}</td>
                <td className="px-4 py-3">{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                <td className="px-4 py-3 font-semibold">{formatFCFA(o.total)}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) => {
                      updateOrderStatus(o.userId, o.id, e.target.value as OrderStatus);
                      toast.success(`Commande ${o.id} → ${e.target.value}`);
                    }}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductsTab() {
  const { products, addProduct, updateProduct, deleteProduct, reorderProducts } = useAdmin();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const moveUp = async (productId: string, category: string) => {
    const catProducts = products.filter(p => p.category === category);
    const catIdx = catProducts.findIndex(p => p.id === productId);
    if (catIdx <= 0) return;
    const prevProduct = catProducts[catIdx - 1];
    
    const newOrder = products.map((p) => p.id);
    const idx1 = newOrder.indexOf(productId);
    const idx2 = newOrder.indexOf(prevProduct.id);
    [newOrder[idx1], newOrder[idx2]] = [newOrder[idx2], newOrder[idx1]];
    await reorderProducts(newOrder);
  };

  const moveDown = async (productId: string, category: string) => {
    const catProducts = products.filter(p => p.category === category);
    const catIdx = catProducts.findIndex(p => p.id === productId);
    if (catIdx === -1 || catIdx === catProducts.length - 1) return;
    const nextProduct = catProducts[catIdx + 1];

    const newOrder = products.map((p) => p.id);
    const idx1 = newOrder.indexOf(productId);
    const idx2 = newOrder.indexOf(nextProduct.id);
    [newOrder[idx1], newOrder[idx2]] = [newOrder[idx2], newOrder[idx1]];
    await reorderProducts(newOrder);
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Produits</h1>
          <p className="text-sm text-muted-foreground">{products.length} produit(s).</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </header>

      {creating && (
        <ProductForm
          onCancel={() => setCreating(false)}
          onSave={async (p) => {
            await addProduct(p);
            setCreating(false);
            toast.success(`Produit "${p.name}" ajouté`);
          }}
        />
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Prix</th>
              <th className="px-4 py-3">Ancien prix</th>
              <th className="px-4 py-3">Vedette</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => {
              const catProducts = products.filter((p) => p.category === c);
              if (catProducts.length === 0) return null;

              return (
                <Fragment key={c}>
                  <tr>
                    <td colSpan={6} className="bg-muted/30 px-4 py-2 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      {c}
                    </td>
                  </tr>
                  {catProducts.map((p, catIdx) =>
                    editingId === p.id ? (
                      <tr key={p.id} className="border-t border-border bg-muted/20">
                        <td colSpan={6} className="p-4">
                          <ProductForm
                            initial={p}
                            onCancel={() => setEditingId(null)}
                            onSave={async (patch) => {
                              await updateProduct(p.id, patch);
                              setEditingId(null);
                              toast.success(`"${patch.name}" mis à jour`);
                            }}
                          />
                        </td>
                      </tr>
                    ) : (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                            <div>
                              <div className="font-medium">{p.name}</div>
                              <div className="text-xs text-muted-foreground">{p.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">{p.category}</td>
                        <td className="px-4 py-3 font-semibold">{formatFCFA(p.price)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {p.oldPrice ? formatFCFA(p.oldPrice) : "—"}
                        </td>
                        <td className="px-4 py-3">{p.featured ? "✓" : "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => moveUp(p.id, p.category)}
                              disabled={catIdx === 0}
                              className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"
                              aria-label="Monter"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => moveDown(p.id, p.category)}
                              disabled={catIdx === catProducts.length - 1}
                              className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"
                              aria-label="Descendre"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(p.id)}
                              className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-muted ml-2"
                              aria-label="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Supprimer "${p.name}" ?`)) {
                                  deleteProduct(p.id);
                                  toast.success("Produit supprimé");
                                }
                              }}
                              className="grid h-8 w-8 place-items-center rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10"
                              aria-label="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Product;
  onSave: (p: Omit<Product, "id"> & { id?: string }) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    id: initial?.id ?? "",
    name: initial?.name ?? "",
    price: initial?.price ?? 0,
    oldPrice: initial?.oldPrice ?? 0,
    category: (initial?.category ?? "Vêtements") as Category,
    description: initial?.description ?? "",
    popularity: initial?.popularity ?? 50,
    featured: initial?.featured ?? false,
  });
  // gallery: first item is the main image
  const initialGallery = [initial?.image, ...(initial?.images ?? [])].filter(
    (x): x is string => !!x,
  );
  const [gallery, setGallery] = useState<string[]>(initialGallery);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} n'est pas une image`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} dépasse 5 Mo`);
          continue;
        }
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) {
          toast.error(`Upload échoué: ${upErr.message}`);
          continue;
        }
        const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
        uploaded.push(pub.publicUrl);
      }
      if (uploaded.length) setGallery((g) => [...g, ...uploaded]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (idx: number) => {
    setGallery((g) => g.filter((_, i) => i !== idx));
  };

  const setMain = (idx: number) => {
    setGallery((g) => {
      if (idx === 0) return g;
      const copy = [...g];
      const [picked] = copy.splice(idx, 1);
      return [picked, ...copy];
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error("Nom et prix requis");
      return;
    }
    if (gallery.length === 0) {
      toast.error("Ajoutez au moins une image");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        id: form.id || undefined,
        name: form.name,
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
        category: form.category,
        image: gallery[0],
        images: gallery.slice(1),
        description: form.description,
        popularity: Number(form.popularity),
        featured: form.featured,
      });
    } catch (err) {
      toast.error((err as Error).message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-2"
    >
      <Field label="Nom">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </Field>
      <Field label="Catégorie">
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Prix (FCFA)">
        <input
          type="number"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          required
        />
      </Field>
      <Field label="Ancien prix (FCFA, optionnel)">
        <input
          type="number"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={form.oldPrice}
          onChange={(e) => setForm({ ...form, oldPrice: Number(e.target.value) })}
        />
      </Field>

      <div className="sm:col-span-2">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">
          Images du produit (la première est l'image principale)
        </span>
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
          {gallery.length > 0 && (
            <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {gallery.map((url, idx) => (
                <div
                  key={url + idx}
                  className="group relative overflow-hidden rounded-md border border-border bg-card"
                >
                  <img src={url} alt={`img ${idx + 1}`} className="h-20 w-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute left-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                      Principale
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-background/90 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => setMain(idx)}
                        className="rounded p-1 hover:bg-muted"
                        title="Définir comme principale"
                      >
                        <Star className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="ml-auto rounded p-1 text-destructive hover:bg-destructive/10"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-3 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {uploading ? (
              <>Upload en cours…</>
            ) : (
              <>
                {gallery.length === 0 ? (
                  <Upload className="h-4 w-4" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {gallery.length === 0 ? "Choisir des images" : "Ajouter d'autres images"}
              </>
            )}
          </button>
          <p className="mt-2 text-[11px] text-muted-foreground">
            JPG, PNG, WEBP — 5 Mo max par image. Sélection multiple autorisée.
          </p>
        </div>
      </div>

      <Field label="Popularité (0-100)">
        <input
          type="number"
          min={0}
          max={100}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={form.popularity}
          onChange={(e) => setForm({ ...form, popularity: Number(e.target.value) })}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => setForm({ ...form, featured: e.target.checked })}
        />
        Mettre en vedette
      </label>
      <div className="sm:col-span-2">
        <Field label="Description">
          <textarea
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          <X className="h-4 w-4" /> Annuler
        </Button>
        <Button type="submit" disabled={saving || uploading}>
          <Check className="h-4 w-4" /> {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

function CustomersTab() {
  const { customers } = useAdmin();
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-bold">Clients</h1>
        <p className="text-sm text-muted-foreground">{customers.length} client(s) inscrit(s).</p>
      </header>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Ville</th>
              <th className="px-4 py-3">Commandes</th>
              <th className="px-4 py-3">Total dépensé</th>
              <th className="px-4 py-3">Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Aucun client.
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                <td className="px-4 py-3">{c.phone}</td>
                <td className="px-4 py-3">{c.city}</td>
                <td className="px-4 py-3">{c.ordersCount}</td>
                <td className="px-4 py-3 font-semibold">{formatFCFA(c.totalSpent)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PromosTab() {
  const { promos, addPromo, updatePromo, deletePromo } = useAdmin();
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState(10);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || percent <= 0 || percent > 100) {
      toast.error("Code et pourcentage valides requis");
      return;
    }
    addPromo({ code: code.trim().toUpperCase(), percent, active: true });
    toast.success(`Code ${code.toUpperCase()} créé`);
    setCode("");
    setPercent(10);
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-bold">Codes promo</h1>
        <p className="text-sm text-muted-foreground">Gérez les remises proposées au panier.</p>
      </header>

      <form
        onSubmit={submit}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4"
      >
        <Field label="Code">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-44 rounded-md border border-border bg-background px-3 py-2 text-sm uppercase"
            placeholder="ZANDO20"
          />
        </Field>
        <Field label="Remise (%)">
          <input
            type="number"
            min={1}
            max={100}
            value={percent}
            onChange={(e) => setPercent(Number(e.target.value))}
            className="w-28 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Button type="submit">
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Remise</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promos.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Aucun code promo.
                </td>
              </tr>
            )}
            {promos.map((p) => (
              <tr key={p.code} className="border-t border-border">
                <td className="px-4 py-3 font-mono font-semibold">{p.code}</td>
                <td className="px-4 py-3">-{p.percent}%</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => {
                      updatePromo(p.code, { active: !p.active });
                      toast.success(`Code ${p.code} ${!p.active ? "activé" : "désactivé"}`);
                    }}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.active ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}
                  >
                    {p.active ? "Actif" : "Inactif"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      if (confirm(`Supprimer le code ${p.code} ?`)) {
                        deletePromo(p.code);
                        toast.success("Code supprimé");
                      }
                    }}
                    className="grid h-8 w-8 place-items-center rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
