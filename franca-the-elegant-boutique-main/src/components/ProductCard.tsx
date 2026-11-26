import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";
import { FavoriteButton } from "@/components/FavoriteButton";
import { etiquetaStock, sinStock } from "@/lib/stock";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const etiqueta = etiquetaStock(product.stock);
  const agotado = sinStock(product.stock);
  return (
    <Link
      to="/producto/$slug"
      params={{ slug: product.slug }}
      className="group block"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary/50 mb-3">
        <img
          src={product.imagen_url}
          alt={product.nombre}
          loading="lazy"
          className={cn(
            "h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]",
            agotado && "opacity-60 grayscale-[40%]",
          )}
        />
        {etiqueta && (
          <span
            data-testid="etiqueta-stock"
            className={cn(
              "absolute top-3 left-3 px-2 py-1 text-[9px] uppercase tracking-brand",
              agotado ? "bg-foreground text-background" : "bg-background/95",
            )}
          >
            {etiqueta}
          </span>
        )}
        <div className="absolute top-2 right-2">
          <FavoriteButton productoId={product.id} size="sm" onSurface />
        </div>
      </div>
      <div className="px-1 text-center">
        <h3 className="text-sm font-normal tracking-wide">{product.nombre}</h3>
        <p className="text-[10px] uppercase tracking-brand text-muted-foreground mt-1">{product.categoria}</p>
        {product.colores.length > 0 && (
          <p className="text-[10px] uppercase tracking-brand text-muted-foreground mt-1">
            {product.colores.length === 1
              ? product.colores[0]
              : `${product.colores.length} colores`}
          </p>
        )}
        <p className="text-sm tabular-nums mt-2">{formatPrice(product.precio)}</p>
      </div>
    </Link>
  );
}
