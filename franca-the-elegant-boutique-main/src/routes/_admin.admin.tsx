import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { claimFirstAdmin, promoteUserToAdmin, useIsAdmin } from "@/lib/admin";

export const Route = createFileRoute("/_admin/admin")({
  head: () => ({ meta: [{ title: "Panel admin — Franca" }] }),
  component: AdminSection,
});

function AdminSection() {
  const { location } = useRouterState();
  if (location.pathname !== "/admin") return <Outlet />;
  return <AdminHome />;
}

function AdminHome() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const { isAdmin, adminCount, loading: adminLoading } = useIsAdmin();

  const handleClaim = async () => {
    setBusy(true);
    try {
      const ok = await claimFirstAdmin();
      if (ok) {
        toast.success("¡Listo! Sos administrador. Refrescá la página.");
        setTimeout(() => window.location.reload(), 800);
      } else {
        toast.info("Ya existe un administrador en el sistema.");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Error");
    } finally {
      setBusy(false);
    }
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await promoteUserToAdmin(email.trim());
      toast.success(`Usuario ${email} promovido a admin.`);
      setEmail("");
    } catch (e: any) {
      toast.error(e.message ?? "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-editorial py-12 md:py-16 max-w-3xl">
      <span className="text-xs uppercase tracking-brand text-muted-foreground">Administración</span>
      <h1 className="font-serif text-4xl md:text-5xl mt-3">Panel</h1>
      <p className="text-muted-foreground mt-4">Gestioná el catálogo de Franca y los administradores.</p>

      {!adminLoading && !isAdmin && adminCount === 0 && (
        <div className="mt-8 border border-border p-6 text-left">
          <h2 className="font-serif text-2xl">Activar primer administrador</h2>
          <p className="text-sm text-muted-foreground mt-2">
            No hay administradores activos. Reclamá el rol para tu cuenta actual y después vas a poder crear y editar productos.
          </p>
          <Button onClick={handleClaim} disabled={busy} variant="hero" size="lg" className="mt-4">
            Reclamar rol de admin
          </Button>
        </div>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Link to="/admin/productos" className="border border-border p-8 hover:bg-muted/40 transition-colors">
          <h2 className="font-serif text-2xl">Productos</h2>
          <p className="text-sm text-muted-foreground mt-2">Listar, editar y eliminar piezas del catálogo.</p>
        </Link>
        <Link to="/admin/productos/nuevo" className="border border-border p-8 hover:bg-muted/40 transition-colors">
          <h2 className="font-serif text-2xl">Nuevo producto</h2>
          <p className="text-sm text-muted-foreground mt-2">Subí una nueva prenda al catálogo.</p>
        </Link>
        <Link to="/admin/pedidos" className="border border-border p-8 hover:bg-muted/40 transition-colors">
          <h2 className="font-serif text-2xl">Pedidos</h2>
          <p className="text-sm text-muted-foreground mt-2">Ver pedidos, comprobantes y actualizar estados.</p>
        </Link>
        <Link to="/admin/configuracion" className="border border-border p-8 hover:bg-muted/40 transition-colors">
          <h2 className="font-serif text-2xl">Configuración</h2>
          <p className="text-sm text-muted-foreground mt-2">Editar datos bancarios visibles en el checkout.</p>
        </Link>
      </div>

      {isAdmin && (
      <div className="mt-12 border-t border-border pt-10">
        <h2 className="font-serif text-2xl">Promover otro administrador</h2>
        <form onSubmit={handlePromote} className="mt-4 flex flex-col sm:flex-row gap-3 max-w-xl">
          <div className="flex-1">
            <Label htmlFor="email" className="sr-only">Email</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="email@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy} variant="hero" size="lg">Promover</Button>
        </form>
        <p className="text-xs text-muted-foreground mt-3">
          El usuario debe estar registrado previamente.
        </p>
      </div>
      )}
    </div>
  );
}
