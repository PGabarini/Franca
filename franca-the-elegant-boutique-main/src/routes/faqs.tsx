import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import { BRAND } from "@/lib/config";

export const Route = createFileRoute("/faqs")({
  head: () => ({
    meta: [
      { title: `Preguntas frecuentes — ${BRAND.name}` },
      { name: "description", content: "Respuestas a las preguntas más comunes sobre pedidos, envíos, cambios y cuenta en Franca." },
      { property: "og:title", content: `Preguntas frecuentes — ${BRAND.name}` },
      { property: "og:description", content: "Encontrá respuestas rápidas sobre pedidos, envíos, cambios y más." },
    ],
  }),
  component: FaqsPage,
});

type Faq = { q: string; a: React.ReactNode };
type Grupo = { titulo: string; items: Faq[] };

const GRUPOS: Grupo[] = [
  {
    titulo: "Pedidos y pago",
    items: [
      { q: "¿Cómo hago un pedido?", a: "Elegí tu prenda, talle y agregala al carrito. Después seguí los pasos del checkout para completar tus datos y método de pago." },
      { q: "¿Qué métodos de pago aceptan?", a: "Por el momento operamos con transferencia bancaria. Una vez recibido el comprobante, confirmamos tu pedido." },
      { q: "¿Cómo envío el comprobante?", a: "Al finalizar la compra te mostramos los datos bancarios y un canal directo por WhatsApp para enviar el comprobante." },
      { q: "¿Puedo modificar o cancelar mi pedido?", a: <>Sí, mientras no esté despachado. Escribinos a <Link to="/contacto" className="underline underline-offset-4">contacto</Link> lo antes posible.</> },
    ],
  },
  {
    titulo: "Envíos",
    items: [
      { q: "¿A dónde envían?", a: "Hacemos envíos a todo el país." },
      { q: "¿Cuánto tarda el envío?", a: "Una vez confirmado el pago, los envíos al AMBA tardan 2-4 días hábiles y al interior 4-8 días hábiles." },
      { q: "¿Cuánto cuesta el envío?", a: "El costo depende de la zona y se calcula al momento del checkout." },
    ],
  },
  {
    titulo: "Cambios y talles",
    items: [
      { q: "¿Puedo cambiar el talle?", a: <>Sí, dentro de los 15 días de recibido. Mirá la <Link to="/cambios-y-devoluciones" className="underline underline-offset-4">política completa</Link>.</> },
      { q: "¿Cómo sé qué talle elegir?", a: "En cada producto vas a encontrar una guía de talles con medidas de referencia. Si tenés dudas, escribinos antes de comprar." },
      { q: "¿Y si la prenda llega con un defecto?", a: <>Te pedimos disculpas. Escribinos por <Link to="/contacto" className="underline underline-offset-4">contacto</Link> con fotos y resolvemos el cambio sin costo.</> },
    ],
  },
  {
    titulo: "Cuenta",
    items: [
      { q: "¿Necesito una cuenta para comprar?", a: "No es obligatorio, pero te ayuda a guardar favoritos y agilizar futuras compras." },
      { q: "¿Cómo recupero mi contraseña?", a: "Escribinos a contacto y te ayudamos a restablecer el acceso." },
      { q: "¿Puedo dar de baja mi cuenta?", a: <>Sí. Escribinos a <Link to="/contacto" className="underline underline-offset-4">contacto</Link> y procesamos la baja según nuestra <Link to="/privacidad" className="underline underline-offset-4">política de privacidad</Link>.</> },
    ],
  },
];

function FaqsPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container-editorial py-12 md:py-20 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => router.history.back()} className="gap-2 mb-8 -ml-3">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>

        <span className="text-xs uppercase tracking-brand text-muted-foreground">Ayuda</span>
        <h1 className="font-serif text-4xl md:text-5xl mt-2 leading-tight">Preguntas frecuentes</h1>
        <p className="text-muted-foreground mt-5 leading-relaxed">
          ¿No encontrás lo que buscás?{" "}
          <Link to="/contacto" className="underline underline-offset-4 text-foreground">Escribinos</Link>{" "}
          y te respondemos en 24-48hs.
        </p>

        <div className="mt-12 space-y-12">
          {GRUPOS.map((g) => (
            <section key={g.titulo}>
              <h2 className="font-serif text-2xl mb-2">{g.titulo}</h2>
              <Accordion type="single" collapsible className="w-full">
                {g.items.map((it, i) => (
                  <AccordionItem key={i} value={`${g.titulo}-${i}`}>
                    <AccordionTrigger>{it.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {it.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
