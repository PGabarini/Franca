import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useState, useMemo, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useCart, crearPedido } from "@/lib/cart";
import { validarCodigo, calcularDescuento, type DescuentoValido } from "@/lib/descuentos";
import { formatPrice, productsQueryOptions } from "@/lib/products";
import { datosBancariosQueryOptions } from "@/lib/datos-bancarios";
import { localesRetiroQueryOptions } from "@/lib/locales-retiro";
import { subirComprobante } from "@/lib/pedidos";
import {
  COSTO_ENVIO, SUCURSALES, clienteSchema, direccionSchema, formatDireccion,
  buildResumenWhatsApp, type MetodoEntrega, type DatosCliente, type DatosDireccion, type Sucursal,
} from "@/lib/checkout";

import {
  Minus, Plus, Trash2, MessageCircle, ShoppingBag, Loader2, Copy, CheckCircle2,
  ArrowLeft, Upload, Truck, Store, FileText, X, MapPin, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/carrito")({
  validateSearch: (s: Record<string, unknown>): { checkout?: boolean; buyNow?: string; talle?: string; color?: string } => ({
    checkout: s.checkout === "1" || s.checkout === 1 || s.checkout === true ? true : undefined,
    buyNow: typeof s.buyNow === "string" && s.buyNow.length > 0 ? s.buyNow : undefined,
    talle: typeof s.talle === "string" && s.talle.length > 0 ? s.talle : undefined,
    color: typeof s.color === "string" && s.color.length > 0 ? s.color : undefined,
  }),
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(productsQueryOptions());
    queryClient.ensureQueryData(localesRetiroQueryOptions());
  },

  head: () => ({
    meta: [
      { title: "Checkout — Franca" },
      { name: "description", content: "Finalizá tu pedido Franca paso a paso." },
    ],
  }),
  component: Carrito,
});

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = carrito, 1..5 checkout, 6 = confirmacion

const STEP_LABELS = ["Datos", "Entrega", "Dirección", "Resumen", "Pago"];

