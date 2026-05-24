import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  pedidosQueryOptions,
  fetchPedidoItems,
  actualizarEstadoPedido,
  comprobanteSignedUrl,
  ESTADO_LABELS,
  type EstadoPedido,
  type PedidoRow,
} from "@/lib/pedidos";
import { formatPrice } from "@/lib/products";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText, ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos — Admin Franca" }] }),
  component: AdminPedidos,
});

const ESTADOS: EstadoPedido[] = [
  "pendiente",
  "esperando_transferencia",
  "comprobante_recibido",
  "pagado",
  "enviado",
  "cancelado",
];

const BADGE_VARIANTS: Record<EstadoPedido, "default" | "secondary" | "outline" | "destructive"> = {
  pendiente: "outline",
  esperando_transferencia: "secondary",
  comprobante_recibido: "secondary",
  pagado: "default",
  enviado: "default",
  cancelado: "destructive",
};

function AdminPedidos() {
  const { data: pedidos, isLoading } = useQuery(pedidosQueryOptions());
  const [filtro, setFiltro] = useState<EstadoPedido | "todos">("todos");

  const lista = (pedidos ?? []).filter((p) => filtro === "todos" || p.estado === filtro);

  return (
    <div className="container-editorial py-12 md:py-16">
      <span className="text-xs uppercase tracking-brand text-muted-foreground">Administración</span>
      <h1 className="font-serif text-4xl md:text-5xl mt-3 mb-8">Pedidos</h1>

      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filtrar por estado:</span>
        <Select value={filtro} onValueChange={(v) => setFiltro(v as EstadoPedido | "todos")}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {ESTADOS.map((e) => (
              <SelectItem key={e} value={e}>{ESTADO_LABELS[e]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : lista.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No hay pedidos.</p>
      ) : (
        <div className="space-y-3">
          {lista.map((p) => <PedidoCard key={p.id} pedido={p} />)}
        </div>
      )}
    </div>
  );
}

function PedidoCard({ pedido }: { pedido: PedidoRow }) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const qc = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ["pedido_items", pedido.id],
    queryFn: () => fetchPedidoItems(pedido.id),
    enabled: open,
  });

  const handleEstado = async (nuevo: EstadoPedido) => {
    setUpdating(true);
    try {
      await actualizarEstadoPedido(pedido.id, nuevo);
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["pedidos"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setUpdating(false);
    }
  };

  const verComprobante = async () => {
    if (!pedido.comprobante_url) return;
    const url = await comprobanteSignedUrl(pedido.comprobante_url);
    if (url) window.open(url, "_blank");
    else toast.error("No pudimos abrir el comprobante");
  };

  return (
    <div className="border border-border">
      <button onClick={() => setOpen(!open)} className="w-full p-4 md:p-6 flex items-center justify-between gap-4 hover:bg-muted/30 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-serif text-lg">{pedido.id.slice(0, 8).toUpperCase()}</span>
            <Badge variant={BADGE_VARIANTS[pedido.estado]}>{ESTADO_LABELS[pedido.estado]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {pedido.cliente_nombre} · {new Date(pedido.created_at).toLocaleString("es-AR")}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="tabular-nums text-sm">{formatPrice(pedido.total)}</span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border p-4 md:p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <Info label="Email" value={pedido.cliente_email ?? "—"} />
            <Info label="Teléfono" value={pedido.cliente_telefono ?? "—"} />
            <Info label="Dirección" value={pedido.direccion_envio ?? "—"} />
            <Info label="Método de pago" value={pedido.metodo_pago} />
            {pedido.notas && <Info label="Notas" value={pedido.notas} />}
          </div>

          <div>
            <p className="text-xs uppercase tracking-brand text-muted-foreground mb-2">Items</p>
            {itemsQuery.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <ul className="text-sm divide-y divide-border border-y border-border">
                {(itemsQuery.data ?? []).map((it) => (
                  <li key={it.id} className="flex justify-between py-2">
                    <span>{it.nombre_snapshot} — Talle {it.talle} × {it.cantidad}</span>
                    <span className="tabular-nums">{formatPrice(it.precio_unitario * it.cantidad)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
            {pedido.comprobante_url && (
              <Button variant="outline" size="sm" onClick={verComprobante}>
                <FileText className="h-4 w-4" /> Ver comprobante
              </Button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground">Cambiar estado:</span>
              <Select value={pedido.estado} onValueChange={(v) => handleEstado(v as EstadoPedido)} disabled={updating}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((e) => (
                    <SelectItem key={e} value={e}>{ESTADO_LABELS[e]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-brand text-muted-foreground">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
