import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Trash2, Plus } from "lucide-react";
import { datosBancariosQueryOptions, updateDatosBancarios } from "@/lib/datos-bancarios";
import { siteImagesQueryOptions, updateSiteImage, type SiteImageKey } from "@/lib/site-images";
import { uploadProductImage } from "@/lib/upload";
import {
  codigosAdminQueryOptions, crearCodigo, actualizarCodigo, eliminarCodigo,
  type CodigoDescuento, type TipoDescuento,
} from "@/lib/descuentos";
import {
  categoriasAdminQueryOptions, crearCategoria, actualizarCategoria, eliminarCategoria,
  type Categoria,
} from "@/lib/categorias";
import {
  localesRetiroAdminQueryOptions, crearLocal, actualizarLocal, eliminarLocal,
  type LocalRetiro,
} from "@/lib/locales-retiro";

export const Route = createFileRoute("/_admin/admin/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — Admin Franca" }] }),
  component: AdminConfig,
});

function AdminConfig() {
  const { data, isLoading, refetch } = useQuery(datosBancariosQueryOptions());
  const [form, setForm] = useState({
    titular: "", cbu: "", alias: "", banco: "", email_contacto: "", notas: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        titular: data.titular, cbu: data.cbu, alias: data.alias,
        banco: data.banco, email_contacto: data.email_contacto, notas: data.notas,
      });
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    try {
      await updateDatosBancarios(data.id, form);
      toast.success("Datos guardados");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-editorial py-12 md:py-16 max-w-2xl">
      <span className="text-xs uppercase tracking-brand text-muted-foreground">Administración</span>
      <h1 className="font-serif text-4xl md:text-5xl mt-3 mb-2">Datos bancarios</h1>
      <p className="text-muted-foreground mb-8">Estos datos se muestran al cliente en el checkout para que realice la transferencia.</p>

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Titular" value={form.titular} onChange={(v) => setForm({ ...form, titular: v })} />
          <Field label="Banco" value={form.banco} onChange={(v) => setForm({ ...form, banco: v })} />
          <Field label="CBU" value={form.cbu} onChange={(v) => setForm({ ...form, cbu: v })} />
          <Field label="Alias" value={form.alias} onChange={(v) => setForm({ ...form, alias: v })} />
          <Field label="Email de contacto" value={form.email_contacto} onChange={(v) => setForm({ ...form, email_contacto: v })} type="email" />
          <div>
            <label className="text-xs uppercase tracking-brand text-muted-foreground block mb-2">Notas (opcional)</label>
            <Textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={3} className="bg-background border-border rounded-none" />
          </div>
          <Button type="submit" variant="hero" size="lg" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </form>
      )}

      <SiteImagesSection />

      <CategoriasSection />

      <LocalesRetiroSection />

      <DiscountCodesSection />
    </div>
  );
}

function LocalesRetiroSection() {
  const { data, isLoading, refetch } = useQuery(localesRetiroAdminQueryOptions());
  const [nuevo, setNuevo] = useState({
    nombre: "", direccion: "", ciudad: "", provincia: "", horarios: "", telefono: "", notas: "", orden: "0",
  });
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevo.nombre.trim()) return toast.error("Ingresá un nombre");
    setCreating(true);
    try {
      await crearLocal({
        nombre: nuevo.nombre,
        direccion: nuevo.direccion,
        ciudad: nuevo.ciudad,
        provincia: nuevo.provincia,
        horarios: nuevo.horarios,
        telefono: nuevo.telefono,
        notas: nuevo.notas,
        orden: Number(nuevo.orden) || 0,
      });
      toast.success("Local creado");
      setNuevo({ nombre: "", direccion: "", ciudad: "", provincia: "", horarios: "", telefono: "", notas: "", orden: "0" });
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mt-16">
      <h2 className="font-serif text-3xl mb-2">Locales de retiro</h2>
      <p className="text-muted-foreground mb-8">Configurá los puntos físicos donde el cliente puede retirar su pedido. Sólo se muestran los activos.</p>

      <form onSubmit={handleCreate} className="border border-border p-4 space-y-4 mb-8">
        <h3 className="font-medium flex items-center gap-2"><Plus className="h-4 w-4" /> Nuevo local</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Nombre (ej: Sucursal Centro)" value={nuevo.nombre} onChange={(v) => setNuevo({ ...nuevo, nombre: v })} />
          <Field label="Dirección" value={nuevo.direccion} onChange={(v) => setNuevo({ ...nuevo, direccion: v })} />
          <Field label="Ciudad" value={nuevo.ciudad} onChange={(v) => setNuevo({ ...nuevo, ciudad: v })} />
          <Field label="Provincia" value={nuevo.provincia} onChange={(v) => setNuevo({ ...nuevo, provincia: v })} />
          <Field label="Horarios (ej: Lun a Vie 10-19hs)" value={nuevo.horarios} onChange={(v) => setNuevo({ ...nuevo, horarios: v })} />
          <Field label="Teléfono" value={nuevo.telefono} onChange={(v) => setNuevo({ ...nuevo, telefono: v })} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-brand text-muted-foreground block mb-2">Notas (opcional)</label>
          <Textarea value={nuevo.notas} onChange={(e) => setNuevo({ ...nuevo, notas: e.target.value })} rows={2} className="bg-background border-border rounded-none" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_auto] gap-3 items-end">
          <Field label="Orden" value={nuevo.orden} onChange={(v) => setNuevo({ ...nuevo, orden: v })} type="number" />
          <Button type="submit" variant="hero" disabled={creating}>
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear local
          </Button>
        </div>
      </form>

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay locales cargados.</p>
      ) : (
        <div className="space-y-3">
          {data.map((l) => (
            <LocalRow key={l.id} local={l} onChanged={() => refetch()} />
          ))}
        </div>
      )}
    </div>
  );
}

