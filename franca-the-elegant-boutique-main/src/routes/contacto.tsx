import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Mail, Instagram, Send, Loader2, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRAND } from "@/lib/config";
import { useAuth } from "@/lib/auth";
import { contactoSchema, enviarMensajeContacto } from "@/lib/contacto";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: `Contacto — ${BRAND.name}` },
      { name: "description", content: "Escribinos por consultas, pedidos, cambios o cualquier duda. Te respondemos en 24-48hs." },
      { property: "og:title", content: `Contacto — ${BRAND.name}` },
      { property: "og:description", content: "Estamos para ayudarte. Mandanos tu consulta y te respondemos a la brevedad." },
    ],
  }),
  component: ContactoPage,
});

const ASUNTOS = [
  "Consulta general",
  "Pedido existente",
  "Cambios y devoluciones",
  "Talles y stock",
  "Otro",
] as const;

function ContactoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    asunto: "",
    mensaje: "",
    website: "", // honeypot
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.email && !form.email) {
      setForm((f) => ({ ...f, email: user.email ?? "" }));
    }
  }, [user]);

  const update = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.website) return; // honeypot
    const parsed = contactoSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      await enviarMensajeContacto(parsed.data);
      toast.success("Mensaje enviado", {
        description: "Te respondemos en 24-48hs hábiles.",
      });
      setForm({ nombre: "", email: user?.email ?? "", telefono: "", asunto: "", mensaje: "", website: "" });
    } catch (err) {
      toast.error("No pudimos enviar tu mensaje", {
        description: err instanceof Error ? err.message : "Probá nuevamente en unos minutos.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container-editorial py-12 md:py-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.history.back()}
          className="gap-2 mb-6 -ml-3"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <div className="grid md:grid-cols-[1fr_1.5fr] gap-12 lg:gap-20">
        <div>
          <span className="text-xs uppercase tracking-brand text-muted-foreground">Contacto</span>
          <h1 className="font-serif text-4xl md:text-5xl mt-2 leading-tight">
            Estamos para ayudarte
          </h1>
          <p className="text-muted-foreground mt-5 leading-relaxed">
            Escribinos por consultas sobre productos, pedidos, cambios o lo que necesites.
            Respondemos en 24-48hs hábiles.
          </p>
          <div className="mt-8 space-y-3 text-sm">
            <a href={`mailto:${BRAND.email}`} className="flex items-center gap-3 hover:text-primary transition-colors">
              <Mail className="h-4 w-4" /> {BRAND.email}
            </a>
            <a href="https://www.instagram.com/franca2001_/" target="_blank" rel="noopener noreferrer" >
            <div className="flex items-center gap-3 text-muted-foreground">
              
              <Instagram className="h-4 w-4" /> {BRAND.instagram}
              
            </div>
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Honeypot */}
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
            aria-hidden="true"
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => update("nombre", e.target.value)}
                maxLength={80}
                disabled={submitting}
                aria-invalid={!!errors.nombre}
              />
              {errors.nombre && <p className="text-xs text-destructive mt-1">{errors.nombre}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                maxLength={255}
                disabled={submitting}
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefono">Teléfono (opcional)</Label>
              <Input
                id="telefono"
                value={form.telefono}
                onChange={(e) => update("telefono", e.target.value)}
                maxLength={30}
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="asunto">Asunto *</Label>
              <Select value={form.asunto} onValueChange={(v) => update("asunto", v)} disabled={submitting}>
                <SelectTrigger id="asunto" aria-invalid={!!errors.asunto}>
                  <SelectValue placeholder="Elegí un tema" />
                </SelectTrigger>
                <SelectContent>
                  {ASUNTOS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.asunto && <p className="text-xs text-destructive mt-1">{errors.asunto}</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="mensaje">Mensaje *</Label>
              <span className="text-[10px] text-muted-foreground">{form.mensaje.length}/2000</span>
            </div>
            <Textarea
              id="mensaje"
              value={form.mensaje}
              onChange={(e) => update("mensaje", e.target.value)}
              maxLength={2000}
              rows={6}
              disabled={submitting}
              aria-invalid={!!errors.mensaje}
            />
            {errors.mensaje && <p className="text-xs text-destructive mt-1">{errors.mensaje}</p>}
          </div>

          <Button type="submit" disabled={submitting} className="w-full sm:w-auto gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? "Enviando…" : "Enviar mensaje"}
          </Button>
        </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
