import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Product, type Category } from "./products";
import type { Order, OrderStatus, User } from "./auth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";

export type Promo = {
  code: string;
  percent: number;
  active: boolean;
};

type EnrichedCustomer = User & { ordersCount: number; totalSpent: number };
type EnrichedOrder = Order & { userId: string; userName: string; userEmail: string };

type AdminCtx = {
  isAdmin: boolean;
  hydrated: boolean;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;

  products: Product[];
  addProduct: (p: Omit<Product, "id"> & { id?: string }) => Promise<void>;
  updateProduct: (id: string, patch: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  promos: Promo[];
  addPromo: (p: Promo) => Promise<void>;
  updatePromo: (code: string, patch: Partial<Promo>) => Promise<void>;
  deletePromo: (code: string) => Promise<void>;

  customers: EnrichedCustomer[];
  orders: EnrichedOrder[];
  updateOrderStatus: (userId: string, orderId: string, status: OrderStatus) => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AdminCtx | null>(null);

const ADMIN_EMAIL = "admin@zando.cg";
const ADMIN_PASSWORD = "admin2026";

function rowToProduct(r: any): Product {
  return {
    id: r.id,
    name: r.name,
    price: r.price,
    oldPrice: r.old_price ?? undefined,
    category: r.category as Category,
    image: r.image,
    images: r.images ?? [],
    description: r.description ?? "",
    popularity: r.popularity ?? 50,
    featured: r.featured ?? false,
  };
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, login, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [customers, setCustomers] = useState<EnrichedCustomer[]>([]);
  const [orders, setOrders] = useState<EnrichedOrder[]>([]);

  // Detect admin role whenever user changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      if (!user) {
        if (!cancelled) {
          setIsAdmin(false);
          setHydrated(true);
        }
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!cancelled) {
        setIsAdmin(!!data);
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Load products + promos (public read)
  const loadCatalogAndPromos = async () => {
    const [{ data: prods }, { data: pr }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("promos").select("*").order("created_at", { ascending: false }),
    ]);
    setProducts((prods ?? []).map(rowToProduct));
    setPromos((pr ?? []).map((r: any) => ({ code: r.code, percent: r.percent, active: r.active })));
  };

  useEffect(() => {
    loadCatalogAndPromos();
  }, []);

  // Load customers + all orders (admin only)
  const loadAdminData = async () => {
    const [{ data: profiles }, { data: ordersRaw }] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false }),
    ]);

    const ordersByUser = new Map<string, EnrichedOrder[]>();
    const enrichedOrders: EnrichedOrder[] = (ordersRaw ?? []).map((o: any) => {
      const profile = profiles?.find((p: any) => p.id === o.user_id);
      const eo: EnrichedOrder = {
        id: o.id,
        date: o.created_at,
        total: o.total,
        status: o.status as OrderStatus,
        payment: o.payment ?? "",
        city: o.city ?? "",
        address: o.address ?? "",
        items: (o.order_items ?? []).map((it: any) => ({
          product: {
            id: it.product_id,
            name: it.product_name,
            image: it.product_image,
            price: it.unit_price,
            category: "Mode" as Category,
            description: "",
            popularity: 0,
          },
          qty: it.qty,
        })),
        userId: o.user_id,
        userName: profile?.name ?? "Client",
        userEmail: profile?.email ?? "",
      };
      const arr = ordersByUser.get(o.user_id) ?? [];
      arr.push(eo);
      ordersByUser.set(o.user_id, arr);
      return eo;
    });
    setOrders(enrichedOrders);

    setCustomers(
      (profiles ?? []).map((p: any) => {
        const list = ordersByUser.get(p.id) ?? [];
        return {
          id: p.id,
          name: p.name ?? "",
          email: p.email,
          phone: p.phone ?? "",
          city: p.city ?? "",
          address: p.address ?? undefined,
          createdAt: p.created_at,
          ordersCount: list.length,
          totalSpent: list.reduce((s, o) => s + o.total, 0),
        };
      }),
    );
  };

  useEffect(() => {
    if (isAdmin) loadAdminData();
    else {
      setCustomers([]);
      setOrders([]);
    }
  }, [isAdmin]);

  const refresh = async () => {
    await loadCatalogAndPromos();
    if (isAdmin) await loadAdminData();
  };

  const loginAdmin = async (email: string, password: string) => {
    // First try normal login
    try {
      await login(email, password);
    } catch (err) {
      // If admin seed credentials and account doesn't exist yet, auto-create it
      if (
        email.trim().toLowerCase() === ADMIN_EMAIL &&
        password === ADMIN_PASSWORD &&
        (err as Error).message?.includes("incorrect")
      ) {
        const { error: signUpErr } = await supabase.auth.signUp({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
            data: { name: "Administrateur ZANDO", phone: "", city: "Pointe-Noire" },
          },
        });
        if (signUpErr) throw new Error(signUpErr.message);
        // After signup the trigger creates profile + admin role automatically
      } else {
        throw err;
      }
    }
    // Verify admin role
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Connexion échouée");
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      await supabase.auth.signOut();
      throw new Error("Ce compte n'a pas les privilèges administrateur");
    }
    setIsAdmin(true);
  };

  const logoutAdmin = async () => {
    await logout();
    setIsAdmin(false);
  };

  const addProduct: AdminCtx["addProduct"] = async (p) => {
    const id = p.id?.trim() || "p-" + Math.random().toString(36).slice(2, 8);
    const { error } = await supabase.from("products").insert({
      id,
      name: p.name,
      price: p.price,
      old_price: p.oldPrice ?? null,
      category: p.category,
      image: p.image,
      images: p.images ?? [],
      description: p.description,
      popularity: p.popularity,
      featured: p.featured ?? false,
    });
    if (error) throw new Error(error.message);
    await loadCatalogAndPromos();
  };

  const updateProduct: AdminCtx["updateProduct"] = async (id, patch) => {
    const dbPatch: {
      name?: string;
      price?: number;
      old_price?: number | null;
      category?: Category;
      image?: string;
      images?: string[];
      description?: string;
      popularity?: number;
      featured?: boolean;
    } = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.price !== undefined) dbPatch.price = patch.price;
    if (patch.oldPrice !== undefined) dbPatch.old_price = patch.oldPrice ?? null;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.image !== undefined) dbPatch.image = patch.image;
    if (patch.images !== undefined) dbPatch.images = patch.images;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.popularity !== undefined) dbPatch.popularity = patch.popularity;
    if (patch.featured !== undefined) dbPatch.featured = patch.featured;
    const { error } = await supabase.from("products").update(dbPatch).eq("id", id);
    if (error) throw new Error(error.message);
    await loadCatalogAndPromos();
  };

  const deleteProduct: AdminCtx["deleteProduct"] = async (id) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await loadCatalogAndPromos();
  };

  const addPromo: AdminCtx["addPromo"] = async (p) => {
    const code = p.code.trim().toUpperCase();
    const { error } = await supabase.from("promos").insert({ code, percent: p.percent, active: p.active });
    if (error) throw new Error(error.message);
    await loadCatalogAndPromos();
  };

  const updatePromo: AdminCtx["updatePromo"] = async (code, patch) => {
    const dbPatch: { percent?: number; active?: boolean } = {};
    if (patch.percent !== undefined) dbPatch.percent = patch.percent;
    if (patch.active !== undefined) dbPatch.active = patch.active;
    const { error } = await supabase.from("promos").update(dbPatch).eq("code", code);
    if (error) throw new Error(error.message);
    await loadCatalogAndPromos();
  };

  const deletePromo: AdminCtx["deletePromo"] = async (code) => {
    const { error } = await supabase.from("promos").delete().eq("code", code);
    if (error) throw new Error(error.message);
    await loadCatalogAndPromos();
  };

  const updateOrderStatus: AdminCtx["updateOrderStatus"] = async (_userId, orderId, status) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) throw new Error(error.message);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  return (
    <Ctx.Provider
      value={{
        isAdmin,
        hydrated,
        loginAdmin,
        logoutAdmin,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        promos,
        addPromo,
        updatePromo,
        deletePromo,
        customers,
        orders,
        updateOrderStatus,
        refresh,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAdmin = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
};

export const ADMIN_DEMO_CREDENTIALS = { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };
export type { Category };