function Carrito() {
  const { data: catalog } = useSuspenseQuery(productsQueryOptions());
  const { data: localesDB } = useSuspenseQuery(localesRetiroQueryOptions());
  const sucursales: Sucursal[] = useMemo(() => {
    if (!localesDB || localesDB.length === 0) return SUCURSALES;
    return localesDB.map((l) => ({
      id: l.id,
      nombre: l.nombre,
      direccion: [l.direccion, l.ciudad, l.provincia].filter(Boolean).join(", "),
      horario: l.horarios || "Consultanos los horarios",
    }));
  }, [localesDB]);
  const cart = useCart(catalog);
  const { checkout, buyNow, talle: buyNowTalle, color: buyNowColor } = Route.useSearch();


  const buyNowProduct = useMemo(
    () => (buyNow ? catalog.find((p) => p.id === buyNow) : undefined),
    [buyNow, catalog],
  );
  const isBuyNow = !!buyNowProduct && !!buyNowTalle;

  const checkoutItems = useMemo(() => {
    if (isBuyNow && buyNowProduct && buyNowTalle) {
      return [{ productId: buyNowProduct.id, product: buyNowProduct, talle: buyNowTalle, color: buyNowColor, cantidad: 1 }];
    }
    return cart.items;
  }, [isBuyNow, buyNowProduct, buyNowTalle, buyNowColor, cart.items]);

  const [step, setStep] = useState<Step>(checkout || isBuyNow ? 1 : 0);

  const [cliente, setCliente] = useState<DatosCliente>({ nombre: "", email: "", telefono: "" });
  const [metodo, setMetodo] = useState<MetodoEntrega | null>(null);
  const [sucursalId, setSucursalId] = useState<string>("");
  const [direccion, setDireccion] = useState<DatosDireccion>({
    calle: "", numero: "", piso: "", ciudad: "", provincia: "", cp: "", referencias: "",
  });

  // Código de descuento
  const [codigoDescuento, setCodigoDescuento] = useState<DescuentoValido | null>(null);

  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [pedidoSnapshot, setPedidoSnapshot] = useState<{
    items: typeof checkoutItems; subtotal: number; envio: number; descuento: number; total: number;
    cliente: DatosCliente; metodo: MetodoEntrega; direccion?: DatosDireccion; sucursal?: Sucursal;
    codigo?: string | null;
  } | null>(null);
  const [comprobanteSubido, setComprobanteSubido] = useState(false);

  const sucursal = useMemo(() => sucursales.find((s) => s.id === sucursalId), [sucursales, sucursalId]);
  const subtotal = checkoutItems.reduce((acc, i) => acc + i.product.precio * i.cantidad, 0);
  const envio = metodo === "envio" ? COSTO_ENVIO : 0;
  const descuento = codigoDescuento ? calcularDescuento(subtotal, codigoDescuento) : 0;
  const total = Math.max(0, subtotal - descuento) + envio;

  const goNext = () => setStep((s) => (Math.min(6, s + 1) as Step));
  const goBack = () => setStep((s) => (Math.max(isBuyNow ? 1 : 0, s - 1) as Step));

  const confirmarPedido = async () => {
    try {
      const direccionEnvio =
        metodo === "envio" ? formatDireccion(direccion) : `Retiro en ${sucursal?.nombre} — ${sucursal?.direccion}`;
      const notas = [
        metodo === "envio"
          ? `Envío a domicilio (${formatPrice(COSTO_ENVIO)})`
          : `Retiro en ${sucursal?.nombre}`,
        `Subtotal: ${formatPrice(subtotal)} · Envío: ${envio > 0 ? formatPrice(envio) : "sin cargo"}${descuento > 0 ? ` · Descuento: -${formatPrice(descuento)}` : ""} · Total: ${formatPrice(total)}`,
        isBuyNow ? "Compra rápida (Comprar ahora)" : "",
      ].filter(Boolean).join("\n");
      const id = await crearPedido({
        items: checkoutItems,
        total,
        cliente_nombre: cliente.nombre.trim(),
        cliente_telefono: cliente.telefono?.trim() || undefined,
        cliente_email: cliente.email.trim(),
        direccion_envio: direccionEnvio,
        notas,
        codigo_descuento: codigoDescuento?.codigo,
      });
      setPedidoId(id);
      setPedidoSnapshot({
        items: checkoutItems, subtotal, envio, descuento, total,
        cliente, metodo: metodo!, direccion: metodo === "envio" ? direccion : undefined, sucursal,
        codigo: codigoDescuento?.codigo ?? null,
      });
      setStep(5);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Intentá nuevamente.";
      toast.error("No pudimos crear el pedido", { description: msg });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container-editorial py-8 md:py-14">
        {/* Step 0 = carrito */}
        {step === 0 && (
          <>
            <div className="text-center mb-10">
              <span className="text-xs uppercase tracking-brand text-muted-foreground">Tu selección</span>
              <h1 className="font-serif text-4xl md:text-6xl mt-3">Carrito</h1>
            </div>
            <PasoCarrito cart={cart} onContinuar={() => setStep(1)} />
          </>
        )}

        {/* Steps 1..4: checkout */}
        {step >= 1 && step <= 4 && (
          <div className="max-w-3xl mx-auto">
            <ProgressHeader step={step} />
            <div key={step} className="animate-in fade-in slide-in-from-right-4 duration-300">
              {step === 1 && (
                <Paso1Cliente
                  value={cliente} onChange={setCliente}
                  onBack={() => setStep(isBuyNow ? 1 : 0)} onNext={goNext}
                />
              )}
              {step === 2 && (
                <Paso2Metodo
                  value={metodo} onChange={setMetodo}
                  sucursales={sucursales}
                  onBack={goBack} onNext={goNext}
                />
              )}
              {step === 3 && (
                <Paso3Direccion
                  metodo={metodo!}
                  sucursales={sucursales}
                  direccion={direccion} setDireccion={setDireccion}
                  sucursalId={sucursalId} setSucursalId={setSucursalId}
                  onBack={goBack} onNext={goNext}
                />
              )}

              {step === 4 && (
                <Paso4Resumen
                  items={checkoutItems}
                  cliente={cliente} metodo={metodo!} direccion={direccion} sucursal={sucursal}
                  subtotal={subtotal} envio={envio} descuento={descuento} total={total}
                  codigoDescuento={codigoDescuento} setCodigoDescuento={setCodigoDescuento}
                  onBack={goBack} onConfirm={confirmarPedido}
                />
              )}
            </div>
          </div>
        )}

        {/* Step 5 = pago */}
        {step === 5 && pedidoId && pedidoSnapshot && (
          <div className="max-w-3xl mx-auto">
            <ProgressHeader step={5} />
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <Paso5Pago
                pedidoId={pedidoId}
                snapshot={pedidoSnapshot}
                comprobanteSubido={comprobanteSubido}
                onUploaded={() => setComprobanteSubido(true)}
                onFinalizar={() => { if (!isBuyNow) cart.clear(); setStep(6); }}
              />
            </div>
          </div>
        )}

        {/* Step 6 = listo */}
        {step === 6 && pedidoId && (
          <Confirmacion pedidoId={pedidoId} />
        )}
      </main>
      <Footer />
    </div>
  );
}

/* ===================== Progress ===================== */

function ProgressHeader({ step }: { step: number }) {
  const value = (step / 5) * 100;
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="text-xs uppercase tracking-brand text-muted-foreground hover:text-foreground"
        >
          ← Atrás
        </button>
        <span className="text-xs uppercase tracking-brand text-muted-foreground">
          Paso {Math.min(step, 5)} de 5 · {STEP_LABELS[Math.min(step, 5) - 1]}
        </span>
      </div>
      <Progress value={value} className="h-1" />
    </div>
  );
}

