import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/admin";
import {
  consultasQueryOptions,
  crearConsulta,
  responderConsulta,
  eliminarConsulta,
  type Consulta,
} from "@/lib/consultas";
import { MessageCircleQuestion, Trash2 } from "lucide-react";

const preguntaSchema = z
  .string()
  .trim()
  .min(5, "La pregunta es muy corta")
  .max(500, "Máximo 500 caracteres");

const respuestaSchema = z
  .string()
  .trim()
  .min(2, "La respuesta es muy corta")
  .max(1000, "Máximo 1000 caracteres");

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ProductQuestions({ productoId }: { productoId: string }) {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const qc = useQueryClient();
  const { data: consultas = [], isLoading } = useQuery(consultasQueryOptions(productoId, !!isAdmin));

  const [pregunta, setPregunta] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Mostrar respondidas + las propias del usuario (RLS ya lo filtra, acá ordenamos)
  const visibles: Consulta[] = consultas;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = preguntaSchema.safeParse(pregunta);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setEnviando(true);
    try {
      await crearConsulta({
        producto_id: productoId,
        user_id: user.id,
        nombre_usuario:
          (user.user_metadata?.nombre as string | undefined) ??
          user.email?.split("@")[0] ??
          "Usuario",
        pregunta: parsed.data,
      });
      toast.success("Pregunta enviada", {
        description: "Vas a ver la respuesta acá cuando esté publicada.",
      });
      setPregunta("");
      qc.invalidateQueries({ queryKey: ["consultas", productoId] });
    } catch (err) {
      console.error(err);
      toast.error("No pudimos enviar tu pregunta. Intentá de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="container-editorial py-16 md:py-20 border-t border-border">
      <div className="flex items-center gap-3 mb-8">
        <MessageCircleQuestion className="h-5 w-5 text-primary" />
        <h2 className="font-serif text-3xl">Preguntas y respuestas</h2>
      </div>

      {/* Formulario */}
      {user ? (
        <form onSubmit={onSubmit} className="border border-border p-5 md:p-6 mb-10 max-w-3xl">
          <label className="text-xs uppercase tracking-brand text-muted-foreground">
            Hacé tu consulta
          </label>
          <Textarea
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            placeholder="Ej: ¿Tienen este sweater en talle M?"
            rows={3}
            maxLength={500}
            className="mt-2 rounded-none"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">{pregunta.length}/500</span>
            <Button type="submit" variant="hero" size="lg" disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar pregunta"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="border border-border p-6 mb-10 max-w-3xl text-sm">
          <p className="text-muted-foreground">
            Para hacer una consulta sobre este producto necesitás tener una cuenta.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="hero" size="lg" className="w-full sm:w-auto">Ingresar</Button>
            </Link>
            <Link to="/registro" className="w-full sm:w-auto">
              <Button variant="heroOutline" size="lg" className="w-full sm:w-auto">Crear cuenta</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Listado */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando consultas…</p>
      ) : visibles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay preguntas sobre este producto. ¡Sé el primero!
        </p>
      ) : (
        <ul className="space-y-6 max-w-3xl">
          {visibles.map((c) => (
            <ConsultaItem
              key={c.id}
              consulta={c}
              isAdmin={!!isAdmin}
              esPropia={!!user && user.id === c.user_id}
              onChange={() => qc.invalidateQueries({ queryKey: ["consultas", productoId] })}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ConsultaItem({
  consulta,
  isAdmin,
  esPropia,
  onChange,
}: {
  consulta: Consulta;
  isAdmin: boolean;
  esPropia: boolean;
  onChange: () => void;
}) {
  const [respuesta, setRespuesta] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleResponder = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = respuestaSchema.safeParse(respuesta);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      await responderConsulta(consulta.id, parsed.data);
      toast.success("Respuesta publicada");
      setRespuesta("");
      setEditing(false);
      onChange();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo publicar la respuesta");
    } finally {
      setBusy(false);
    }
  };

  const handleEliminar = async () => {
    if (!confirm("¿Eliminar esta consulta?")) return;
    setBusy(true);
    try {
      await eliminarConsulta(consulta.id);
      toast.success("Consulta eliminada");
      onChange();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo eliminar");
    } finally {
      setBusy(false);
    }
  };

  const sinResponder = !consulta.respuesta;

  return (
    <li className="border-b border-border pb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="uppercase tracking-brand">{consulta.nombre_usuario || "Usuario"}</span>
            <span>·</span>
            <span>{formatFecha(consulta.created_at)}</span>
            {sinResponder && (esPropia || isAdmin) && (
              <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-[10px] uppercase tracking-brand">
                Pendiente
              </span>
            )}
          </div>
          <p className="mt-2 text-sm">{consulta.pregunta}</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleEliminar}
            disabled={busy}
            className="text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Eliminar consulta"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {consulta.respuesta ? (
        <div className="mt-4 ml-4 pl-4 border-l-2 border-primary/40">
          <div className="text-xs uppercase tracking-brand text-primary font-semibold">
            Respuesta de Franca
          </div>
          <p className="mt-1 text-sm text-foreground/90">{consulta.respuesta}</p>
        </div>
      ) : isAdmin ? (
        <div className="mt-4 ml-4 pl-4 border-l-2 border-border">
          {editing ? (
            <form onSubmit={handleResponder}>
              <Textarea
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                placeholder="Escribí la respuesta…"
                rows={2}
                maxLength={1000}
                className="rounded-none"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <Button type="submit" size="sm" disabled={busy}>
                  {busy ? "Publicando…" : "Publicar"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Responder
            </Button>
          )}
        </div>
      ) : null}
    </li>
  );
}
