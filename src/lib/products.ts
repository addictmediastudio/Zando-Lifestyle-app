import jacket from "@/assets/p-jacket.jpg";
import sneakers from "@/assets/p-sneakers.jpg";
import serum from "@/assets/p-serum.jpg";
import bag from "@/assets/p-bag.jpg";
import watch from "@/assets/p-watch.jpg";
import sunglasses from "@/assets/p-sunglasses.jpg";
import lipstick from "@/assets/p-lipstick.jpg";
import hoodie from "@/assets/p-hoodie.jpg";

export type Category = "Mode" | "Cosmétiques" | "Accessoires" | "Électronique" | "Maison" | "Sport" | "Enfants";

export type Product = {
  id: string;
  name: string;
  price: number; // FCFA
  oldPrice?: number;
  category: Category;
  image: string;
  images?: string[]; // additional images (gallery)
  description: string;
  popularity: number; // 0-100
  featured?: boolean;
};

export const products: Product[] = [
  {
    id: "bomber-orange",
    name: "Bomber Signature Orange",
    price: 38000,
    oldPrice: 48000,
    category: "Mode",
    image: jacket,
    description:
      "Bomber technique en nylon hydrofuge, doublure intérieure douce, finition premium signée ZANDO. Une pièce statement pour affirmer votre style.",
    popularity: 95,
    featured: true,
  },
  {
    id: "sneakers-air",
    name: "Sneakers Air Lifestyle",
    price: 45000,
    category: "Mode",
    image: sneakers,
    description:
      "Sneakers premium avec semelle à coussin d'air, cuir respirant et touche orange iconique. Confort toute la journée.",
    popularity: 88,
    featured: true,
  },
  {
    id: "serum-glow",
    name: "Sérum Éclat Vitamine C",
    price: 15000,
    oldPrice: 18000,
    category: "Cosmétiques",
    image: serum,
    description:
      "Sérum concentré à la vitamine C pour un teint éclatant et uniforme. Formule légère, absorption rapide.",
    popularity: 80,
    featured: true,
  },
  {
    id: "leather-bag",
    name: "Sac Cuir Tan Premium",
    price: 62000,
    category: "Accessoires",
    image: bag,
    description:
      "Sac à main en cuir pleine fleur, finitions cousues main. Élégance intemporelle pour toutes vos occasions.",
    popularity: 92,
    featured: true,
  },
  {
    id: "gold-watch",
    name: "Montre Or Classic",
    price: 85000,
    oldPrice: 110000,
    category: "Accessoires",
    image: watch,
    description:
      "Montre dorée au design épuré, mouvement précis, bracelet acier. Le luxe accessible.",
    popularity: 75,
  },
  {
    id: "aviator-sun",
    name: "Lunettes Aviator Noir",
    price: 22000,
    category: "Accessoires",
    image: sunglasses,
    description:
      "Lunettes de soleil aviator avec verres polarisés UV400 et monture métal premium.",
    popularity: 70,
  },
  {
    id: "matte-lipstick",
    name: "Rouge à Lèvres Matte",
    price: 8500,
    category: "Cosmétiques",
    image: lipstick,
    description:
      "Rouge à lèvres mat longue tenue, hydratant, couleur intense qui ne file pas.",
    popularity: 65,
  },
  {
    id: "hoodie-noir",
    name: "Hoodie Oversized Noir",
    price: 28000,
    category: "Mode",
    image: hoodie,
    description:
      "Hoodie oversized en coton brossé épais, coupe streetwear, label orange ZANDO.",
    popularity: 85,
  },
];

export const categories: Category[] = ["Mode", "Cosmétiques", "Accessoires", "Électronique", "Maison", "Sport", "Enfants"];

export const formatFCFA = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

export const getProduct = (id: string) => products.find((p) => p.id === id);

import { supabase } from "@/integrations/supabase/client";

export const fetchProductFromSupabase = async (id: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    price: data.price,
    oldPrice: data.old_price ?? undefined,
    category: data.category as Category,
    image: data.image,
    images: data.images ?? [],
    description: data.description ?? "",
    popularity: data.popularity ?? 50,
    featured: data.featured ?? false,
  };
};
