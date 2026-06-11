import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Franca." },
      { name: "description", content: "Franca · ropa premium, minimalista y atemporal. Comprá por WhatsApp." },
      { property: "og:title", content: "Franca — Indumentaria atemporal" },
      { property: "og:description", content: "Franca · ropa premium, minimalista y atemporal. Comprá por WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Franca — Indumentaria atemporal" },
      { name: "twitter:description", content: "Franca · ropa premium, minimalista y atemporal. Comprá por WhatsApp." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/09c93d80-ba1a-4538-8841-30211c652213/id-preview-f2f06850--0ea35daa-3776-4384-a7bf-44a57a85dd13.lovable.app-1777227819736.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/09c93d80-ba1a-4538-8841-30211c652213/id-preview-f2f06850--0ea35daa-3776-4384-a7bf-44a57a85dd13.lovable.app-1777227819736.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster position="bottom-right" />

        {/* ---> ACÁ AGREGUÉ LA BURBUJA <--- */}
        <a 
          className="whatsapp" 
          target="_blank" 
          rel="noreferrer"
          aria-label="WhatsApp" 
          href="https://wa.me/5492364453681?text=Hola!%20Estuve%20visitando%20la%20pagina%20oficial%20de%20Franca.%20Me%20gustar%C3%ADa%20hacer%20una%20consulta"
        >
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M20.52 3.48A11.78 11.78 0 0012 0C5.37 0 .02 5.34.02 12 0 14.12.52 16.12 1.5 17.82L0 24l6.5-1.5A11.94 11.94 0 0012 24c6.63 0 12-5.37 12-12 0-3.2-1.24-6.15-3.48-8.52zM12 21.5c-1.83 0-3.61-.5-5.15-1.45l-.37-.23-3.86.9.86-3.75-.24-.38A9.6 9.6 0 012.5 12c0-5.24 4.26-9.5 9.5-9.5S21.5 6.76 21.5 12 17.24 21.5 12 21.5zM17.4 14.33c-.28-.14-1.66-.82-1.9-.91-.25-.09-.43-.14-.61.14-.18.28-.71.91-.87 1.1-.16.18-.31.2-.59.07-.28-.14-1.18-.44-2.25-1.38-.83-.7-1.39-1.57-1.55-1.84-.16-.27-.02-.42.12-.56.12-.12.28-.31.42-.46.14-.14.18-.25.28-.41.09-.16.05-.3-.02-.44-.07-.14-.61-1.48-.83-2.03-.22-.53-.44-.46-.61-.47-.16-.01-.35-.01-.54-.01s-.44.06-.67.31c-.23.25-.88.86-.88 2.09 0 1.23.9 2.42 1.02 2.59.12.18 1.78 2.88 4.32 3.92 1.54.66 2.74.84 3.68.68.56-.09 1.66-.68 1.9-1.33.24-.65.24-1.21.17-1.33-.07-.12-.25-.17-.53-.31z"/>
          </svg>
        </a>
        {/* -------------------------------- */}

      </AuthProvider>
    </QueryClientProvider>
  );
}
