import { Link } from "@tanstack/react-router";
import { Instagram, Mail } from "lucide-react";
import { BRAND } from "@/lib/config";

export function Footer() {
  return (
    <footer className="border-t border-border mt-24 bg-secondary/30">
      <div className="container-editorial py-16 grid gap-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="font-wordmark text-5xl text-primary mb-5 leading-none">{BRAND.name}</div>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            {BRAND.tagline}. Piezas pensadas para durar, hechas con materiales nobles y atención al detalle.
          </p>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-brand mb-4">Tienda</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/catalogo" className="hover:text-foreground">Colección</Link></li>
            <li><Link to="/carrito" className="hover:text-foreground">Carrito</Link></li>
            <li><Link to="/contacto" className="hover:text-foreground">Contacto</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-brand mb-4">Información</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/faqs" className="hover:text-foreground">Preguntas frecuentes</Link></li>
            <li><Link to="/cambios-y-devoluciones" className="hover:text-foreground">Cambios y devoluciones</Link></li>
            <li><Link to="/terminos" className="hover:text-foreground">Términos</Link></li>
            <li><Link to="/privacidad" className="hover:text-foreground">Privacidad</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-brand mb-4">Contacto</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> {BRAND.email}</li>
            <a href="https://www.instagram.com/franca2001_/" target="_blank" rel="noopener noreferrer" ><li className="flex items-center gap-2"><Instagram className="h-4 w-4" /> {BRAND.instagram}</li></a>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-editorial py-6 text-xs text-muted-foreground flex flex-col md:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} {BRAND.name} Todos los derechos reservados.</span>
          <span>Hecho con cuidado.</span>
        </div>
      </div>
    </footer>
  );
}
