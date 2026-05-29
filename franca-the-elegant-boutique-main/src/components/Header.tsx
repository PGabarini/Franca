import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, Search, Menu, X, User, LogOut, Shield, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/admin";
import { BRAND } from "@/lib/config";
import { cn } from "@/lib/utils";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/", label: "Inicio" },
  { to: "/catalogo", label: "Colección" },
  { to: "/contacto", label: "Contacto" },
];

export function Header() {
  const { count } = useCart();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { location } = useRouterState();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <div className="sticky top-0 z-40 w-full">
      <AnnouncementBar />
      <header
        className={cn(
          "w-full transition-all duration-300 border-b",
          scrolled
            ? "bg-background/95 backdrop-blur border-border"
            : "bg-background border-transparent",
        )}
      >
        <div className="container-editorial relative flex h-14 md:h-16 items-center">
          {/* Left: hamburger + search */}
          <div className="flex items-center gap-3 flex-1">
            <button
              className="-ml-1 p-2 hover:opacity-70 transition-opacity"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menú"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/catalogo" aria-label="Buscar" className="p-2 hidden md:inline-flex hover:opacity-70 transition-opacity">
              <Search className="h-5 w-5" />
            </Link>
          </div>

          {/* Center: wordmark */}
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 font-wordmark text-3xl md:text-4xl text-primary leading-none"
          >
            {BRAND.name}
          </Link>

          {/* Right: account + cart */}
          <div className="flex items-center gap-1 md:gap-2 flex-1 justify-end">
            <Link to="/catalogo" aria-label="Buscar" className="p-2 md:hidden hover:opacity-70 transition-opacity">
              <Search className="h-5 w-5" />
            </Link>
            {user ? (
              <DropdownMenu open={accountOpen} onOpenChange={setAccountOpen}>
                <DropdownMenuTrigger
                  aria-label="Cuenta"
                  className="relative p-2 hover:opacity-70 transition-opacity outline-none"
                  onMouseEnter={() => setAccountOpen(true)}
                >
                  <User className="h-5 w-5 text-primary" strokeWidth={2.25} />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary ring-2 ring-background" aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56"
                  onMouseEnter={() => setAccountOpen(true)}
                  onMouseLeave={() => setAccountOpen(false)}
                >
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-[10px] text-muted-foreground tracking-brand uppercase">Sesión iniciada</p>
                    <p className="truncate text-sm">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="gap-2">
                    <Link to="/favoritos"><Heart className="h-4 w-4" /> Favoritos</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild className="gap-2">
                      <Link to="/admin"><Shield className="h-4 w-4" /> Panel admin</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => signOut()} className="gap-2">
                    <LogOut className="h-4 w-4" /> Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" aria-label="Iniciar sesión" className="p-2 hover:opacity-70 transition-opacity">
                <User className="h-5 w-5" />
              </Link>
            )}
            <Link
              to="/carrito"
              aria-label={count > 0 ? `Carrito, ${count} ${count === 1 ? "artículo" : "artículos"}` : "Carrito"}
              className={cn(
                "relative p-2 rounded-full transition-all duration-300",
                count > 0
                  ? "bg-primary/10 ring-1 ring-primary/30 hover:bg-primary/15"
                  : "hover:opacity-70",
              )}
            >
              <ShoppingBag
                className={cn("h-5 w-5 transition-colors", count > 0 && "text-primary fill-primary/20")}
                strokeWidth={count > 0 ? 2.25 : 2}
              />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center ring-2 ring-background shadow-sm animate-in zoom-in-50 duration-200">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Slide-out menu */}
        {open && (
          <div className="absolute left-0 right-0 top-full border-b border-border bg-background shadow-sm">
            <nav className="container-editorial py-8 flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-brand text-muted-foreground mb-3">Navegar</span>
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to.split("?")[0]}
                  search={n.to.includes("?") ? Object.fromEntries(new URLSearchParams(n.to.split("?")[1])) : undefined}
                  className="font-serif text-2xl md:text-3xl py-2 hover:text-primary transition-colors"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
    </div>
  );
}
