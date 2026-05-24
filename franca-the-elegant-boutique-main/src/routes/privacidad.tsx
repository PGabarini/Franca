import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/config";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: `Política de privacidad — ${BRAND.name}` },
      { name: "description", content: "Cómo recolectamos, usamos y protegemos tus datos personales en Franca." },
      { property: "og:title", content: `Política de privacidad — ${BRAND.name}` },
      { property: "og:description", content: "Tu privacidad nos importa. Conocé cómo cuidamos tus datos." },
    ],
  }),
  component: PrivacidadPage,
});

function PrivacidadPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container-editorial py-12 md:py-20 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => router.history.back()} className="gap-2 mb-6 -ml-3">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>

        <span className="text-xs uppercase tracking-brand text-muted-foreground">Legal</span>
        <h1 className="font-serif text-4xl md:text-5xl mt-2 leading-tight">Política de privacidad</h1>
        <p className="text-muted-foreground mt-5 leading-relaxed">
          Tu privacidad es importante para nosotros. Esta política explica qué datos recolectamos, para qué los usamos y cuáles son tus derechos.
        </p>

        <div className="mt-12 space-y-10 text-sm leading-relaxed">
          <section>
            <h2 className="font-serif text-2xl mb-3">Qué datos recolectamos</h2>
            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
              <li>Datos de contacto: nombre, email y teléfono.</li>
              <li>Datos de envío: dirección postal.</li>
              <li>Datos de cuenta: email y contraseña (encriptada).</li>
              <li>Datos de compra: productos adquiridos, fechas, comprobantes de pago.</li>
              <li>Datos técnicos básicos de navegación (cookies esenciales).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">Para qué los usamos</h2>
            <ul className="space-y-2 text-muted-foreground list-disc pl-5">
              <li>Procesar y enviar tus pedidos.</li>
              <li>Responder tus consultas a través del formulario de contacto.</li>
              <li>Gestionar tu cuenta y favoritos.</li>
              <li>Mejorar nuestro sitio y catálogo.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">Con quién compartimos</h2>
            <p className="text-muted-foreground">
              Solo compartimos tus datos con proveedores estrictamente necesarios: empresas de correo para hacer llegar tu pedido y servicios de hosting. Nunca vendemos ni cedemos tus datos a terceros con fines comerciales.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">Cookies</h2>
            <p className="text-muted-foreground">
              Usamos cookies esenciales para el funcionamiento del sitio (sesión, carrito, favoritos). No usamos cookies de publicidad de terceros.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">Tus derechos</h2>
            <p className="text-muted-foreground">
              Podés acceder, rectificar o solicitar la baja de tus datos en cualquier momento escribiéndonos a {BRAND.email}. Conservamos los datos de pedidos por el tiempo que exija la legislación fiscal vigente.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-3">Contacto</h2>
            <p className="text-muted-foreground">
              Por consultas sobre privacidad, escribinos a {BRAND.email} o desde nuestro{" "}
              <Link to="/contacto" className="underline underline-offset-4 text-foreground">formulario de contacto</Link>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
