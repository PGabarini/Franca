import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/config";

export const Route = createFileRoute("/cambios-y-devoluciones")({
  head: () => ({
    meta: [
      { title: `Cambios y devoluciones — ${BRAND.name}` },
      { name: "description", content: "Política de cambios y devoluciones de Franca. Plazos, condiciones y cómo iniciar el proceso." },
      { property: "og:title", content: `Cambios y devoluciones — ${BRAND.name}` },
      { property: "og:description", content: "Conocé los plazos, condiciones y pasos para cambiar o devolver tu prenda." },
    ],
  }),
  component: CambiosPage,
});

function CambiosPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container-editorial py-12 md:py-20 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => router.history.back()} className="gap-2 mb-6 -ml-3">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>

        <span className="text-xs uppercase tracking-brand text-muted-foreground">Información</span>
        <h1 className="font-serif text-4xl md:text-5xl mt-2 leading-tight">Cambios y devoluciones</h1>
        <p className="text-muted-foreground mt-5 leading-relaxed">
          Queremos que ames lo que recibís. Si algo no te queda como esperabas, te ayudamos a cambiarlo.
        </p>

        <div className="mt-12 space-y-10 text-sm leading-relaxed">
          <section>
            <h2 className="font-serif text-2xl mb-3">Plazos</h2>
            <p className="text-muted-foreground">
              Tenés <strong className="text-foreground">15 días corridos</strong> desde la recepción del pedido para solicitar un cambio o devolución.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">Condiciones</h2>
            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
              <li>La prenda debe estar sin uso, sin lavar y con sus etiquetas originales.</li>
              <li>Debe presentarse en su empaque original cuando sea posible.</li>
              <li>Conservá el comprobante de compra o número de pedido.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">Qué no se cambia</h2>
            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
              <li>Ropa interior y trajes de baño, por motivos de higiene.</li>
              <li>Prendas adquiridas en liquidación o promociones especiales (salvo defecto de fábrica).</li>
              <li>Accesorios personalizados.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">Cómo iniciar el cambio</h2>
            <ol className="space-y-2 text-muted-foreground list-decimal pl-5">
              <li>Escribinos a <Link to="/contacto" className="underline underline-offset-4 text-foreground">contacto</Link> indicando tu número de pedido y el motivo.</li>
              <li>Te confirmamos disponibilidad del talle/color de reemplazo o el procedimiento de devolución.</li>
              <li>Coordinamos el retiro o reenvío de la prenda.</li>
            </ol>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">Costos de envío</h2>
            <p className="text-muted-foreground">
              El primer cambio por talle dentro del AMBA es sin costo. Devoluciones y cambios al interior del país tienen un costo de envío a cargo del cliente, salvo defecto de fábrica.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">Reembolsos</h2>
            <p className="text-muted-foreground">
              Para pagos por transferencia, los reembolsos se acreditan en un plazo de 5 a 10 días hábiles desde la recepción de la prenda y la verificación de su estado.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">¿Dudas?</h2>
            <p className="text-muted-foreground">
              Estamos para ayudarte. <Link to="/contacto" className="underline underline-offset-4 text-foreground">Escribinos</Link> y te respondemos en 24-48hs hábiles.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