function LocalRow({ local, onChanged }: { local: LocalRetiro; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: local.nombre,
    direccion: local.direccion,
    ciudad: local.ciudad,
    provincia: local.provincia,
    horarios: local.horarios,
    telefono: local.telefono,
    notas: local.notas,
    orden: String(local.orden),
  });

  const toggleActivo = async () => {
    try {
      await actualizarLocal(local.id, { activo: !local.activo });
      toast.success(local.activo ? "Local desactivado" : "Local activado");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const handleEliminar = async () => {
    if (!confirm(`¿Eliminar el local "${local.nombre}"?`)) return;
    try {
      await eliminarLocal(local.id);
      toast.success("Local eliminado");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const handleGuardar = async () => {
    if (!form.nombre.trim()) return toast.error("Nombre requerido");
    setSaving(true);
    try {
      await actualizarLocal(local.id, {
        nombre: form.nombre,
        direccion: form.direccion,
        ciudad: form.ciudad,
        provincia: form.provincia,
        horarios: form.horarios,
        telefono: form.telefono,
        notas: form.notas,
        orden: Number(form.orden) || 0,
      });
      toast.success("Cambios guardados");
      setEditing(false);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="border border-border p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
          <Field label="Dirección" value={form.direccion} onChange={(v) => setForm({ ...form, direccion: v })} />
          <Field label="Ciudad" value={form.ciudad} onChange={(v) => setForm({ ...form, ciudad: v })} />
          <Field label="Provincia" value={form.provincia} onChange={(v) => setForm({ ...form, provincia: v })} />
          <Field label="Horarios" value={form.horarios} onChange={(v) => setForm({ ...form, horarios: v })} />
          <Field label="Teléfono" value={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-brand text-muted-foreground block mb-2">Notas</label>
          <Textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} className="bg-background border-border rounded-none" />
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-3 items-end">
          <Field label="Orden" value={form.orden} onChange={(v) => setForm({ ...form, orden: v })} type="number" />
          <div className="flex gap-2">
            <Button type="button" variant="hero" onClick={handleGuardar} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border p-4 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium">{local.nombre}</p>
          <span className={`text-xs px-2 py-0.5 ${local.activo ? "bg-secondary" : "bg-muted text-muted-foreground"}`}>
            {local.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {[local.direccion, local.ciudad, local.provincia].filter(Boolean).join(", ") || "Sin dirección"}
        </p>
        {(local.horarios || local.telefono) && (
          <p className="text-xs text-muted-foreground mt-1">
            {local.horarios}{local.horarios && local.telefono ? " · " : ""}{local.telefono}
          </p>
        )}
        {local.notas && <p className="text-xs text-muted-foreground mt-1 italic">{local.notas}</p>}
        <p className="text-xs text-muted-foreground mt-1">Orden: {local.orden}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button type="button" variant="outline" onClick={toggleActivo} className="rounded-none">
          {local.activo ? "Desactivar" : "Activar"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setEditing(true)} className="rounded-none">Editar</Button>
        <Button type="button" variant="outline" onClick={handleEliminar} className="rounded-none text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CategoriasSection() {
  const { data, isLoading, refetch } = useQuery(categoriasAdminQueryOptions());
  const [nuevo, setNuevo] = useState({ nombre: "", orden: "0" });
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = nuevo.nombre.trim();
    if (!nombre) return toast.error("Ingresá un nombre");
    if (nombre.length > 60) return toast.error("Máximo 60 caracteres");
    setCreating(true);
    try {
      await crearCategoria({ nombre, orden: Number(nuevo.orden) || 0 });
      toast.success("Categoría creada");
      setNuevo({ nombre: "", orden: "0" });
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear";
      toast.error(msg.includes("duplicate") ? "Ya existe una categoría con ese nombre" : msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mt-16">
      <h2 className="font-serif text-3xl mb-2">Categorías</h2>
      <p className="text-muted-foreground mb-8">Creá, renombrá o desactivá las categorías que aparecen en el catálogo y en el formulario de productos.</p>

      <form onSubmit={handleCreate} className="border border-border p-4 space-y-4 mb-8">
        <h3 className="font-medium flex items-center gap-2"><Plus className="h-4 w-4" /> Nueva categoría</h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-3 items-end">
          <Field label="Nombre (ej: Vestidos)" value={nuevo.nombre} onChange={(v) => setNuevo({ ...nuevo, nombre: v })} />
          <Field label="Orden" value={nuevo.orden} onChange={(v) => setNuevo({ ...nuevo, orden: v })} type="number" />
          <Button type="submit" variant="hero" disabled={creating}>
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear
          </Button>
        </div>
      </form>

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay categorías cargadas.</p>
      ) : (
        <div className="space-y-3">
          {data.map((c) => (
            <CategoriaRow key={c.id} categoria={c} onChanged={() => refetch()} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoriaRow({ categoria, onChanged }: { categoria: Categoria; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre: categoria.nombre, orden: String(categoria.orden) });

  const toggleActivo = async () => {
    try {
      await actualizarCategoria(categoria.id, { activo: !categoria.activo });
      toast.success(categoria.activo ? "Categoría desactivada" : "Categoría activada");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const handleEliminar = async () => {
    if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"? Los productos con esta categoría no se borran, pero quedan sin clasificar.`)) return;
    try {
      await eliminarCategoria(categoria.id);
      toast.success("Categoría eliminada");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const handleGuardar = async () => {
    const nombre = form.nombre.trim();
    if (!nombre) return toast.error("Nombre requerido");
    setSaving(true);
    try {
      await actualizarCategoria(categoria.id, { nombre, orden: Number(form.orden) || 0 });
      toast.success("Cambios guardados");
      setEditing(false);
      onChanged();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      toast.error(msg.includes("duplicate") ? "Ya existe una categoría con ese nombre" : msg);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="border border-border p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-3">
          <Field label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
          <Field label="Orden" value={form.orden} onChange={(v) => setForm({ ...form, orden: v })} type="number" />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="hero" onClick={handleGuardar} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </Button>
          <Button type="button" variant="outline" onClick={() => { setEditing(false); setForm({ nombre: categoria.nombre, orden: String(categoria.orden) }); }}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border p-4 flex items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium">{categoria.nombre}</p>
          <span className={`text-xs px-2 py-0.5 ${categoria.activo ? "bg-secondary" : "bg-muted text-muted-foreground"}`}>
            {categoria.activo ? "Activa" : "Inactiva"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Orden: {categoria.orden}</p>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={toggleActivo} className="rounded-none">
          {categoria.activo ? "Desactivar" : "Activar"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setEditing(true)} className="rounded-none">Editar</Button>
        <Button type="button" variant="outline" onClick={handleEliminar} className="rounded-none text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function DiscountCodesSection() {
  const { data, isLoading, refetch } = useQuery(codigosAdminQueryOptions());
  const [creating, setCreating] = useState(false);
  const [nuevo, setNuevo] = useState<{ codigo: string; tipo: TipoDescuento; valor: string; expira_at: string }>({
    codigo: "", tipo: "porcentaje", valor: "", expira_at: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = Number(nuevo.valor);
    if (!nuevo.codigo.trim()) return toast.error("Código requerido");
    if (!Number.isFinite(valor) || valor <= 0) return toast.error("Valor inválido");
    if (nuevo.tipo === "porcentaje" && valor > 100) return toast.error("Porcentaje máximo: 100");
    setCreating(true);
    try {
      await crearCodigo({
        codigo: nuevo.codigo,
        tipo: nuevo.tipo,
        valor,
        activo: true,
        expira_at: nuevo.expira_at ? new Date(nuevo.expira_at).toISOString() : null,
      });
      toast.success("Código creado");
      setNuevo({ codigo: "", tipo: "porcentaje", valor: "", expira_at: "" });
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mt-16">
      <h2 className="font-serif text-3xl mb-2">Códigos de descuento</h2>
      <p className="text-muted-foreground mb-8">Creá códigos por porcentaje o monto fijo. Podés desactivarlos sin borrarlos.</p>

      <form onSubmit={handleCreate} className="border border-border p-4 space-y-4 mb-8">
        <h3 className="font-medium flex items-center gap-2"><Plus className="h-4 w-4" /> Nuevo código</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Código (ej: VERANO10)" value={nuevo.codigo} onChange={(v) => setNuevo({ ...nuevo, codigo: v.toUpperCase() })} />
          <div>
            <label className="text-xs uppercase tracking-brand text-muted-foreground block mb-2">Tipo</label>
            <select
              value={nuevo.tipo}
              onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value as TipoDescuento })}
              className="w-full h-10 px-3 bg-background border border-border rounded-none text-sm"
            >
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="monto_fijo">Monto fijo ($)</option>
            </select>
          </div>
          <Field
            label={nuevo.tipo === "porcentaje" ? "Valor (%)" : "Valor ($)"}
            value={nuevo.valor}
            onChange={(v) => setNuevo({ ...nuevo, valor: v })}
            type="number"
          />
          <div>
            <label className="text-xs uppercase tracking-brand text-muted-foreground block mb-2">Vence (opcional)</label>
            <Input
              type="datetime-local"
              value={nuevo.expira_at}
              onChange={(e) => setNuevo({ ...nuevo, expira_at: e.target.value })}
              className="bg-background border-border rounded-none"
            />
          </div>
        </div>
        <Button type="submit" variant="hero" disabled={creating}>
          {creating && <Loader2 className="h-4 w-4 animate-spin" />}
          Crear código
        </Button>
      </form>

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay códigos cargados.</p>
      ) : (
        <div className="space-y-3">
          {data.map((c) => (
            <CodigoRow key={c.id} codigo={c} onChanged={() => refetch()} />
          ))}
        </div>
      )}
    </div>
  );
}

function CodigoRow({ codigo, onChanged }: { codigo: CodigoDescuento; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    codigo: codigo.codigo,
    tipo: codigo.tipo,
    valor: String(codigo.valor),
    expira_at: codigo.expira_at ? codigo.expira_at.slice(0, 16) : "",
  });

  const toggleActivo = async () => {
    try {
      await actualizarCodigo(codigo.id, { activo: !codigo.activo });
      toast.success(codigo.activo ? "Código desactivado" : "Código activado");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const handleEliminar = async () => {
    if (!confirm(`¿Eliminar el código ${codigo.codigo}?`)) return;
    try {
      await eliminarCodigo(codigo.id);
      toast.success("Código eliminado");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const handleGuardar = async () => {
    const valor = Number(form.valor);
    if (!form.codigo.trim()) return toast.error("Código requerido");
    if (!Number.isFinite(valor) || valor <= 0) return toast.error("Valor inválido");
    if (form.tipo === "porcentaje" && valor > 100) return toast.error("Porcentaje máximo: 100");
    setSaving(true);
    try {
      await actualizarCodigo(codigo.id, {
        codigo: form.codigo,
        tipo: form.tipo,
        valor,
        expira_at: form.expira_at ? new Date(form.expira_at).toISOString() : null,
      });
      toast.success("Código actualizado");
      setEditing(false);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const venceTxt = codigo.expira_at
    ? new Date(codigo.expira_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })
    : "Sin vencimiento";
  const vencido = codigo.expira_at ? new Date(codigo.expira_at) <= new Date() : false;

  if (editing) {
    return (
      <div className="border border-border p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Código" value={form.codigo} onChange={(v) => setForm({ ...form, codigo: v.toUpperCase() })} />
          <div>
            <label className="text-xs uppercase tracking-brand text-muted-foreground block mb-2">Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoDescuento })}
              className="w-full h-10 px-3 bg-background border border-border rounded-none text-sm"
            >
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="monto_fijo">Monto fijo ($)</option>
            </select>
          </div>
          <Field label="Valor" value={form.valor} onChange={(v) => setForm({ ...form, valor: v })} type="number" />
          <div>
            <label className="text-xs uppercase tracking-brand text-muted-foreground block mb-2">Vence (opcional)</label>
            <Input
              type="datetime-local"
              value={form.expira_at}
              onChange={(e) => setForm({ ...form, expira_at: e.target.value })}
              className="bg-background border-border rounded-none"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="hero" onClick={handleGuardar} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
          </Button>
          <Button type="button" variant="outline" onClick={() => setEditing(false)} className="rounded-none">Cancelar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-medium">{codigo.codigo}</span>
          <span className="text-xs px-2 py-0.5 border border-border">
            {codigo.tipo === "porcentaje" ? `${codigo.valor}%` : `$${codigo.valor}`}
          </span>
          <span className={`text-xs px-2 py-0.5 ${codigo.activo ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
            {codigo.activo ? "Activo" : "Inactivo"}
          </span>
          {vencido && <span className="text-xs px-2 py-0.5 bg-destructive text-destructive-foreground">Vencido</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Vence: {venceTxt}</p>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={toggleActivo} className="rounded-none">
          {codigo.activo ? "Desactivar" : "Activar"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setEditing(true)} className="rounded-none">Editar</Button>
        <Button type="button" variant="outline" onClick={handleEliminar} className="rounded-none text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

const IMAGE_FIELDS: { key: SiteImageKey; label: string; description: string }[] = [
  { key: "home_hero", label: "Inicio · Hero principal", description: "Imagen grande superior de la página de inicio." },
  { key: "home_editorial", label: "Inicio · Bloque editorial", description: "Imagen del bloque 'Hecho para perdurar' en la página de inicio." },
  { key: "auth_side", label: "Login / Registro · Imagen lateral", description: "Imagen que se muestra al iniciar sesión o crear una cuenta." },
];

function SiteImagesSection() {
  const { data, isLoading, refetch } = useQuery(siteImagesQueryOptions());

  return (
    <div className="mt-16">
      <h2 className="font-serif text-3xl mb-2">Imágenes del sitio</h2>
      <p className="text-muted-foreground mb-8">Reemplazá las fotos que aparecen en el inicio y en el login.</p>
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <div className="space-y-8">
          {IMAGE_FIELDS.map((f) => (
            <ImageRow
              key={f.key}
              label={f.label}
              description={f.description}
              current={data?.[f.key]?.url ?? ""}
              alt={data?.[f.key]?.alt ?? ""}
              onUpdated={() => refetch()}
              imageKey={f.key}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ImageRow({
  label, description, current, alt, imageKey, onUpdated,
}: {
  label: string;
  description: string;
  current: string;
  alt: string;
  imageKey: SiteImageKey;
  onUpdated: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [altValue, setAltValue] = useState(alt);

  useEffect(() => { setAltValue(alt); }, [alt]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      await updateSiteImage(imageKey, { url });
      toast.success("Imagen actualizada");
      onUpdated();
    } catch (err) {
      console.error("[SiteImage] upload/update error", err);
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : "Error al subir";
      toast.error(msg);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const saveAlt = async () => {
    try {
      await updateSiteImage(imageKey, { alt: altValue });
      toast.success("Texto alternativo guardado");
      onUpdated();
    } catch (err) {
      console.error("[SiteImage] alt update error", err);
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : "Error al guardar";
      toast.error(msg);
    }
  };

  return (
    <div className="border border-border p-4 flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-48 aspect-[4/5] bg-secondary/30 overflow-hidden flex items-center justify-center shrink-0">
        {current ? (
          <img src={current} alt={altValue} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-muted-foreground">Sin imagen</span>
        )}
      </div>
      <div className="flex-1 space-y-3">
        <div>
          <h3 className="font-medium">{label}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div>
          <label className="text-xs uppercase tracking-brand text-muted-foreground block mb-2">Texto alternativo (alt)</label>
          <div className="flex gap-2">
            <Input value={altValue} onChange={(e) => setAltValue(e.target.value)} className="bg-background border-border rounded-none" />
            <Button type="button" variant="outline" onClick={saveAlt} className="rounded-none">Guardar</Button>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <Button type="button" variant="hero" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Subiendo…" : "Reemplazar imagen"}
          </Button>
          <span className="text-xs text-muted-foreground">JPG, PNG, WEBP o AVIF · máx 5MB</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-brand text-muted-foreground block mb-2">{label}</label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="bg-background border-border rounded-none" />
    </div>
  );
}
