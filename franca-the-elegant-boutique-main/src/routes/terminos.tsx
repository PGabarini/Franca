import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/config";

export const Route = createFileRoute("/terminos")({
  head: () => ({
    meta: [
      { title: `Términos y condiciones — ${BRAND.name}` },
      { name: "description", content: "Términos y condiciones de uso y compra en Franca." },
      { property: "og:title", content: `Términos y condiciones — ${BRAND.name}` },
      { property: "og:description", content: "Conocé las condiciones de uso, compra y envío en Franca." },
    ],
  }),
  component: TerminosPage,
});

function TerminosPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container-editorial py-12 md:py-20 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => router.history.back()} className="gap-2 mb-6 -ml-3">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>

        <span className="text-xs uppercase tracking-brand text-muted-foreground">Legal</span>
        <h1 className="font-serif text-4xl md:text-5xl mt-2 leading-tight">Términos y condiciones</h1>
        <p className="text-muted-foreground mt-5 leading-relaxed">
          Última actualización: {new Date().toLocaleDateString("es-AR", { year: "numeric", month: "long" })}.
        </p>

        <div className="mt-12 space-y-10 text-sm leading-relaxed">
          <section>
            <h2 className="font-serif text-2xl mb-3">1. Aceptación</h2>
            <p className="text-muted-foreground">
              Al navegar y comprar en {BRAND.name} aceptás los presentes términos. Si no estás de acuerdo, te pedimos no usar el sitio.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">2. Datos de la empresa</h2>
            <p className="text-muted-foreground">
              {BRAND.name} — [Razón social]. CUIT: [completar]. Domicilio: [completar]. Contacto: {BRAND.email}.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">3. Productos y precios</h2>
            <p className="text-muted-foreground">
              Los productos están sujetos a stock disponible. Los precios se expresan en pesos argentinos (ARS) e incluyen impuestos. Nos reservamos el derecho de modificar precios sin previo aviso; el precio aplicable es el vigente al momento de confirmar la compra.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">4. Pago</h2>
            <p className="text-muted-foreground">
              Aceptamos pago por transferencia bancaria. Una vez recibido el comprobante, confirmamos el pedido y coordinamos el envío.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">5. Envíos</h2>
            <p className="text-muted-foreground">
              Realizamos envíos a todo el país. El plazo y costo depende de la zona y se informa antes de finalizar la compra. {BRAND.name} no es responsable por demoras imputables al correo.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">6. Cambios y devoluciones</h2>
            <p className="text-muted-foreground">
              Consultá nuestra política completa en{" "}
              <Link to="/cambios-y-devoluciones" className="underline underline-offset-4 text-foreground">cambios y devoluciones</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">7. Propiedad intelectual</h2>
            <p className="text-muted-foreground">
              Todos los contenidos del sitio (textos, imágenes, logos, diseños) son propiedad de {BRAND.name} y están protegidos por las leyes de propiedad intelectual. Está prohibida su reproducción sin autorización.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">8. Datos personales</h2>
            <p className="text-muted-foreground">
              El tratamiento de datos se rige por nuestra{" "}
              <Link to="/privacidad" className="underline underline-offset-4 text-foreground">política de privacidad</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">9. Ley aplicable y jurisdicción</h2>
            <p className="text-muted-foreground">
              Estos términos se rigen por las leyes de la República Argentina. Cualquier controversia será sometida a los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
