import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useDeferredValue, useMemo } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { matchesQuery, productsQueryOptions, type Product } from "@/lib/products";
import { categoriasQueryOptions } from "@/lib/categorias";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

const searchSchema = z.object({
  categoria: fallback(z.string(), "all").default("all"),
  talle: fallback(z.string(), "").default(""),
  orden: fallback(z.enum(["destacados", "precio-asc", "precio-desc"]), "destacados").default("destacados"),
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/catalogo")({
  validateSearch: zodValidator(searchSchema),
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(productsQueryOptions());
  },
  head: () => ({
    meta: [
      { title: "Colección — Franca" },
      { name: "description", content: "Explorá la colección completa de Franca." },
      { property: "og:title", content: "Colección — Franca" },
    ],
  }),
  component: Catalogo,
});

const TALLES = ["XS", "S", "M", "L", "XL"];

function Catalogo() {
  const { categoria, talle, orden, q } = Route.useSearch();
  const navigate = useNavigate({ from: "/catalogo" });
  const { data: products } = useSuspenseQuery(productsQueryOptions());
  const { data: categorias = [] } = useQuery(categoriasQueryOptions());

  const set = (patch: Partial<{ categoria: string; talle: string; orden: string; q: string }>) =>
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, ...patch }) });

  const deferredQ = useDeferredValue(q);

  const filtered = useMemo(() => {
    let list: Product[] = products.slice();
    if (categoria !== "all") list = list.filter((p) => p.categoria === categoria);
    if (talle) list = list.filter((p) => p.talles.includes(talle));
    if (deferredQ.trim()) list = list.filter((p) => matchesQuery(p, deferredQ));
    if (orden === "precio-asc") list.sort((a, b) => a.precio - b.precio);
    else if (orden === "precio-desc") list.sort((a, b) => b.precio - a.precio);
    else list.sort((a, b) => Number(b.destacado) - Number(a.destacado));
    return list;
  }, [products, categoria, talle, orden, deferredQ]);

  const sugerencias = useMemo(
    () => products.filter((p) => p.destacado).slice(0, 4),
    [products],
  );

  const hasFilters = categoria !== "all" || talle !== "" || orden !== "destacados" || q !== "";
  const resetAll = () => navigate({ search: {} as never });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container-editorial py-12 md:py-20">
        <div className="text-center mb-10 md:mb-14">
          <span className="text-xs uppercase tracking-brand text-muted-foreground">Tienda</span>
          <h1 className="font-serif text-4xl md:text-6xl mt-3">Colección</h1>
        </div>

        <div className="border-y border-border py-5 mb-10 grid gap-4 md:grid-cols-[1fr_auto_auto_auto] items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, color, categoría…"
              value={q}
              onChange={(e) => set({ q: e.target.value })}
              className="pl-9 pr-9 bg-transparent border-border rounded-none h-10"
            />
            {q && (
              <button
                type="button"
                onClick={() => set({ q: "" })}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select label="Categoría" value={categoria} onChange={(v) => set({ categoria: v })}
            options={[["all", "Todas"], ...categorias.map((c) => [c.nombre, c.nombre] as [string, string])]} />
          <Select label="Talle" value={talle} onChange={(v) => set({ talle: v })}
            options={[["", "Todos"], ...TALLES.map((t) => [t, t] as [string, string])]} />
          <Select label="Orden" value={orden} onChange={(v) => set({ orden: v })}
            options={[
              ["destacados", "Destacados"],
              ["precio-asc", "Precio ↑"],
              ["precio-desc", "Precio ↓"],
            ]} />
        </div>

        <p className="text-xs text-muted-foreground mb-6">{filtered.length} piezas</p>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-serif text-2xl">
              {q.trim()
                ? <>No encontramos piezas para «<span className="text-primary">{q}</span>»</>
                : "No hay piezas que coincidan con esos filtros."}
            </p>
            {hasFilters && (
              <div className="mt-6">
                <Button variant="outline" onClick={resetAll} className="rounded-none uppercase tracking-brand text-xs h-10 px-6">
                  Limpiar filtros
                </Button>
              </div>
            )}

            {sugerencias.length > 0 && (
              <div className="mt-16 text-left">
                <div className="text-center mb-8">
                  <span className="text-[11px] uppercase tracking-brand text-muted-foreground">Quizás te interese</span>
                  <h2 className="font-serif text-3xl md:text-4xl mt-2">Piezas destacadas</h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
                  {sugerencias.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Select({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground text-xs uppercase tracking-brand">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border border-border h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
