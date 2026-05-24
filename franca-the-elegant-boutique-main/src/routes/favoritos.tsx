import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { favoritosQueryOptions } from "@/lib/favoritos";
import { productsQueryOptions } from "@/lib/products";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/favoritos")({
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(productsQueryOptions());
  },
  head: () => ({
    meta: [
      { title: "Favoritos — Franca" },
      { name: "description", content: "Tus prendas guardadas en Franca." },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">{error.message}</p>
    </div>
  ),
  component: FavoritosPage,
});

function FavoritosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { data: productos } = useSuspenseQuery(productsQueryOptions());
  const { data: favIds = [], isLoading: loadingFavs } = useQuery(favoritosQueryOptions(user?.id));

  const items = productos.filter((p) => favIds.includes(p.id));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container-editorial py-12 md:py-16">
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-brand text-muted-foreground">Tu lista</span>
          <h1 className="font-serif text-4xl md:text-5xl mt-2">Favoritos</h1>
        </div>

        {loading || loadingFavs ? (
          <p className="text-center text-muted-foreground">Cargando…</p>
        ) : !user ? (
          <div className="text-center py-16 max-w-md mx-auto">
            <Heart className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-6">
              Iniciá sesión para guardar y ver tus prendas favoritas.
            </p>
            <Button asChild variant="hero" size="lg">
              <Link to="/login">Iniciar sesión</Link>
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 max-w-md mx-auto">
            <Heart className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-6">
              Todavía no agregaste favoritos. Explorá la colección y guardá lo que más te guste.
            </p>
            <Button asChild variant="hero" size="lg">
              <Link to="/catalogo">Ver colección</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
            {items.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
