import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, Loader2, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listarMensajesContacto, marcarMensajeLeido } from "@/lib/contacto";

export const Route = createFileRoute("/_admin/admin/mensajes")({
  head: () => ({ meta: [{ title: "Mensajes — Admin Franca" }] }),
  component: AdminMensajes,
});

function AdminMensajes() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"todos" | "no_leidos">("no_leidos");
  const { data, isLoading } = useQuery({
    queryKey: ["mensajes_contacto"],
    queryFn: listarMensajesContacto,
  });

  const mensajes = (data ?? []).filter((m) => filter === "todos" || !m.leido);

  const toggleLeido = async (id: string, leido: boolean) => {
    try {
      await marcarMensajeLeido(id, leido);
      qc.invalidateQueries({ queryKey: ["mensajes_contacto"] });
    } catch (e) {
      toast.error("No se pudo actualizar");
    }
  };

  return (
    <div className="container-editorial py-12">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <span className="text-xs uppercase tracking-brand text-muted-foreground">Bandeja</span>
          <h1 className="font-serif text-4xl mt-2">Mensajes de contacto</h1>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={filter === "no_leidos" ? "default" : "outline"}
            onClick={() => setFilter("no_leidos")}
          >
            No leídos
          </Button>
          <Button
            size="sm"
            variant={filter === "todos" ? "default" : "outline"}
            onClick={() => setFilter("todos")}
          >
            Todos
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-6 w-6" /></div>
      ) : mensajes.length === 0 ? (
        <p className="text-muted-foreground py-20 text-center">No hay mensajes {filter === "no_leidos" ? "sin leer" : "todavía"}.</p>
      ) : (
        <div className="space-y-4">
          {mensajes.map((m) => (
            <article
              key={m.id}
              className={`border rounded-lg p-5 ${m.leido ? "border-border bg-background" : "border-primary/30 bg-secondary/20"}`}
            >
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{m.nombre}</h3>
                    {!m.leido && <Badge variant="default" className="text-[10px]">Nuevo</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center flex-wrap gap-3">
                    <a href={`mailto:${m.email}`} className="flex items-center gap-1 hover:text-foreground">
                      <Mail className="h-3 w-3" /> {m.email}
                    </a>
                    {m.telefono && (
                      <a href={`https://wa.me/${m.telefono.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                        <Phone className="h-3 w-3" /> {m.telefono} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <span>{new Date(m.created_at).toLocaleString("es-AR")}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={m.leido ? "outline" : "default"}
                  onClick={() => toggleLeido(m.id, !m.leido)}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  {m.leido ? "Marcar no leído" : "Marcar leído"}
                </Button>
              </div>
              <p className="mt-3 text-xs uppercase tracking-brand text-muted-foreground">{m.asunto}</p>
              <p className="mt-2 text-sm whitespace-pre-wrap leading-relaxed">{m.mensaje}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
