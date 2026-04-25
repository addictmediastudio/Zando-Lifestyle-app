import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CartItem } from "./cart";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "./products";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  address?: string;
  createdAt: string;
};

export type OrderStatus = "En préparation" | "Expédiée" | "Livrée" | "Annulée";

export type Order = {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  payment: string;
  city: string;
  address: string;
};

type RegisterInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  city?: string;
  address?: string;
};

type AuthCtx = {
  user: User | null;
  hydrated: boolean;
  orders: Order[];
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (
    data: Partial<Pick<User, "name" | "phone" | "city" | "address">>,
  ) => Promise<void>;
  addOrder: (order: Omit<Order, "id" | "date" | "status">) => Promise<Order | null>;
  refreshOrders: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

async function loadProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name ?? "",
    email: data.email,
    phone: data.phone ?? "",
    city: data.city ?? "Pointe-Noire",
    address: data.address ?? undefined,
    createdAt: data.created_at,
  };
}

async function loadOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((o: any) => ({
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
        category: "Mode",
        description: "",
        popularity: 0,
      } as Product,
      qty: it.qty,
    })),
  }));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id;
      if (!uid) {
        setUser(null);
        setOrders([]);
        return;
      }
      // Defer Supabase calls to avoid deadlocks
      setTimeout(async () => {
        const p = await loadProfile(uid);
        setUser(p);
        const o = await loadOrders(uid);
        setOrders(o);
      }, 0);
    });

    // Then check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const uid = session?.user?.id;
      if (uid) {
        const p = await loadProfile(uid);
        setUser(p);
        const o = await loadOrders(uid);
        setOrders(o);
      }
      setHydrated(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(mapAuthError(error.message));
  };

  const register = async (data: RegisterInput) => {
    const redirectUrl = `${window.location.origin}/compte`;
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: data.name,
          phone: data.phone,
          city: data.city ?? "Pointe-Noire",
          address: data.address ?? null,
        },
      },
    });
    if (error) throw new Error(mapAuthError(error.message));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setOrders([]);
  };

  const updateProfile = async (
    data: Partial<Pick<User, "name" | "phone" | "city" | "address">>,
  ) => {
    if (!user) return;
    const patch: { name?: string; phone?: string; city?: string; address?: string | null } = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.city !== undefined) patch.city = data.city;
    if (data.address !== undefined) patch.address = data.address ?? null;
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    if (error) throw new Error(error.message);
    setUser({ ...user, ...data });
  };

  const refreshOrders = async () => {
    if (!user) return;
    setOrders(await loadOrders(user.id));
  };

  const addOrder: AuthCtx["addOrder"] = async (order) => {
    if (!user) return null;
    const id = "ZD-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const { error: oErr } = await supabase.from("orders").insert({
      id,
      user_id: user.id,
      total: order.total,
      payment: order.payment,
      city: order.city,
      address: order.address,
      status: "En préparation",
    });
    if (oErr) throw new Error(oErr.message);

    if (order.items.length > 0) {
      const { error: iErr } = await supabase.from("order_items").insert(
        order.items.map((it) => ({
          order_id: id,
          product_id: it.product.id,
          product_name: it.product.name,
          product_image: it.product.image,
          unit_price: it.product.price,
          qty: it.qty,
        })),
      );
      if (iErr) throw new Error(iErr.message);
    }

    const full: Order = {
      ...order,
      id,
      date: new Date().toISOString(),
      status: "En préparation",
    };
    setOrders((prev) => [full, ...prev]);
    return full;
  };

  return (
    <Ctx.Provider
      value={{
        user,
        hydrated,
        orders,
        login,
        register,
        logout,
        updateProfile,
        addOrder,
        refreshOrders,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

function mapAuthError(msg: string): string {
  if (msg.includes("Invalid login")) return "Email ou mot de passe incorrect";
  if (msg.includes("already registered") || msg.includes("already been registered"))
    return "Un compte existe déjà avec cet email";
  if (msg.includes("Password should be")) return "Mot de passe trop faible (6 caractères minimum)";
  return msg;
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
