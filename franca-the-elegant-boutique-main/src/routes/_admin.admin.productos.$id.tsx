import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProductoForm, type ProductoFormValues } from "@/components/admin/ProductoForm";
import { getAdminProduct } from "@/server/admin.functions";
import { getAccessToken } from "@/lib/auth-headers";

export const Route = createFileRoute("/_admin/admin/productos/$id")({
  head: () => ({ meta: [{ title: "Editar producto — Admin Franca" }] }),
  component: EditarProducto,
});

function EditarProducto() {
  const { id } = Route.useParams();
  const [data, setData] = useState<ProductoFormValues | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getAdminProduct({ data: { id, accessToken: await getAccessToken() } }).catch((error: any) => {
        toast.error(error?.message ?? "Error al cargar producto");
        return null;
      });
      if (!data) { setNotFound(true); return; }
      setData({ ...(data as any), precio: Number(data.precio), costo: data.costo == null ? null : Number(data.costo), talles_medidas: (data as any).talles_medidas ?? {} });
    })();
  }, [id]);

  if (notFound) {
    return <div className="container-editorial py-12">Producto no encontrado.</div>;
  }
  if (!data) {
    return <div className="container-editorial py-12 text-muted-foreground">Cargando…</div>;
  }

  return (
    <div className="container-editorial py-12">
      <span className="text-xs uppercase tracking-brand text-muted-foreground">Catálogo</span>
      <h1 className="font-serif text-4xl mt-2 mb-10">Editar producto</h1>
      <ProductoForm mode="edit" initial={data} />
    </div>
  );
}
