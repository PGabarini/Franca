import { createFileRoute } from "@tanstack/react-router";
import { ProductoForm } from "@/components/admin/ProductoForm";

export const Route = createFileRoute("/_admin/admin/productos/nuevo")({
  head: () => ({ meta: [{ title: "Nuevo producto — Admin Franca" }] }),
  component: NuevoProducto,
});

function NuevoProducto() {
  return (
    <div className="container-editorial py-12">
      <span className="text-xs uppercase tracking-brand text-muted-foreground">Catálogo</span>
      <h1 className="font-serif text-4xl mt-2 mb-10">Nuevo producto</h1>
      <ProductoForm mode="create" />
    </div>
  );
}
