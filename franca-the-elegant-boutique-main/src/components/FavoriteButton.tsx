import { Heart } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { favoritosQueryOptions, agregarFavorito, quitarFavorito } from "@/lib/favoritos";
import { cn } from "@/lib/utils";

type Props = {
  productoId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  onSurface?: boolean; // fondo blanco semitransparente para usar sobre imagen
};

export function FavoriteButton({ productoId, className, size = "md", onSurface = false }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: favs = [] } = useQuery(favoritosQueryOptions(user?.id));
  const isFav = favs.includes(productoId);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not-auth");
      if (isFav) await quitarFavorito(user.id, productoId);
      else await agregarFavorito(user.id, productoId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favoritos", user?.id] });
      toast.success(isFav ? "Quitado de favoritos" : "Agregado a favoritos");
    },
    onError: (e: Error) => {
      if (e.message === "not-auth") {
        toast.error("Iniciá sesión para guardar favoritos");
        navigate({ to: "/login" });
      } else {
        toast.error("No se pudo actualizar favoritos");
      }
    },
  });

  const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-11 w-11" }[size];
  const iconSizes = { sm: "h-4 w-4", md: "h-4 w-4", lg: "h-5 w-5" }[size];

  return (
    <button
      type="button"
      aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); mutation.mutate(); }}
      disabled={mutation.isPending}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-colors",
        sizes,
        onSurface
          ? "bg-background/90 backdrop-blur hover:bg-background shadow-sm"
          : "border border-border hover:border-foreground bg-background",
        className,
      )}
    >
      <Heart
        className={cn(iconSizes, "transition-colors", isFav ? "fill-primary text-primary" : "text-foreground")}
      />
    </button>
  );
}
