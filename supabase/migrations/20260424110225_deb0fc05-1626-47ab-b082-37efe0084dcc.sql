
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
CREATE TYPE public.product_category AS ENUM ('Mode', 'Cosmétiques', 'Accessoires');
CREATE TYPE public.order_status AS ENUM ('En préparation', 'Expédiée', 'Livrée', 'Annulée');

-- ============ UTILITY: updated_at trigger ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT 'Pointe-Noire',
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER_ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- ============ AUTO-CREATE PROFILE + ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, phone, city, address)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', 'Pointe-Noire'),
    NEW.raw_user_meta_data->>'address'
  );

  -- Auto-grant admin role to the seed admin email
  IF NEW.email = 'admin@zando.cg' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  old_price INTEGER CHECK (old_price >= 0),
  category public.product_category NOT NULL,
  image TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  popularity INTEGER NOT NULL DEFAULT 50 CHECK (popularity BETWEEN 0 AND 100),
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PROMOS ============
CREATE TABLE public.promos (
  code TEXT PRIMARY KEY,
  percent INTEGER NOT NULL CHECK (percent BETWEEN 0 AND 100),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_promos_updated_at
BEFORE UPDATE ON public.promos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ORDERS ============
CREATE TABLE public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total INTEGER NOT NULL CHECK (total >= 0),
  status public.order_status NOT NULL DEFAULT 'En préparation',
  payment TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ORDER_ITEMS ============
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT NOT NULL,
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  qty INTEGER NOT NULL CHECK (qty > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- ============ RLS POLICIES ============

-- profiles
CREATE POLICY "Users view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins view all profiles" ON public.profiles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- user_roles (read-only from client; writes via trigger or admin SQL)
CREATE POLICY "Users view own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins view all roles" ON public.user_roles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- products: public read, admin write
CREATE POLICY "Anyone can view products" ON public.products
FOR SELECT USING (true);

CREATE POLICY "Admins insert products" ON public.products
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update products" ON public.products
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete products" ON public.products
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- promos: public read of active, admin full
CREATE POLICY "Anyone can view active promos" ON public.promos
FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert promos" ON public.promos
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update promos" ON public.promos
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete promos" ON public.promos
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- orders
CREATE POLICY "Users view own orders" ON public.orders
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins view all orders" ON public.orders
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own orders" ON public.orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update any order" ON public.orders
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- order_items
CREATE POLICY "Users view own order items" ON public.order_items
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);

CREATE POLICY "Admins view all order items" ON public.order_items
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert items in own orders" ON public.order_items
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);

-- ============ SEED PRODUCTS ============
INSERT INTO public.products (id, name, price, old_price, category, image, description, popularity, featured) VALUES
('bomber-orange', 'Bomber Signature Orange', 38000, 48000, 'Mode', '/src/assets/p-jacket.jpg', 'Bomber technique en nylon hydrofuge, doublure intérieure douce, finition premium signée ZANDO. Une pièce statement pour affirmer votre style.', 95, true),
('sneakers-air', 'Sneakers Air Lifestyle', 45000, NULL, 'Mode', '/src/assets/p-sneakers.jpg', 'Sneakers urbaines minimalistes, semelle compensée légère, mesh respirant. Le confort sans compromis sur le style.', 92, true),
('serum-glow', 'Sérum Glow Vitamin C', 18500, 22000, 'Cosmétiques', '/src/assets/p-serum.jpg', 'Sérum éclat à la vitamine C stabilisée, formule légère qui pénètre rapidement. Pour une peau lumineuse jour après jour.', 88, true),
('bag-tote', 'Tote Bag Premium Cuir', 32000, NULL, 'Accessoires', '/src/assets/p-bag.jpg', 'Tote bag en cuir grainé, finitions soignées, doublure intérieure résistante. L''accessoire indispensable du quotidien.', 85, false),
('watch-mono', 'Montre Mono Edition', 65000, 78000, 'Accessoires', '/src/assets/p-watch.jpg', 'Montre épurée, cadran minimaliste, bracelet en cuir véritable. L''élégance intemporelle au poignet.', 82, true),
('sunglasses-noir', 'Lunettes Noir Mat', 24000, NULL, 'Accessoires', '/src/assets/p-sunglasses.jpg', 'Lunettes de soleil monture acétate noir mat, verres polarisés UV400. Protection et style assurés.', 79, false),
('lipstick-velvet', 'Rouge à Lèvres Velvet', 9500, 12000, 'Cosmétiques', '/src/assets/p-lipstick.jpg', 'Rouge à lèvres mat longue tenue, texture crémeuse, pigments intenses. Tenue 8h confortable.', 76, false),
('hoodie-essential', 'Hoodie Essential Cream', 28000, NULL, 'Mode', '/src/assets/p-hoodie.jpg', 'Hoodie oversize en coton bio brossé, capuche doublée. Le basique premium pour tous les jours.', 90, true);

-- ============ SEED PROMOS ============
INSERT INTO public.promos (code, percent, active) VALUES
('WELCOME10', 10, true),
('ZANDO20', 20, true);
