

## Page Compte utilisateur (V1 — fictive, sans backend)

Ajout d'une page `/compte` avec **connexion / inscription** locales et un **historique des commandes** persistant côté navigateur. Pas de Lovable Cloud à ce stade — tout reste en `localStorage` pour rester cohérent avec la V1 actuelle (panier déjà persisté localement).

### Parcours utilisateur

1. Clic sur l'icône **Compte** dans le header → `/compte`
2. Si non connecté → écran à deux onglets **Connexion / Inscription** (nom, email, téléphone, mot de passe)
3. Une fois connecté → tableau de bord avec 3 sections :
   - **Informations personnelles** (modifiables)
   - **Historique des commandes** (liste avec n°, date, statut, total, articles)
   - **Bouton Déconnexion**
4. Lors d'un checkout réussi, la commande est automatiquement ajoutée à l'historique du compte connecté (et le formulaire de checkout est pré-rempli si l'utilisateur est connecté).

### Fichiers à créer / modifier

**Nouveau — `src/lib/auth.tsx`**
Contexte React `AuthProvider` exposant :
- `user: { id, name, email, phone, city } | null`
- `login(email, password)`, `register(data)`, `logout()`, `updateProfile(data)`
- `orders: Order[]`, `addOrder(order)`
- Persistance via `localStorage` (clé `zando-auth-v1` + `zando-orders-{userId}`)
- **Note hydratation** : lecture `localStorage` uniquement dans `useEffect` + flag `hydrated` pour éviter le mismatch SSR/CSR (même pattern que `cart.tsx`)
- Mots de passe : hash simple (btoa) — clairement marqué "démo V1, non sécurisé"

**Nouveau — `src/routes/compte.tsx`**
- `head()` avec title/description/og dédiés
- Si `!user` : composant `<AuthForms />` avec onglets via `@/components/ui/tabs`
- Si `user` : 3 cartes (Profil / Commandes / Déconnexion)
- Validation des entrées avec **Zod** (déjà installé) : email valide, mot de passe ≥ 6 caractères, téléphone non vide
- Toasts `sonner` pour feedback
- États vides élégants (« Aucune commande pour le moment » + CTA Boutique)

**Modifié — `src/components/Header.tsx`**
- Ajout d'une icône `User` (lucide) entre Recherche et Panier, lien vers `/compte`
- Ajout de l'entrée « Compte » dans la nav mobile

**Modifié — `src/routes/__root.tsx`**
- Wrap de `RootComponent` dans `<AuthProvider>` (à l'intérieur de `CartProvider`)

**Modifié — `src/routes/checkout.tsx`**
- Pré-remplir `name`, `phone`, `address`, `city` depuis `user` si connecté
- Lors de la confirmation, appeler `addOrder({ id, date, items, total, status: "En préparation", payment, city })`

**Correction silencieuse — `src/components/Footer.tsx`**
Le runtime error d'hydratation provient d'espaces autour de `{" contact.zandocg@gmail.com"}` à côté de l'icône `<Mail/>`. Normaliser le whitespace JSX pour faire correspondre serveur/client.

### Modèle de données (TypeScript)

```text
User    { id, name, email, phone, city, createdAt }
Order   { id, date, items: CartItem[], total, status, payment, city, address }
Status  "En préparation" | "Expédiée" | "Livrée"
```

### Points design

- Réutilise les tokens existants (noir profond, orange `#FF5A2F`, blanc)
- Cartes `rounded-2xl border border-border` cohérentes avec checkout/panier
- Onglets shadcn pour Connexion/Inscription
- Badges colorés pour le statut commande
- 100% responsive (grid 1 colonne mobile, 2 colonnes desktop pour profil + commandes)

### Hors scope V1 (à proposer plus tard)

- Vraie authentification serveur (Lovable Cloud + Supabase Auth)
- Réinitialisation de mot de passe par email
- OAuth Google / Apple
- Synchronisation multi-appareils des commandes

