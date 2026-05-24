import { Ruler } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GENERIC_SIZE_GUIDES } from "@/lib/size-guide";
import type { Categoria } from "@/lib/products";

type Props = {
  talles: string[];
  medidas: Record<string, string>;
  categoria?: Categoria;
};

export function SizeGuide({ talles, medidas, categoria }: Props) {
  const filasProducto = talles.filter((t) => (medidas?.[t] ?? "").trim().length > 0);
  const tieneMedidasProducto = filasProducto.length > 0;

  const generica = !tieneMedidasProducto && categoria ? GENERIC_SIZE_GUIDES[categoria] : undefined;

  if (!tieneMedidasProducto && !generica) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs uppercase tracking-brand underline underline-offset-4 hover:text-foreground text-muted-foreground"
        >
          <Ruler className="h-3.5 w-3.5" /> Guía de talles
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Guía de talles</DialogTitle>
          <DialogDescription>
            {tieneMedidasProducto
              ? "Medidas reales de la prenda para que elijas el talle ideal."
              : "Medidas de referencia para esta categoría. Para más detalle, escribinos."}
          </DialogDescription>
        </DialogHeader>

        {tieneMedidasProducto ? (
          <div className="border border-border">
            <div className="grid grid-cols-[80px_1fr] bg-secondary/40 text-xs uppercase tracking-brand px-3 py-2 border-b border-border">
              <span>Talle</span>
              <span>Medidas</span>
            </div>
            <div className="divide-y divide-border">
              {filasProducto.map((t) => (
                <div key={t} className="grid grid-cols-[80px_1fr] px-3 py-2 text-sm">
                  <span className="font-medium">{t}</span>
                  <span className="text-muted-foreground">{medidas[t]}</span>
                </div>
              ))}
            </div>
          </div>
        ) : generica ? (
          <>
            <div className="border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 text-xs uppercase tracking-brand">
                  <tr>
                    {generica.headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(generica.rows).map(([talle, valores]) => (
                    <tr key={talle}>
                      <td className="px-3 py-2 font-medium">{talle}</td>
                      {valores.map((v, i) => (
                        <td key={i} className="px-3 py-2 text-muted-foreground tabular-nums">{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {generica.nota && (
              <p className="text-xs text-muted-foreground mt-2">{generica.nota}</p>
            )}
            <p className="text-[11px] text-muted-foreground">Medidas en cm.</p>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
