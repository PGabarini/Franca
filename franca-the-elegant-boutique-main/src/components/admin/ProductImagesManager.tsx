import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2, Plus, ArrowUp, ArrowDown, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  listProductImages, addProductImage, updateProductImage, deleteProductImage,
} from "@/server/admin.functions";
import { getAccessToken } from "@/lib/auth-headers";
import { resolveImg } from "@/lib/products";
import { uploadProductImage } from "@/lib/upload";

type Img = { id: string; producto_id: string; url: string; alt: string; orden: number };

export function ProductImagesManager({ productoId }: { productoId: string }) {
  const [imgs, setImgs] = useState<Img[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [newAlt, setNewAlt] = useState("");
  const [uploading, setUploading] = useState(false);

  const listFn = useServerFn(listProductImages);
  const addFn = useServerFn(addProductImage);
  const updateFn = useServerFn(updateProductImage);
  const deleteFn = useServerFn(deleteProductImage);

  const reload = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const rows = await listFn({ data: { accessToken: token, productoId } });
      setImgs(rows as Img[]);
    } catch (e: any) {
      toast.error(e?.message ?? "Error al cargar imágenes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [productoId]);

  const addImage = async (url: string, alt: string) => {
    const token = await getAccessToken();
    const orden = (imgs[imgs.length - 1]?.orden ?? -1) + 1;
    await addFn({ data: { accessToken: token, image: { producto_id: productoId, url, alt, orden } } });
  };

  const handleAdd = async () => {
    if (!newUrl.trim()) return;
    setBusyId("__new");
    try {
      await addImage(newUrl.trim(), newAlt.trim());
      setNewUrl("");
      setNewAlt("");
      toast.success("Imagen agregada");
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al agregar imagen");
    } finally {
      setBusyId(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setBusyId("__new");
    try {
      for (const file of files) {
        const url = await uploadProductImage(file);
        await addImage(url, newAlt.trim());
      }
      setNewAlt("");
      toast.success(files.length > 1 ? `${files.length} imágenes subidas` : "Imagen subida");
      await reload();
    } catch (err: any) {
      toast.error(err?.message ?? "Error al subir imagen");
    } finally {
      setUploading(false);
      setBusyId(null);
      e.target.value = "";
    }
  };

  const handleSave = async (img: Img) => {
    setBusyId(img.id);
    try {
      const token = await getAccessToken();
      await updateFn({ data: { accessToken: token, image: { id: img.id, url: img.url, alt: img.alt, orden: img.orden } } });
      toast.success("Imagen actualizada");
    } catch (e: any) {
      toast.error(e?.message ?? "Error al guardar");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta imagen?")) return;
    setBusyId(id);
    try {
      const token = await getAccessToken();
      await deleteFn({ data: { accessToken: token, id } });
      toast.success("Imagen eliminada");
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al eliminar");
    } finally {
      setBusyId(null);
    }
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= imgs.length) return;
    const a = imgs[i], b = imgs[j];
    setBusyId(a.id);
    try {
      const token = await getAccessToken();
      await updateFn({ data: { accessToken: token, image: { id: a.id, orden: b.orden } } });
      await updateFn({ data: { accessToken: token, image: { id: b.id, orden: a.orden } } });
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al reordenar");
    } finally {
      setBusyId(null);
    }
  };

  const update = (id: string, patch: Partial<Img>) =>
    setImgs((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  return (
    <div className="border-t border-border pt-6 mt-2 grid gap-4">
      <div>
        <h3 className="font-serif text-2xl">Galería de imágenes</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Estas imágenes se muestran en la ficha del producto, debajo de la imagen principal. Usá <code>p1</code>…<code>p8</code> o una URL pública.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : imgs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay imágenes adicionales.</p>
      ) : (
        <div className="grid gap-3">
          {imgs.map((img, i) => (
            <div key={img.id} className="grid grid-cols-[80px_1fr_auto] gap-3 items-start border border-border p-3">
              <div className="w-20 h-24 bg-secondary/40">
                <img src={resolveImg(img.url)} alt={img.alt} className="h-full w-full object-cover" />
              </div>
              <div className="grid gap-2">
                <Input value={img.url} onChange={(e) => update(img.id, { url: e.target.value })} placeholder="p2 o https://..." />
                <Input value={img.alt} onChange={(e) => update(img.id, { alt: e.target.value })} placeholder='Alt: "Vista frontal"' />
              </div>
              <div className="flex flex-col gap-1">
                <Button type="button" size="icon" variant="outline" onClick={() => move(i, -1)} disabled={i === 0 || busyId !== null} aria-label="Subir">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="outline" onClick={() => move(i, 1)} disabled={i === imgs.length - 1 || busyId !== null} aria-label="Bajar">
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="outline" onClick={() => handleSave(img)} disabled={busyId === img.id} aria-label="Guardar">
                  <Save className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="outline" onClick={() => handleDelete(img.id)} disabled={busyId === img.id} aria-label="Eliminar">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 border border-dashed border-border p-3">
        <Label className="text-xs uppercase tracking-brand">Agregar imagen</Label>

        <Input value={newAlt} onChange={(e) => setNewAlt(e.target.value)} placeholder='Alt (opcional): "Espalda"' />

        <label className="inline-flex">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading || busyId !== null}
          />
          <span className={`inline-flex items-center justify-center gap-2 h-10 px-4 border border-border cursor-pointer text-sm w-full ${uploading ? "opacity-50 pointer-events-none" : "hover:bg-secondary/40"}`}>
            <Upload className="h-4 w-4" />
            {uploading ? "Subiendo…" : "Subir desde tu PC (JPG/PNG/WEBP, máx. 5MB)"}
          </span>
        </label>

        <div className="text-xs text-muted-foreground text-center">o pegá una URL</div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." />
          <Button type="button" onClick={handleAdd} disabled={busyId !== null || !newUrl.trim()}>
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}
