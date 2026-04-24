import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth";
import { AdminProvider } from "@/lib/admin";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ZANDO — Boutique Lifestyle premium au Congo" },
      {
        name: "description",
        content:
          "Mode, cosmétiques et accessoires premium livrés à Pointe-Noire et Brazzaville. Votre style, partout avec vous.",
      },
      { name: "author", content: "ZANDO" },
      { property: "og:title", content: "ZANDO — Boutique Lifestyle premium au Congo" },
      { property: "og:description", content: "Découvrez des milliers de produits mode, beauté, accessoires à portée de clic." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "ZANDO — Boutique Lifestyle premium au Congo" },
      { name: "description", content: "Découvrez des milliers de produits mode, beauté, accessoires à portée de clic." },
      { name: "twitter:description", content: "Découvrez des milliers de produits mode, beauté, accessoires à portée de clic." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/CoFKwLxQXDRubGe9jyTgoPAiYo03/social-images/social-1776956633162-Zando_Mockup.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/CoFKwLxQXDRubGe9jyTgoPAiYo03/social-images/social-1776956633162-Zando_Mockup.webp" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <AdminProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </div>
          <Toaster />
        </CartProvider>
      </AdminProvider>
    </AuthProvider>
  );
}
