import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { type Product, formatFCFA } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const allImages = [product.image, ...(product.images ?? [])].filter(Boolean);

  useEffect(() => {
    if (!isHovered || allImages.length <= 1) {
      setCurrentIdx(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % allImages.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isHovered, allImages.length]);

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <Link
      to="/produit/$id"
      params={{ id: product.id }}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-white/50">
        <img
          src={allImages[currentIdx]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-contain mix-blend-multiply transition-opacity duration-500"
        />
        {allImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {allImages.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === currentIdx ? "w-4 bg-primary" : "w-1 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
            -{discount}%
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{product.category}</p>
        <h3 className="font-medium text-foreground line-clamp-1">{product.name}</h3>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg font-bold">{formatFCFA(product.price)}</span>
          {product.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatFCFA(product.oldPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
