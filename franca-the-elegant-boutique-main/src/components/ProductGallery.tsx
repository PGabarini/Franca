import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/products";

type Props = {
  imagenes: ProductImage[];
  nombre: string;
};

export function ProductGallery({ imagenes, nombre }: Props) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const mainRef = useRef<HTMLDivElement>(null);

  const total = imagenes.length;
  const current = imagenes[index] ?? imagenes[0];
  const hasMany = total > 1;

  const next = () => setIndex((i) => (i + 1) % total);
  const prev = () => setIndex((i) => (i - 1 + total) % total);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, total]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  if (!current) return null;

  return (
    <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4">
      {/* Thumbnails */}
      {hasMany && (
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[640px] md:w-20 shrink-0 pb-1 md:pb-0">
          {imagenes.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={cn(
                "relative shrink-0 w-16 h-20 md:w-full md:h-24 bg-secondary/40 border transition-colors",
                i === index ? "border-foreground" : "border-border hover:border-foreground/50",
              )}
            >
              <img
                src={img.url}
                alt={img.alt || `${nombre} — vista ${i + 1}`}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Imagen principal con zoom hover + click para abrir modal */}
      <div className="flex-1">
        <div
          ref={mainRef}
          className="group relative bg-secondary/40 aspect-[4/5] overflow-hidden cursor-zoom-in"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onMouseMove={onMove}
          onClick={() => setOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="Ampliar imagen"
        >
          <img
            src={current.url}
            alt={current.alt || nombre}
            className={cn(
              "h-full w-full object-cover transition-transform duration-200 ease-out hidden md:block",
              hover ? "scale-150" : "scale-100",
            )}
            style={
              hover
                ? { transformOrigin: `${pos.x}% ${pos.y}%` }
                : undefined
            }
            loading="eager"
          />
          {/* En mobile: imagen sin zoom hover */}
          <img
            src={current.url}
            alt={current.alt || nombre}
            className="h-full w-full object-cover md:hidden"
            loading="eager"
          />

          <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm border border-border h-8 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="h-4 w-4" />
          </div>

          {hasMany && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Imagen anterior"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 bg-background/80 hover:bg-background border border-border flex items-center justify-center"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Imagen siguiente"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 bg-background/80 hover:bg-background border border-border flex items-center justify-center"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/80 border border-border px-2 py-1 text-xs tabular-nums">
                {index + 1} / {total}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal zoom full-screen */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl w-[95vw] p-0 border-0 bg-background/95 backdrop-blur">
          <div className="relative h-[85vh] flex items-center justify-center">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="absolute top-3 right-3 z-10 h-10 w-10 bg-background border border-border flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={current.url}
              alt={current.alt || nombre}
              className="max-h-full max-w-full object-contain"
            />
            {hasMany && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Imagen anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 bg-background border border-border flex items-center justify-center"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Imagen siguiente"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 bg-background border border-border flex items-center justify-center"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background border border-border px-3 py-1 text-xs tabular-nums">
                  {index + 1} / {total}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
