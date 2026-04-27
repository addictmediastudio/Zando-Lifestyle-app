import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import {
  LogOut,
  Package,
  ShoppingBag,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, type OrderStatus } from "@/lib/auth";
import { formatFCFA } from "@/lib/products";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compte")({
  head: () => ({
    meta: [
      { title: "Mon Compte — ZANDO" },
      {
        name: "description",
        content:
          "Connectez-vous ou créez un compte ZANDO pour suivre vos commandes et gérer vos informations.",
      },
      { property: "og:title", content: "Mon Compte — ZANDO" },
      {
        property: "og:description",
        content: "Espace client ZANDO : commandes, informations et plus.",
      },
    ],
  }),
  component: ComptePage,
});

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Nom trop court").max(80),
    email: z.string().trim().email("Email invalide").max(255),
    phone: z.string().trim().min(6, "Téléphone requis").max(30),
    password: z.string().min(6, "6 caractères minimum").max(100),
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

function ComptePage() {
  const { user, hydrated } = useAuth();

  if (!hydrated) {
    return <div className="container-z py-20 text-center text-muted-foreground">Chargement…</div>;
  }

  return <div className="container-z py-10 md:py-14">{user ? <Dashboard /> : <AuthForms />}</div>;
}

function AuthForms() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-3xl font-bold md:text-4xl">Mon compte</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Connectez-vous pour suivre vos commandes ou créez un compte en quelques secondes.
      </p>

      <Tabs defaultValue="login" className="mt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Connexion</TabsTrigger>
          <TabsTrigger value="register">Inscription</TabsTrigger>
        </TabsList>
        <TabsContent value="login" className="mt-6">
          <LoginForm />
        </TabsContent>
        <TabsContent value="register" className="mt-6">
          <RegisterForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      email: fd.get("email"),
      password: fd.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      await login(parsed.data.email, parsed.data.password);
      toast.success("Connexion réussie", { description: "Bienvenue !" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border p-6">
      <Field label="Email" name="email" type="email" required placeholder="vous@exemple.com" />
      <PasswordField label="Mot de passe" name="password" required placeholder="••••••" />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:bg-foreground/90 disabled:opacity-60"
      >
        {loading ? "Connexion…" : "Se connecter"}
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Pas encore de compte ? Utilisez l'onglet « Inscription ».
      </p>
    </form>
  );
}

function RegisterForm() {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = registerSchema.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      password: fd.get("password"),
      confirmPassword: fd.get("confirmPassword"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword: _cp, ...payload } = parsed.data;
      await register(payload);
      toast.success("Compte créé !", { description: "Bienvenue chez ZANDO." });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border p-6">
      <Field label="Nom complet" name="name" required placeholder="Jean Mavoungou" />
      <Field label="Email" name="email" type="email" required placeholder="vous@exemple.com" />
      <Field label="Téléphone" name="phone" type="tel" required placeholder="🇨🇬 +242 …" />
      <PasswordField
        label="Mot de passe"
        name="password"
        required
        placeholder="6 caractères minimum"
      />
      <PasswordField
        label="Confirmer le mot de passe"
        name="confirmPassword"
        required
        placeholder="Retapez le mot de passe"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
      >
        {loading ? "Création…" : "Créer mon compte"}
      </button>
      <p className="text-center text-xs text-muted-foreground">
        En créant un compte, vous acceptez nos conditions d'utilisation.
      </p>
    </form>
  );
}

function Dashboard() {
  const { user, orders, logout, updateProfile } = useAuth();
  if (!user) return null;

  const onSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateProfile({
      name: ((fd.get("name") as string) ?? "").trim(),
      phone: ((fd.get("phone") as string) ?? "").trim(),
      city: ((fd.get("city") as string) ?? "").trim(),
    });
    toast.success("Profil mis à jour");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-primary">Mon compte</p>
          <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">
            Bonjour, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Membre depuis le {new Date(user.createdAt).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <button
          onClick={() => {
            logout();
            toast.success("Vous êtes déconnecté");
          }}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <LogOut className="h-4 w-4" /> Déconnexion
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Profil */}
        <section className="h-fit rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold">Informations personnelles</h2>
          </div>

          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> {user.email}
            </p>
            <p className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />{" "}
              {new Date(user.createdAt).toLocaleDateString("fr-FR")}
            </p>
          </div>

          <form onSubmit={onSave} className="mt-5 space-y-4">
            <Field label="Nom complet" name="name" defaultValue={user.name} required />
            <Field label="Téléphone" name="phone" type="tel" defaultValue={user.phone} required />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Ville</label>
              <select
                name="city"
                defaultValue={user.city}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option>Pointe-Noire</option>
                <option>Brazzaville</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90"
            >
              Enregistrer
            </button>
          </form>
        </section>

        {/* Commandes */}
        <section className="rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold">Historique des commandes</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {orders.length} commande{orders.length > 1 ? "s" : ""}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/60" />
              <p className="mt-3 text-sm text-muted-foreground">Aucune commande pour le moment.</p>
              <Link
                to="/catalogue"
                search={{ cat: undefined }}
                className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Découvrir la boutique
              </Link>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {orders.map((o) => (
                <li key={o.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold">{o.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(o.date).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                        {" · "}
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {o.city}
                        </span>
                        {" · "}
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {o.payment}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={o.status} />
                      <span className="font-display text-base font-bold text-primary">
                        {formatFCFA(o.total)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                    {o.items.map(({ product, qty }) => (
                      <span key={product.id} className="rounded-full bg-muted px-2.5 py-1">
                        {product.name} × {qty}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    "En préparation": "bg-amber-100 text-amber-900",
    Expédiée: "bg-blue-100 text-blue-900",
    Livrée: "bg-emerald-100 text-emerald-900",
    Annulée: "bg-rose-100 text-rose-900",
  };
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", styles[status])}>
      {status}
    </span>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
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

function PasswordField({
  label,
  name,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
