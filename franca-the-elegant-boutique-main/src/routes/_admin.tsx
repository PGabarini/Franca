import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/admin";

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
});

function VerifyingShell() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-muted-foreground text-sm gap-2 p-6 text-center">
      <span>Verificando acceso…</span>
    </div>
  );
}

function RestrictedShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container-editorial py-24 text-center">{children}</main>
      <Footer />
    </div>
  );
}

function AdminLayout() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const { location } = useRouterState();
  const isAdminHome = location.pathname === "/admin";

  if (authLoading || (user && roleLoading)) {
    return <VerifyingShell />;
  }

  if (!user) {
    return (
      <RestrictedShell>
        <span className="text-xs uppercase tracking-brand text-muted-foreground">Acceso restringido</span>
        <h1 className="font-serif text-4xl md:text-5xl mt-3">Iniciá sesión</h1>
        <p className="text-muted-foreground mt-4 max-w-md mx-auto">
          Necesitás una cuenta para acceder al panel de administración.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link to="/login" search={{ redirect: location.pathname }} className="text-sm underline tracking-brand uppercase">
            Iniciar sesión
          </Link>
          <Link to="/registro" className="text-sm underline tracking-brand uppercase">Crear cuenta</Link>
        </div>
      </RestrictedShell>
    );
  }

  if (isAdmin === false && !isAdminHome) {
    return (
      <RestrictedShell>
        <span className="text-xs uppercase tracking-brand text-muted-foreground">Acceso restringido</span>
        <h1 className="font-serif text-4xl md:text-5xl mt-3">Solo administradores</h1>
        <p className="text-muted-foreground mt-4 max-w-md mx-auto">
          Esta sección requiere rol de administrador. Si sos el dueño de la tienda, entrá al panel para reclamar el primer admin.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link to="/admin" className="text-sm underline tracking-brand uppercase">Ir al panel</Link>
          <Link to="/" className="text-sm underline tracking-brand uppercase">Volver al inicio</Link>
        </div>
      </RestrictedShell>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {isAdmin && (
        <div className="border-b border-border">
          <div className="container-editorial flex items-center gap-6 h-12 text-xs uppercase tracking-brand text-muted-foreground">
            <Link to="/admin" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Panel
            </Link>
            <Link to="/admin/productos" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Productos
            </Link>
            <Link to="/admin/productos/nuevo" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Nuevo producto
            </Link>
            <Link to="/admin/pedidos" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Pedidos
            </Link>
            <Link to="/admin/mensajes" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Mensajes
            </Link>
          </div>
        </div>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
