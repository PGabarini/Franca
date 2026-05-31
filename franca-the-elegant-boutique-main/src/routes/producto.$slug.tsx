import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ProductQuestions } from "@/components/ProductQuestions";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ProductGallery } from "@/components/ProductGallery";
import { SizeGuide } from "@/components/SizeGuide";
import {
  productQueryOptions, productsQueryOptions, formatPrice,
} from "@/lib/products";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { ChevronLeft, ShoppingBag, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/producto/$slug")({
  loader: async ({ params, context: { queryClient } }) => {
    const product = await queryClient.ensureQueryData(productQueryOptions(params.slug));
    if (!product) throw notFound();
    queryClient.ensureQueryData(productsQueryOptions());
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.nombre ?? "Producto"} — Franca` },
      { name: "description", content: loaderData?.product.descripcion ?? "" },
      { property: "og:title", content: `${loaderData?.product.nombre ?? ""} — Franca` },
      { property: "og:description", content: loaderData?.product.descripcion ?? "" },
      { property: "og:image", content: loaderData?.product.imagen_url ?? "" },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Producto no encontrado.</p>
        <Link to="/catalogo" className="underline mt-4 inline-block">Volver al catálogo</Link>
      </div>
    </div>
  ),
  component: ProductoPage,
});

function ProductoPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQueryOptions(slug));
  const { data: catalog } = useSuspenseQuery(productsQueryOptions());

  if (!product) return null;

  const [talle, setTalle] = useState(product.talles[0]);
  const [color, setColor] = useState<string | undefined>(product.colores[0]);
  const cart = useCart(catalog);
  const navigate = useNavigate();

  const relacionados = catalog
    .filter((p) => p.categoria === product.categoria && p.id !== product.id)
    .slice(0, 4);

  const handleAdd = () => {
    cart.add(product.id, talle, 1, color);
    toast.success("Agregado al carrito", {
      description: `${product.nombre} · Talle ${talle}${color ? ` · ${color}` : ""}`,
    });
  };

  const handleBuyNow = () => {
    navigate({
      to: "/carrito",
      search: { checkout: true, buyNow: product.id, talle, color },
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container-editorial pt-6">
          <Link to="/catalogo" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Volver
          </Link>
        </div>

        <section className="product-enter container-editorial grid md:grid-cols-2 gap-10 md:gap-16 py-8 md:py-12 w-full max-w-full overflow-hidden">
          <ProductGallery imagenes={product.imagenes} nombre={product.nombre} />
          <div className="md:py-8 min-w-0 w-full overflow-hidden">
            <span className="text-xs uppercase tracking-brand text-muted-foreground">{product.categoria}</span>
            <h1 className="font-serif text-4xl md:text-5xl mt-3 break-words hyphens-auto w-full">
              {product.nombre}
            </h1>
            <p className="text-2xl mt-4 tabular-nums">{formatPrice(product.precio)}</p>

            <p className="mt-8 text-muted-foreground leading-relaxed">{product.descripcion}</p>

            {product.colores.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-brand">
                    Color {color ? <span className="text-muted-foreground normal-case tracking-normal">· {color}</span> : null}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colores.map((c: string) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        "h-11 px-4 border text-sm transition-colors",
                        color === c
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-brand">Talle</span>
                <div className="flex items-center gap-3">
                  <SizeGuide talles={product.talles} medidas={product.talles_medidas} categoria={product.categoria} />
                  <span className="text-xs text-muted-foreground">{product.stock} en stock</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.talles.map((t: string) => (
                  <button
                    key={t}
                    onClick={() => setTalle(t)}
                    className={cn(
                      "min-w-12 h-11 px-4 border text-sm transition-colors",
                      talle === t
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <div className="flex gap-3">
                <Button variant="hero" size="lg" onClick={handleAdd} className="flex-1">
                  <ShoppingBag className="h-4 w-4" /> Agregar al carrito
                </Button>
                <FavoriteButton productoId={product.id} size="lg" />
              </div>
              <Button variant="hero" size="lg" onClick={handleBuyNow} className="w-full">
                <Zap className="h-4 w-4" /> Comprar ahora
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 text-xs text-muted-foreground border-t border-border pt-6">
              <div>
                <strong className="text-foreground block mb-1">{product.colores.length > 1 ? "Colores" : "Color"}</strong>
                {product.colores.length > 0 ? product.colores.join(" · ") : "—"}
              </div>
              <div><strong className="text-foreground block mb-1">Envíos</strong>A todo el país</div>
            </div>
          </div>
        </section>

        <ProductQuestions productoId={product.id} />

        {relacionados.length > 0 && (
          <section className="container-editorial py-16 md:py-24 border-t border-border mt-12">
            <h2 className="font-serif text-3xl text-center mb-10">También te puede gustar</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
              {relacionados.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