/* ===================== Paso 0: Carrito (igual al original) ===================== */

function PasoCarrito({ cart, onContinuar }: { cart: ReturnType<typeof useCart>; onContinuar: () => void }) {
  if (cart.items.length === 0) {
    return (
      <div className="py-24 text-center">
        <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-6">Tu carrito está vacío.</p>
        <Button asChild variant="hero" size="lg">
          <Link to="/catalogo">Explorar colección</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-12">
      <div className="divide-y divide-border border-y border-border">
        {cart.items.map((it) => (
          <div key={`${it.productId}-${it.talle}-${it.color ?? ""}`} className="py-6 flex gap-4 md:gap-6">
            <Link to="/producto/$slug" params={{ slug: it.product.slug }} className="block w-24 md:w-32 aspect-[4/5] bg-secondary/40 shrink-0">
              <img src={it.product.imagen_url} alt={it.product.nombre} className="h-full w-full object-cover" />
            </Link>
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex justify-between gap-4">
                <div>
                  <h3 className="font-serif text-lg">{it.product.nombre}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Talle {it.talle}{it.color ? ` · ${it.color}` : ""}</p>
                </div>
                <span className="tabular-nums">{formatPrice(it.product.precio * it.cantidad)}</span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center border border-border">
                  <button aria-label="Disminuir" onClick={() => cart.setQty(it.productId, it.talle, it.cantidad - 1, it.color)} className="h-9 w-9 flex items-center justify-center hover:bg-secondary">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center text-sm tabular-nums">{it.cantidad}</span>
                  <button aria-label="Aumentar" onClick={() => cart.setQty(it.productId, it.talle, it.cantidad + 1, it.color)} className="h-9 w-9 flex items-center justify-center hover:bg-secondary">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button aria-label="Eliminar" onClick={() => cart.remove(it.productId, it.talle, it.color)} className="text-muted-foreground hover:text-destructive p-2">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <aside className="bg-secondary/30 p-6 md:p-8 h-fit lg:sticky lg:top-24">
        <h2 className="font-serif text-2xl mb-6">Resumen</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatPrice(cart.total)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Envío</span><span className="text-muted-foreground">A coordinar</span></div>
          <div className="border-t border-border pt-3 mt-3 flex justify-between text-base"><span>Total estimado</span><span className="tabular-nums">{formatPrice(cart.total)}</span></div>
        </div>
        <Button variant="hero" size="lg" onClick={onContinuar} className="w-full mt-6">Continuar al checkout</Button>
      </aside>
    </div>
  );
}

/* ===================== Paso 1: Datos cliente ===================== */

function Field({ label, error, children, hint }: { label: string; error?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-brand text-muted-foreground block mb-2">{label}</label>
      {children}
      {error ? (
        <p className="text-xs text-destructive mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}

function Paso1Cliente({ value, onChange, onBack, onNext }: {
  value: DatosCliente; onChange: (v: DatosCliente) => void;
  onBack: () => void; onNext: () => void;
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const result = clienteSchema.safeParse(value);
  const errors: Record<string, string> = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const k = issue.path[0] as string;
      if (!errors[k]) errors[k] = issue.message;
    }
  }
  const showError = (k: string) => (touched[k] ? errors[k] : undefined);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ nombre: true, email: true, telefono: true });
    if (!result.success) return;
    onNext();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="font-serif text-3xl md:text-4xl">Tus datos</h2>
        <p className="text-sm text-muted-foreground mt-2">Para coordinar la entrega y mantenerte al tanto.</p>
      </div>
      <Field label="Nombre y apellido *" error={showError("nombre")}>
        <Input
          value={value.nombre} autoComplete="name" autoFocus
          onChange={(e) => onChange({ ...value, nombre: e.target.value })}
          onBlur={() => setTouched((t) => ({ ...t, nombre: true }))}
          className={cn("h-12 text-base rounded-none border-border", showError("nombre") && "border-destructive")}
          placeholder="Ej. María García"
        />
      </Field>
      <Field label="Email *" error={showError("email")}>
        <Input
          type="email" inputMode="email" autoComplete="email"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          className={cn("h-12 text-base rounded-none border-border", showError("email") && "border-destructive")}
          placeholder="hola@ejemplo.com"
        />
      </Field>
      <Field label="Teléfono / WhatsApp" hint="Opcional · te avisamos por acá">
        <Input
          type="tel" inputMode="tel" autoComplete="tel"
          value={value.telefono ?? ""}
          onChange={(e) => onChange({ ...value, telefono: e.target.value })}
          className="h-12 text-base rounded-none border-border"
          placeholder="+54 9 11 ..."
        />
      </Field>
      <div className="flex justify-between gap-3 pt-4 border-t border-border">
        <Button type="button" variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Volver</Button>
        <Button type="submit" variant="hero" size="lg" disabled={!result.success}>Continuar</Button>
      </div>
    </form>
  );
}

/* ===================== Paso 2: Método de entrega ===================== */

function OptionCard({ selected, onClick, icon: Icon, title, subtitle, badge, children }: {
  selected: boolean; onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string; subtitle: string; badge?: string; children?: React.ReactNode;
}) {
  return (
    <button
      type="button" onClick={onClick}
      className={cn(
        "relative text-left w-full p-6 border transition-all duration-200 group",
        "hover:border-primary/60 hover:shadow-md",
        selected
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : "border-border bg-background",
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "h-12 w-12 flex items-center justify-center shrink-0 transition-colors",
          selected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif text-xl">{title}</h3>
            {badge && (
              <span className={cn(
                "text-xs uppercase tracking-brand px-2 py-1",
                selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
              )}>{badge}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          {children}
        </div>
      </div>
      {selected && (
        <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-primary animate-in zoom-in-50 duration-200" />
      )}
    </button>
  );
}

function Paso2Metodo({ value, onChange, sucursales, onBack, onNext }: {
  value: MetodoEntrega | null; onChange: (v: MetodoEntrega) => void;
  sucursales: Sucursal[];
  onBack: () => void; onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="font-serif text-3xl md:text-4xl">¿Cómo querés recibir tu pedido?</h2>
        <p className="text-sm text-muted-foreground mt-2">Elegí la opción que más te convenga.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <OptionCard
          selected={value === "envio"} onClick={() => onChange("envio")}
          icon={Truck} title="Envío a domicilio"
          subtitle="A todo el país · 3 a 7 días hábiles"
          badge={formatPrice(COSTO_ENVIO)}
        />
        <OptionCard
          selected={value === "retiro"} onClick={() => onChange("retiro")}
          icon={Store} title="Retiro en local"
          subtitle="Listo en 24hs · Coordinamos por WhatsApp"
          badge="Sin cargo"
        >
          <ul className="text-xs text-muted-foreground mt-3 space-y-1">
            {sucursales.map((s) => (
              <li key={s.id} className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> {s.nombre}
              </li>
            ))}
          </ul>
        </OptionCard>
      </div>
      <div className="flex justify-between gap-3 pt-4 border-t border-border">
        <Button type="button" variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Volver</Button>
        <Button type="button" variant="hero" size="lg" disabled={!value} onClick={onNext}>Continuar</Button>
      </div>
    </div>
  );
}


/* ===================== Paso 3: Datos de entrega ===================== */

function Paso3Direccion({
  metodo, sucursales, direccion, setDireccion, sucursalId, setSucursalId, onBack, onNext,
}: {
  metodo: MetodoEntrega;
  sucursales: Sucursal[];
  direccion: DatosDireccion; setDireccion: (v: DatosDireccion) => void;
  sucursalId: string; setSucursalId: (v: string) => void;
  onBack: () => void; onNext: () => void;
}) {

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const result = direccionSchema.safeParse(direccion);
  const errors: Record<string, string> = {};
  if (!result.success) for (const i of result.error.issues) {
    const k = i.path[0] as string; if (!errors[k]) errors[k] = i.message;
  }
  const showError = (k: string) => (touched[k] ? errors[k] : undefined);

  const canContinue = metodo === "envio" ? result.success : !!sucursalId;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (metodo === "envio") {
      setTouched({ calle: true, numero: true, ciudad: true, provincia: true, cp: true });
    }
    if (!canContinue) return;
    onNext();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="font-serif text-3xl md:text-4xl">
          {metodo === "envio" ? "¿A dónde lo enviamos?" : "Elegí tu sucursal"}
        </h2>
      </div>

      {metodo === "retiro" && (
        <div className="space-y-3">
          {sucursales.map((s) => (
            <OptionCard
              key={s.id} selected={sucursalId === s.id} onClick={() => setSucursalId(s.id)}
              icon={Store} title={s.nombre} subtitle={s.direccion}
            >
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> {s.horario}
              </p>
            </OptionCard>
          ))}
        </div>
      )}

      {metodo === "envio" && (
        <>
          <div className="grid sm:grid-cols-[1fr_140px] gap-4">
            <Field label="Calle *" error={showError("calle")}>
              <Input value={direccion.calle} autoComplete="address-line1"
                onChange={(e) => setDireccion({ ...direccion, calle: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, calle: true }))}
                className={cn("h-12 text-base rounded-none", showError("calle") && "border-destructive")} />
            </Field>
            <Field label="Número *" error={showError("numero")}>
              <Input value={direccion.numero} inputMode="numeric"
                onChange={(e) => setDireccion({ ...direccion, numero: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, numero: true }))}
                className={cn("h-12 text-base rounded-none", showError("numero") && "border-destructive")} />
            </Field>
          </div>
          <Field label="Piso / departamento" hint="Opcional">
            <Input value={direccion.piso ?? ""} autoComplete="address-line2"
              onChange={(e) => setDireccion({ ...direccion, piso: e.target.value })}
              className="h-12 text-base rounded-none" />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Ciudad *" error={showError("ciudad")}>
              <Input value={direccion.ciudad} autoComplete="address-level2"
                onChange={(e) => setDireccion({ ...direccion, ciudad: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, ciudad: true }))}
                className={cn("h-12 text-base rounded-none", showError("ciudad") && "border-destructive")} />
            </Field>
            <Field label="Provincia *" error={showError("provincia")}>
              <Input value={direccion.provincia} autoComplete="address-level1"
                onChange={(e) => setDireccion({ ...direccion, provincia: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, provincia: true }))}
                className={cn("h-12 text-base rounded-none", showError("provincia") && "border-destructive")} />
            </Field>
          </div>
          <Field label="Código postal *" error={showError("cp")}>
            <Input value={direccion.cp} inputMode="numeric" autoComplete="postal-code"
              onChange={(e) => setDireccion({ ...direccion, cp: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, cp: true }))}
              className={cn("h-12 text-base rounded-none max-w-[200px]", showError("cp") && "border-destructive")} />
          </Field>
          <Field label="Referencias" hint="Timbre, color de puerta, horarios… (opcional)">
            <Textarea rows={3} value={direccion.referencias ?? ""}
              onChange={(e) => setDireccion({ ...direccion, referencias: e.target.value })}
              className="text-base rounded-none" />
          </Field>
        </>
      )}

      <div className="flex justify-between gap-3 pt-4 border-t border-border">
        <Button type="button" variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Volver</Button>
        <Button type="submit" variant="hero" size="lg" disabled={!canContinue}>Continuar</Button>
      </div>
    </form>
  );
}

/* ===================== Paso 4: Resumen ===================== */

function Paso4Resumen({
  items, cliente, metodo, direccion, sucursal, subtotal, envio, descuento, total,
  codigoDescuento, setCodigoDescuento,
  onBack, onConfirm,
}: {
  items: { product: import("@/lib/products").Product; cantidad: number; talle: string; color?: string }[];
  cliente: DatosCliente; metodo: MetodoEntrega; direccion: DatosDireccion; sucursal?: Sucursal;
  subtotal: number; envio: number; descuento: number; total: number;
  codigoDescuento: DescuentoValido | null;
  setCodigoDescuento: (v: DescuentoValido | null) => void;
  onBack: () => void; onConfirm: () => Promise<void> | void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [codigoInput, setCodigoInput] = useState(codigoDescuento?.codigo ?? "");
  const [validando, setValidando] = useState(false);
  const handle = async () => {
    setSubmitting(true);
    try { await onConfirm(); } finally { setSubmitting(false); }
  };
  const aplicarCodigo = async () => {
    const txt = codigoInput.trim();
    if (!txt) { setCodigoDescuento(null); return; }
    setValidando(true);
    try {
      const r = await validarCodigo(txt);
      if (!r) {
        toast.error("Código inválido o vencido");
        setCodigoDescuento(null);
      } else {
        setCodigoDescuento(r);
        toast.success(`Código ${r.codigo} aplicado`);
      }
    } finally { setValidando(false); }
  };
  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="font-serif text-3xl md:text-4xl">Revisá tu pedido</h2>
        <p className="text-sm text-muted-foreground mt-2">Última mirada antes de pagar.</p>
      </div>

      <section className="border border-border">
        <header className="px-5 py-3 border-b border-border bg-secondary/40">
          <h3 className="text-xs uppercase tracking-brand">Productos</h3>
        </header>
        <ul className="divide-y divide-border">
          {items.map((it) => (
            <li key={`${it.product.id}-${it.talle}-${it.color ?? ""}`} className="p-4 flex gap-4 items-center">
              <img src={it.product.imagen_url} alt={it.product.nombre} className="w-16 h-20 object-cover bg-secondary/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-serif">{it.product.nombre}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Talle {it.talle}{it.color ? ` · ${it.color}` : ""} · x{it.cantidad}
                </p>
              </div>
              <span className="tabular-nums text-sm">{formatPrice(it.product.precio * it.cantidad)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <SummaryBlock title="Datos">
          <p className="text-sm">{cliente.nombre}</p>
          <p className="text-xs text-muted-foreground">{cliente.email}</p>
          {cliente.telefono && <p className="text-xs text-muted-foreground">{cliente.telefono}</p>}
        </SummaryBlock>
        <SummaryBlock title={metodo === "envio" ? "Envío a domicilio" : "Retiro en local"}>
          {metodo === "envio" ? (
            <p className="text-sm">{formatDireccion(direccion)}</p>
          ) : (
            <>
              <p className="text-sm">{sucursal?.nombre}</p>
              <p className="text-xs text-muted-foreground">{sucursal?.direccion}</p>
            </>
          )}
        </SummaryBlock>
      </div>

      <section className="border border-border p-5">
        <label className="text-xs uppercase tracking-brand text-muted-foreground block mb-2">
          ¿Tenés un código de descuento?
        </label>
        <div className="flex gap-2">
          <Input
            value={codigoInput}
            onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
            placeholder="BIENVENIDA10"
            className="rounded-none border-border h-11 tracking-wider"
            maxLength={40}
          />
          {codigoDescuento ? (
            <Button type="button" variant="outline" onClick={() => { setCodigoDescuento(null); setCodigoInput(""); }}>
              Quitar
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={aplicarCodigo} disabled={validando}>
              {validando && <Loader2 className="h-4 w-4 animate-spin" />} Aplicar
            </Button>
          )}
        </div>
        {codigoDescuento && (
          <p className="text-xs text-green-700 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3" /> Código {codigoDescuento.codigo} aplicado
            {codigoDescuento.tipo === "porcentaje"
              ? ` (-${codigoDescuento.valor}%)`
              : ` (-${formatPrice(codigoDescuento.valor)})`}
          </p>
        )}
      </section>

      <section className="bg-secondary/30 p-6 space-y-3">
        <Row label="Subtotal" value={formatPrice(subtotal)} />
        {descuento > 0 && (
          <Row label={`Descuento${codigoDescuento ? ` (${codigoDescuento.codigo})` : ""}`} value={`- ${formatPrice(descuento)}`} />
        )}
        <Row label="Envío" value={envio > 0 ? formatPrice(envio) : "Sin cargo"} muted={envio === 0} />
        <div className="border-t border-border pt-3 mt-3 flex justify-between items-baseline">
          <span className="text-xs uppercase tracking-brand text-muted-foreground">Total</span>
          <span className="font-serif text-3xl tabular-nums">{formatPrice(total)}</span>
        </div>
      </section>

      <div className="flex justify-between gap-3 pt-4 border-t border-border">
        <Button type="button" variant="ghost" onClick={onBack} disabled={submitting}><ArrowLeft className="h-4 w-4" /> Volver</Button>
        <Button type="button" variant="hero" size="lg" onClick={handle} disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Confirmar e ir a pagar
        </Button>
      </div>
    </div>
  );
}

function SummaryBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border p-5">
      <h3 className="text-xs uppercase tracking-brand text-muted-foreground mb-2">{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular-nums", muted && "text-muted-foreground")}>{value}</span>
    </div>
  );
}

/* ===================== Paso 5: Pago ===================== */

function Paso5Pago({
  pedidoId, snapshot, comprobanteSubido, onUploaded, onFinalizar,
}: {
  pedidoId: string;
  snapshot: {
    items: { product: import("@/lib/products").Product; cantidad: number; talle: string; color?: string }[];
    subtotal: number; envio: number; descuento: number; total: number;
    cliente: DatosCliente; metodo: MetodoEntrega; direccion?: DatosDireccion; sucursal?: Sucursal;
    codigo?: string | null;
  };
  comprobanteSubido: boolean;
  onUploaded: () => void;
  onFinalizar: () => void;
}) {
  const { data: datos, isLoading } = useQuery(datosBancariosQueryOptions());
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  const processFile = async (f: File) => {
    if (f.size > 5 * 1024 * 1024) { toast.error("El archivo debe ser menor a 5MB"); return; }
    if (!["image/jpeg", "image/png", "application/pdf"].includes(f.type)) {
      toast.error("Formato no soportado. Usá JPG, PNG o PDF."); return;
    }
    setFile(f);
    setUploading(true);
    try {
      await subirComprobante(pedidoId, f);
      onUploaded();
      toast.success("Comprobante recibido");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Intentá nuevamente.";
      toast.error("No pudimos subir el comprobante", { description: msg });
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0]; if (f) processFile(f);
  };

  const waUrl = buildResumenWhatsApp({
    items: snapshot.items, subtotal: snapshot.subtotal, costoEnvio: snapshot.envio, total: snapshot.total,
    cliente: snapshot.cliente, metodo: snapshot.metodo, direccion: snapshot.direccion, sucursal: snapshot.sucursal,
    pedidoId,
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-serif text-3xl md:text-4xl">Último paso: el pago</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Pedido N° <span className="font-mono">{pedidoId.slice(0, 8).toUpperCase()}</span> · Total: <span className="text-foreground tabular-nums">{formatPrice(snapshot.total)}</span>
        </p>
      </div>

      <div className="border border-border p-6 space-y-3">
        <h3 className="font-serif text-xl mb-2">Datos para transferir</h3>
        <DatoLinea label="Titular" value={datos?.titular || "—"} />
        <DatoLinea label="Banco" value={datos?.banco || "—"} />
        <DatoLinea label="CBU" value={datos?.cbu || "—"} onCopy={datos?.cbu ? () => copy(datos.cbu, "CBU") : undefined} />
        <DatoLinea label="Alias" value={datos?.alias || "—"} onCopy={datos?.alias ? () => copy(datos.alias, "Alias") : undefined} />
      </div>

      {/* Opción 1: subir comprobante */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">1</span>
          <h3 className="font-serif text-xl">Subí tu comprobante</h3>
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed p-8 text-center cursor-pointer transition-all",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40",
          )}
        >
          <input
            ref={inputRef} type="file" className="hidden"
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
          />
          {file ? (
            <div className="flex items-center gap-4 text-left animate-in fade-in duration-200">
              {previewUrl ? (
                <img src={previewUrl} alt="" className="h-20 w-20 object-cover border border-border" />
              ) : (
                <div className="h-20 w-20 bg-secondary flex items-center justify-center"><FileText className="h-8 w-8 text-muted-foreground" /></div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  {uploading ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Subiendo…</>
                  ) : comprobanteSubido ? (
                    <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Recibido</span>
                  ) : null}
                </div>
              </div>
              <button
                type="button" aria-label="Quitar"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-muted-foreground hover:text-destructive p-1"
              ><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm">Arrastrá tu comprobante o <span className="underline">elegí un archivo</span></p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG o PDF · máx 5MB</p>
            </>
          )}
        </div>
      </section>

      <div className="relative flex items-center">
        <div className="flex-1 h-px bg-border" />
        <span className="px-3 text-xs uppercase tracking-brand text-muted-foreground">o</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Opción 2: WhatsApp */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">2</span>
          <h3 className="font-serif text-xl">Coordinar por WhatsApp</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Te abre el chat con el resumen del pedido listo para enviar.</p>
        <Button asChild variant="wa" size="xl" className="w-full">
          <a href={waUrl} target="_blank" rel="noreferrer" onClick={onFinalizar}>
            <MessageCircle className="h-5 w-5" /> Completar compra por WhatsApp
          </a>
        </Button>
      </section>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button variant="hero" size="lg" disabled={!comprobanteSubido} onClick={onFinalizar}>
          Finalizar
        </Button>
      </div>
    </div>
  );
}

function DatoLinea({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-brand text-muted-foreground">{label}</p>
        <p className="text-sm mt-1 truncate">{value}</p>
      </div>
      {onCopy && (
        <button onClick={onCopy} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground shrink-0">
          <Copy className="h-3.5 w-3.5" /> Copiar
        </button>
      )}
    </div>
  );
}

/* ===================== Confirmación ===================== */

function Confirmacion({ pedidoId }: { pedidoId: string }) {
  return (
    <div className="max-w-xl mx-auto text-center space-y-6 py-12">
      <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto animate-in zoom-in-50 duration-300" />
      <h1 className="font-serif text-4xl">¡Listo!</h1>
      <p className="text-muted-foreground">
        Recibimos tu pedido <span className="font-serif text-foreground">N° {pedidoId.slice(0, 8).toUpperCase()}</span>.
        Vamos a verificar el pago y te confirmamos en breve.
      </p>
      <Button asChild variant="hero" size="lg"><Link to="/catalogo">Volver al catálogo</Link></Button>
    </div>
  );
}
