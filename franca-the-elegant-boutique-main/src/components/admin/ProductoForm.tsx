import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES } from "@/lib/products";
import { categoriasQueryOptions } from "@/lib/categorias";
import { createAdminProduct, updateAdminProduct } from "@/server/admin.functions";
import { getAccessToken } from "@/lib/auth-headers";
import { ProductImagesManager } from "./ProductImagesManager";
import { uploadProductImage } from "@/lib/upload";
import { resolveImg } from "@/lib/products";
import { Upload, X } from "lucide-react";

function ColoresEditor({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const addOne = (raw: string) => {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    const merged = [...value];
    for (const p of parts) {
      if (p.length > 60) continue;
      if (!merged.some((c) => c.toLowerCase() === p.toLowerCase())) merged.push(p);
      if (merged.length >= 20) break;
    }
    onChange(merged);
    setDraft("");
  };
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  return (
    <div className="grid gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((c, i) => (
            <span key={`${c}-${i}`} className="inline-flex items-center gap-1.5 h-8 pl-3 pr-1 border border-border bg-secondary/40 text-sm">
              {c}
              <button type="button" onClick={() => remove(i)} className="h-6 w-6 grid place-items-center hover:bg-secondary" aria-label={`Quitar ${c}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addOne(draft);
            } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
              remove(value.length - 1);
            }
          }}
          onBlur={() => draft.trim() && addOne(draft)}
          placeholder="Ej: Camel"
          maxLength={60}
          disabled={value.length >= 20}
        />
        <Button type="button" variant="outline" onClick={() => addOne(draft)} disabled={!draft.trim() || value.length >= 20}>
          Agregar
        </Button>
      </div>
    </div>
  );
}

const TALLES_DISPONIBLES = ["XS", "S", "M", "L", "XL", "Único"];

export type ProductoFormValues = {
  id?: string;
  slug: string;
  nombre: string;
  descripcion: string;
  precio: number;
  costo: number | null;
  stock: number;
  imagen_url: string;
  categoria: string;
  talles: string[];
  color: string[];
  destacado: boolean;
  activo: boolean;
  talles_medidas: Record<string, string>;
};

const schema = z.object({
  slug: z.string().trim().min(1, "Slug requerido").max(80).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  nombre: z.string().trim().min(1).max(120),
  descripcion: z.string().trim().max(2000),
  precio: z.number().min(0).max(99999999),
  costo: z.number().min(0).max(99999999).nullable(),
  stock: z.number().int().min(0).max(99999),
  imagen_url: z.string().trim().min(1, "Imagen requerida").max(500),
  categoria: z.string().trim().min(1, "Categoría requerida").max(60),
  talles: z.array(z.string()).min(1, "Elegí al menos un talle"),
  color: z.array(z.string().trim().min(1).max(60)).max(20),
  destacado: z.boolean(),
  activo: z.boolean(),
  talles_medidas: z.record(z.string(), z.string().max(500)),
});

const empty: ProductoFormValues = {
  slug: "", nombre: "", descripcion: "", precio: 0, costo: null, stock: 0,
  imagen_url: "p1", categoria: "Sweaters", talles: [], color: [],
  destacado: false, activo: true, talles_medidas: {},
};

export function ProductoForm({ initial, mode }: { initial?: ProductoFormValues; mode: "create" | "edit" }) {
  const [v, setV] = useState<ProductoFormValues>(initial ?? empty);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const createProduct = useServerFn(createAdminProduct);
  const updateProduct = useServerFn(updateAdminProduct);
  const { data: categoriasDb } = useQuery(categoriasQueryOptions());
  const categoriasOpts = (categoriasDb && categoriasDb.length > 0
    ? categoriasDb.map((c) => c.nombre)
    : CATEGORIES);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      setV((s) => ({ ...s, imagen_url: url }));
      toast.success("Imagen subida");
    } catch (err: any) {
      toast.error(err?.message ?? "Error al subir imagen");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const set = <K extends keyof ProductoFormValues>(k: K, val: ProductoFormValues[K]) =>
    setV((s) => ({ ...s, [k]: val }));

  const slugify = (s: string) =>
    s.normalize("NFD").replace(/\p{Diacritic}/gu, "")
      .toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

  const setNombre = (val: string) => {
    setV((s) => {
      const autoSlug = slugify(val);
      // Auto-actualizar slug si estaba vacío o coincidía con el slug auto del nombre anterior
      const next = { ...s, nombre: val };
      if (!s.slug || s.slug === slugify(s.nombre)) next.slug = autoSlug;
      return next;
    });
  };

  const toggleTalle = (t: string) =>
    set("talles", v.talles.includes(t) ? v.talles.filter((x) => x !== t) : [...v.talles, t]);

  const FIELD_LABELS: Record<string, string> = {
    slug: "Slug (URL)", nombre: "Nombre", descripcion: "Descripción",
    precio: "Precio", costo: "Costo", stock: "Stock",
    imagen_url: "Imagen principal", categoria: "Categoría",
    talles: "Talles", color: "Colores",
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(v);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path[0] as string | undefined;
      const label = field && FIELD_LABELS[field] ? FIELD_LABELS[field] : field ?? "";
      toast.error(label ? `${label}: ${issue?.message}` : (issue?.message ?? "Datos inválidos"));
      return;
    }
    setBusy(true);
    try {
      // Validar imagen_url: clave p1..p8 o URL http(s)
      const img = parsed.data.imagen_url.trim();
      const validImg = /^p[1-8]$/.test(img) || /^https?:\/\//i.test(img);
      if (!validImg) {
        toast.error("Imagen inválida: usá p1..p8 o una URL http(s)://");
        setBusy(false);
        return;
      }
      // Mantener solo medidas de talles seleccionados y no vacías
      const cleanMedidas: Record<string, string> = {};
      for (const t of parsed.data.talles) {
        const m = (parsed.data.talles_medidas?.[t] ?? "").trim();
        if (m) cleanMedidas[t] = m;
      }
      const productPayload = { ...parsed.data, talles_medidas: cleanMedidas };
      if (mode === "create") {
        await createProduct({ data: { product: productPayload, accessToken: await getAccessToken() } });
        toast.success("Producto creado");
        navigate({ to: "/admin/productos" });
      } else {
        await updateProduct({ data: { product: { ...productPayload, id: v.id! }, accessToken: await getAccessToken() } });
        toast.success("Producto actualizado");
        navigate({ to: "/admin/productos" });
      }
    } catch (e: any) {
      console.error("[ProductoForm] error:", e);
      const msg: string = e?.message ?? "Error al guardar";
      if (/row-level security|permission|denied/i.test(msg)) {
        toast.error("Sin permiso. Tu sesión puede haber expirado o tu cuenta no es admin.");
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-6 max-w-3xl">
      <div className="grid gap-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" value={v.nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="slug">Slug (URL)</Label>
        <Input
          id="slug"
          value={v.slug}
          onChange={(e) => set("slug", e.target.value)}
          onBlur={(e) => set("slug", slugify(e.target.value))}
          placeholder="se-genera-desde-el-nombre"
        />
        <p className="text-xs text-muted-foreground">Se genera automáticamente desde el nombre. Solo minúsculas, números y guiones.</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea id="descripcion" rows={4} value={v.descripcion} onChange={(e) => set("descripcion", e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="precio">Precio (ARS)</Label>
          <Input id="precio" type="number" min={0} value={v.precio}
            onChange={(e) => set("precio", Number(e.target.value))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="stock">Stock</Label>
          <Input id="stock" type="number" min={0} value={v.stock}
            onChange={(e) => set("stock", Number(e.target.value))} />
        </div>
      </div>

      <div className="grid gap-2 border border-dashed border-border p-4 bg-secondary/20">
        <Label htmlFor="costo">Costo (interno · solo admin)</Label>
        <Input
          id="costo"
          type="number"
          min={0}
          step="0.01"
          value={v.costo ?? ""}
          onChange={(e) => set("costo", e.target.value === "" ? null : Number(e.target.value))}
          placeholder="Costo de la prenda"
        />
        <p className="text-xs text-muted-foreground">
          Este dato no se muestra en la tienda. Solo lo ven los administradores.
          {v.costo != null && v.costo > 0 && v.precio > 0 && (
            <> · Margen: {Math.round(((v.precio - v.costo) / v.precio) * 100)}%</>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="categoria">Categoría</Label>
          <select id="categoria" value={v.categoria}
            onChange={(e) => set("categoria", e.target.value)}
            className="h-10 px-3 border border-border bg-transparent text-sm">
            {!categoriasOpts.includes(v.categoria) && v.categoria && (
              <option value={v.categoria}>{v.categoria}</option>
            )}
            {categoriasOpts.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="color">Colores disponibles</Label>
          <ColoresEditor
            value={v.color}
            onChange={(next) => set("color", next)}
          />
          <p className="text-xs text-muted-foreground">Escribí un color y presioná Enter (o coma) para agregarlo. Hasta 20 colores.</p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Imagen principal</Label>
        <div className="flex items-start gap-4">
          <div className="w-28 h-32 bg-secondary/40 border border-border overflow-hidden shrink-0">
            {v.imagen_url ? (
              <img src={resolveImg(v.imagen_url)} alt="Vista previa" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">Sin imagen</div>
            )}
          </div>
          <div className="grid gap-2 flex-1">
            <label className="inline-flex">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <span className={`inline-flex items-center gap-2 h-10 px-4 border border-border cursor-pointer text-sm ${uploading ? "opacity-50 pointer-events-none" : "hover:bg-secondary/40"}`}>
                <Upload className="h-4 w-4" />
                {uploading ? "Subiendo…" : "Subir desde tu PC"}
              </span>
            </label>
            <Input
              id="imagen_url"
              value={v.imagen_url}
              onChange={(e) => set("imagen_url", e.target.value)}
              placeholder="o pegá una URL https://..."
            />
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WEBP o AVIF. Hasta 5MB.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Talles</Label>
        <div className="flex flex-wrap gap-2">
          {TALLES_DISPONIBLES.map((t) => {
            const active = v.talles.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTalle(t)}
                className={`h-10 min-w-12 px-3 text-sm border ${active ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {v.talles.length > 0 && (
        <div className="grid gap-3 border border-border p-4">
          <div>
            <Label>Guía de talles (medidas)</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Para cada talle elegido, especificá las medidas reales (ej. "Pecho 50cm · Largo 65cm · Manga 60cm").
            </p>
          </div>
          <div className="grid gap-3">
            {v.talles.map((t) => (
              <div key={t} className="grid grid-cols-[60px_1fr] items-center gap-3">
                <span className="text-sm font-medium">{t}</span>
                <Input
                  value={v.talles_medidas[t] ?? ""}
                  onChange={(e) =>
                    set("talles_medidas", { ...v.talles_medidas, [t]: e.target.value })
                  }
                  placeholder="Ej: Pecho 50cm · Largo 65cm · Manga 60cm"
                  maxLength={500}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-6 items-center">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={v.destacado} onChange={(e) => set("destacado", e.target.checked)} />
          Destacado
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={v.activo} onChange={(e) => set("activo", e.target.checked)} />
          Activo (visible en tienda)
        </label>
      </div>

      <div className="flex gap-3 pt-4 border-t border-border">
        <Button type="submit" variant="hero" size="lg" disabled={busy}>
          {busy ? "Guardando…" : mode === "create" ? "Crear producto" : "Guardar cambios"}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => navigate({ to: "/admin/productos" })}>
          Cancelar
        </Button>
      </div>

      {mode === "edit" && v.id ? (
        <ProductImagesManager productoId={v.id} />
      ) : (
        <div className="border-t border-border pt-6 mt-2">
          <h3 className="font-serif text-2xl">Galería de imágenes</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Guardá el producto primero. Después vas a poder agregar más fotos (frente, espalda, detalles) desde la edición.
          </p>
        </div>
      )}
    </form>
  );
}

