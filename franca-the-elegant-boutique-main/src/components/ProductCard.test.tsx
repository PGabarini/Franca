import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

// La tarjeta usa el router y el botón de favoritos (que habla con Supabase): los reemplazamos.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, params }: { children: ReactNode; params: { slug: string } }) => (
    <a href={`/producto/${params.slug}`}>{children}</a>
  ),
}));
vi.mock("@/components/FavoriteButton", () => ({ FavoriteButton: () => null }));

const { ProductCard } = await import("./ProductCard");
const { producto } = await import("@/test/fixtures");

describe("ProductCard", () => {
  it("con stock 0 muestra 'Sin stock' y no 'Últimas unidades' (bug reportado por la clienta)", () => {
    render(<ProductCard product={producto({ stock: 0 })} />);
    expect(screen.getByTestId("etiqueta-stock")).toHaveTextContent("Sin stock");
    expect(screen.queryByText("Últimas unidades")).not.toBeInTheDocument();
  });

  it.each([1, 2])("con stock %s muestra 'Últimas unidades'", (stock) => {
    render(<ProductCard product={producto({ stock })} />);
    expect(screen.getByTestId("etiqueta-stock")).toHaveTextContent("Últimas unidades");
  });

  it("con stock normal no muestra etiqueta", () => {
    render(<ProductCard product={producto({ stock: 10 })} />);
    expect(screen.queryByTestId("etiqueta-stock")).not.toBeInTheDocument();
  });

  it("muestra nombre, categoría, precio y link al producto", () => {
    render(<ProductCard product={producto({ nombre: "Collar rockstar", slug: "collar-rockstar", categoria: "Accesorios", precio: 15000 })} />);
    expect(screen.getByText("Collar rockstar")).toBeInTheDocument();
    expect(screen.getByText("Accesorios")).toBeInTheDocument();
    expect(screen.getByText(/15\.000/)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/producto/collar-rockstar");
  });

  it("indica la cantidad de colores", () => {
    render(<ProductCard product={producto({ colores: ["Camel", "Negro", "Marrón"] })} />);
    expect(screen.getByText("3 colores")).toBeInTheDocument();
  });
});
