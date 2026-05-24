import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice, resolveImg } from "@/lib/products";
import { Pencil, Trash2 } from "lucide-react";
import { deleteAdminProduct, listAdminProducts } from "@/server/admin.functions";
import { getAccessToken } from "@/lib/auth-headers";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_admin/admin/productos")({
  head: () => ({ meta: [{ title: "Productos — Admin Franca" }] }),
  component: ProductosSection,
});

function ProductosSection() {
  const { location } = useRouterState();
  if (location.pathname !== "/admin/productos") return <Outlet />;
  return <AdminProductos />;
}

type Row = {
  id: string; slug: string; nombre: string; precio: number; costo: number | null;
  stock: number; categoria: string; activo: boolean; destacado: boolean;
  imagen_url: string;
};

function AdminProductos() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setErrMsg(null);
      try {
        const data = await listAdminProducts({ data: { accessToken: await getAccessToken() } });
        if (cancel) return;
        setRows((data ?? []).map((r: any) => ({ ...r, precio: Number(r.precio), costo: r.costo == null ? null : Number(r.costo) })));
      } catch (error: any) {
        if (cancel) return;
        console.error("[admin/productos] error:", error);
        setErrMsg(error?.message ?? "Error al cargar productos");
        toast.error(error?.message ?? "Error al cargar productos");
        setRows([]);
      }
    })();
    return () => { cancel = true; };
  }, [reloadKey]);

  const onDelete = async (id: string) => {
    try {
      await deleteAdminProduct({ data: { id, accessToken: await getAccessToken() } });
    } catch (error: any) {
      toast.error(error?.message ?? "Error al eliminar");
      return;
    }
    toast.success("Producto eliminado");
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="container-editorial py-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="text-xs uppercase tracking-brand text-muted-foreground">Catálogo</span>
          <h1 className="font-serif text-4xl mt-2">Productos</h1>
        </div>
        <Button asChild variant="hero" size="lg">
          <Link to="/admin/productos/nuevo">Nuevo</Link>
        </Button>
      </div>

      {rows === null ? (
        <p className="text-muted-foreground text-sm">Cargando…</p>
      ) : errMsg ? (
        <div className="border border-destructive/40 bg-destructive/5 p-6">
          <p className="text-sm font-medium">No se pudieron cargar los productos.</p>
          <p className="text-xs text-muted-foreground mt-2 break-all">{errMsg}</p>
          <button onClick={() => setReloadKey((k) => k + 1)} className="mt-4 text-xs underline tracking-brand uppercase">
            Reintentar
          </button>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No hay productos.</p>
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="text-right">Margen</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <img
                      src={resolveImg(p.imagen_url)}
                      alt=""
                      className="w-12 h-12 object-cover bg-muted"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{p.nombre}</div>
                    <div className="text-xs text-muted-foreground">{p.slug}</div>
                  </TableCell>
                  <TableCell>{p.categoria}</TableCell>
                  <TableCell className="text-right">{formatPrice(p.precio)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {p.costo != null ? formatPrice(p.costo) : "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {p.costo != null && p.costo > 0 && p.precio > 0
                      ? `${Math.round(((p.precio - p.costo) / p.precio) * 100)}%`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">{p.stock}</TableCell>
                  <TableCell>
                    <span className={p.activo ? "text-foreground" : "text-muted-foreground"}>
                      {p.activo ? "Activo" : "Inactivo"}
                    </span>
                    {p.destacado && <span className="ml-2 text-xs uppercase tracking-brand">★</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to="/admin/productos/$id" params={{ id: p.id }}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará "{p.nombre}" del catálogo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(p.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
