import { z } from "zod";
import { formatPrice, type Product } from "./products";
import { BRAND } from "./config";

export const COSTO_ENVIO = 20000;

export type MetodoEntrega = "envio" | "retiro";

export type Sucursal = {
  id: string;
  nombre: string;
  direccion: string;
  horario: string;
};

export const SUCURSALES: Sucursal[] = [
  { id: "centro", nombre: "Sucursal Centro", direccion: "Av. Corrientes 1234, CABA", horario: "Lun a Vie 10–19hs · Sáb 10–14hs" },
  { id: "palermo", nombre: "Sucursal Palermo", direccion: "Honduras 5678, CABA", horario: "Lun a Sáb 11–20hs" },
  { id: "belgrano", nombre: "Sucursal Belgrano", direccion: "Cabildo 2345, CABA", horario: "Lun a Vie 10–19hs · Sáb 10–14hs" },
];

// Schemas zod para validación en tiempo real
export const clienteSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresá tu nombre y apellido").max(120),
  email: z.string().trim().email("Email inválido").max(255),
  telefono: z.string().trim().max(40).optional().or(z.literal("")),
});

export const direccionSchema = z.object({
  calle: z.string().trim().min(2, "Requerido").max(120),
  numero: z.string().trim().min(1, "Requerido").max(20),
  piso: z.string().trim().max(40).optional().or(z.literal("")),
  ciudad: z.string().trim().min(2, "Requerido").max(80),
  provincia: z.string().trim().min(2, "Requerido").max(80),
  cp: z.string().trim().min(3, "Requerido").max(15),
  referencias: z.string().trim().max(300).optional().or(z.literal("")),
});

export type DatosCliente = z.infer<typeof clienteSchema>;
export type DatosDireccion = z.infer<typeof direccionSchema>;

export function formatDireccion(d: DatosDireccion): string {
  const piso = d.piso ? `, ${d.piso}` : "";
  const ref = d.referencias ? ` (${d.referencias})` : "";
  return `${d.calle} ${d.numero}${piso}, ${d.ciudad}, ${d.provincia} (CP ${d.cp})${ref}`;
}

export function buildResumenWhatsApp(args: {
  items: { product: Product; cantidad: number; talle: string }[];
  subtotal: number;
  costoEnvio: number;
  total: number;
  cliente: DatosCliente;
  metodo: MetodoEntrega;
  direccion?: DatosDireccion;
  sucursal?: Sucursal;
  pedidoId?: string;
}): string {
  const lines = [
    `Hola ${BRAND.name} ✨`,
    `Quisiera confirmar mi pedido:`,
    ``,
    ...args.items.map(
      (i) =>
        `• ${i.product.nombre} — Talle ${i.talle} — x${i.cantidad} — ${formatPrice(i.product.precio * i.cantidad)}`,
    ),
    ``,
    `Subtotal: ${formatPrice(args.subtotal)}`,
    `Envío: ${args.costoEnvio > 0 ? formatPrice(args.costoEnvio) : "Sin cargo"}`,
    `Total: ${formatPrice(args.total)}`,
    ``,
    `Nombre: ${args.cliente.nombre}`,
    `Email: ${args.cliente.email}`,
    args.cliente.telefono ? `Tel: ${args.cliente.telefono}` : "",
    ``,
    args.metodo === "envio" && args.direccion
      ? `Envío a: ${formatDireccion(args.direccion)}`
      : args.sucursal
        ? `Retiro en: ${args.sucursal.nombre} — ${args.sucursal.direccion}`
        : "",
    args.pedidoId ? `Pedido N°: ${args.pedidoId.slice(0, 8).toUpperCase()}` : "",
    ``,
    `¡Gracias!`,
  ];
  const text = encodeURIComponent(lines.filter(Boolean).join("\n"));
  return `https://wa.me/${BRAND.whatsapp}?text=${text}`;
}
