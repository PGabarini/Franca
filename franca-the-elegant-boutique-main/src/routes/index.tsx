import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { CATEGORIES, productsQueryOptions } from "@/lib/products";
import { BRAND } from "@/lib/config";
import { ArrowRight, Truck, RefreshCw, ShieldCheck, MessageCircle } from "lucide-react";
import hero from "@/assets/editorial-franca.jpg";
import editorial from "@/assets/hero-franca.jpg";
import { siteImagesQueryOptions } from "@/lib/site-images";

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(productsQueryOptions());
    queryClient.ensureQueryData(siteImagesQueryOptions());
  },
  component: Index,
});

function Index() {
  const { data: products } = useSuspenseQuery(productsQueryOptions());
  const { data: siteImages } = useSuspenseQuery(siteImagesQueryOptions());
  const destacados = products.filter((p) => p.destacado).slice(0, 8);
  const heroImg = siteImages.home_hero?.url || hero;
  const heroAlt = siteImages.home_hero?.alt || "Editorial Franca otoño invierno 2026";
  const editorialImg = siteImages.home_editorial?.url || editorial;
  const editorialAlt = siteImages.home_editorial?.alt || "Campaña Franca";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* HERO — full-bleed editorial */}
        <section className="relative">
          <div className="relative w-full h-[85vh] md:h-[92vh] overflow-hidden bg-secondary">
            <img
              src={heroImg}
              alt={heroAlt}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-foreground/55 via-foreground/15 to-transparent" />

            <div className="relative z-10 h-full container-editorial flex items-end md:items-center pb-16 md:pb-0">
              <div className="max-w-xl text-cream fade-up">
                <span className="text-[10px] md:text-xs uppercase tracking-brand text-cream/90">
                  Otoño · Invierno 2026
                </span>
                <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.02] mt-5 text-balance text-cream">
                  La respuesta a no sé qué&nbsp;ponerme.
                </h1>
                <p className="mt-6 text-cream/90 leading-relaxed max-w-md text-sm md:text-base">
                  Una prenda clásica de Franca. Pensada para acompañarte cada día: materiales nobles, cortes precisos, durabilidad real.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Button asChild size="lg" className="bg-cream text-primary hover:bg-cream/90 rounded-none uppercase tracking-brand text-xs h-12 px-8">
                    <Link to="/catalogo">
                      Ver colección <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORÍAS — strip horizontal estilo Rapsodia */}
        <section className="border-y-2 border-primary/20 bg-primary/5">
          <div className="container-editorial py-5 overflow-x-auto">
            <div className="flex gap-6 md:gap-10 justify-start md:justify-center min-w-max items-center">
              <span className="text-[11px] md:text-xs uppercase tracking-brand text-primary/70 font-medium hidden md:inline-block pr-2 border-r border-primary/30">
                Categorías
              </span>
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  to="/catalogo"
                  search={{ categoria: cat }}
                  className="text-xs md:text-sm uppercase tracking-brand text-primary font-semibold hover:text-primary/70 transition-colors whitespace-nowrap"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* DESTACADOS */}
        <section className="container-editorial py-16 md:py-24">
          <div className="text-center mb-10 md:mb-14">
            <span className="text-[11px] uppercase tracking-brand text-muted-foreground">Selección</span>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl mt-4">Piezas destacadas</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-2 md:gap-x-4 gap-y-10 md:gap-y-14">
            {destacados.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-14 flex justify-center">
            <Button asChild size="lg" variant="outline" className="rounded-none uppercase tracking-brand text-xs h-12 px-10 border-foreground text-foreground hover:bg-foreground hover:text-background">
              <Link to="/catalogo">Ver toda la colección</Link>
            </Button>
          </div>
        </section>

        {/* EDITORIAL — bloque grande */}
        <section className="relative">
          <div className="grid md:grid-cols-2 items-stretch gap-0">
            <div className="aspect-[4/5] md:aspect-auto overflow-hidden">
              <img src={editorialImg} alt={editorialAlt} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div className="bg-secondary/40 px-6 md:px-20 py-16 md:py-24 flex flex-col justify-center">
              <span className="text-[11px] uppercase tracking-brand text-muted-foreground">Campaña AW26</span>
              <h2 className="font-serif text-4xl md:text-6xl mt-4 leading-[1.05]">
                Hecho para perdurar.
              </h2>
              <p className="text-muted-foreground mt-6 leading-relaxed max-w-md">
                Cada prenda Franca nace de un proceso pausado. Telas seleccionadas, talleres locales y un diseño que prioriza la silueta sobre la tendencia.
              </p>
              <div className="mt-10">
                <Link
                  to="/catalogo"
                  className="inline-flex items-center gap-3 text-xs uppercase tracking-brand border-b border-foreground pb-1 hover:text-primary hover:border-primary transition-colors"
                >
                  Descubrir la colección <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFICIOS */}
        <section className="border-t border-border bg-background">
          <div className="container-editorial grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {[
              { Icon: Truck, title: "Envíos a todo el país", text: "Despachamos en 24/48hs hábiles." },
              { Icon: RefreshCw, title: "Cambios sin vueltas", text: "Hasta 15 días desde la compra." },
              { Icon: ShieldCheck, title: "Atención cercana", text: "Te acompañamos por WhatsApp." },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="py-12 md:py-16 px-4 md:px-10 text-center">
                <Icon className="h-5 w-5 mx-auto mb-4 text-primary" />
                <h3 className="font-serif text-xl">{title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
