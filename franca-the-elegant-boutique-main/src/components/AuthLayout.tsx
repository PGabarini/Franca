import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BRAND } from "@/lib/config";
import editorial from "@/assets/editorial.jpg";
import { siteImagesQueryOptions } from "@/lib/site-images";
import type { ReactNode } from "react";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { data: siteImages } = useQuery(siteImagesQueryOptions());
  const sideImg = siteImages?.auth_side?.url || editorial;
  const sideAlt = siteImages?.auth_side?.alt || "";
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Visual */}
      <div className="relative hidden lg:block overflow-hidden">
        <img src={sideImg} alt={sideAlt} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/40 via-foreground/10 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-cream">
          <Link to="/" className="font-wordmark text-3xl text-cream">{BRAND.name}</Link>
          <div className="max-w-sm">
            <p className="font-serif text-3xl leading-snug">
              "Vestir con calma. Comprar con intención."
            </p>
            <p className="mt-3 text-sm tracking-brand uppercase opacity-80">— {BRAND.name}</p>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex flex-col">
        <div className="lg:hidden p-6 flex justify-center border-b border-border">
          <Link to="/" className="font-wordmark text-2xl text-primary">{BRAND.name}</Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm fade-up">
            <h1 className="font-serif text-3xl md:text-4xl">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            )}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
