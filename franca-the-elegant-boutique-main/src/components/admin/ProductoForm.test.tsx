/**
 * Test del formulario de productos del admin, simulando el uso real:
 * cargar un producto nuevo, editar uno existente (cambiar categoría, colores, stock) y errores.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const navigate = vi.fn();
const createAdminProduct = vi.fn();
const updateAdminProduct = vi.fn();
const uploadProductImage = vi.fn();
const toast = { success: vi.fn(), error: vi.fn() };

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: ["Accesorios", "Cuero", "Remeras"].map((nombre, i) => ({ id: `c${i}`, nombre, orden: i, activo: true })),
  }),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/lib/categorias", () => ({ categoriasQueryOptions: () => ({}) }));
vi.mock("@/server/admin.functions", () => ({ createAdminProduct, updateAdminProduct }));
vi.mock("@/lib/auth-headers", () => ({ getAccessToken: async () => "token-de-prueba" }));
vi.mock("@/lib/upload", () => ({ uploadProductImage }));
vi.mock("sonner", () => ({ toast }));
vi.mock("./ProductImagesManager", () => ({ ProductImagesManager: () => <div data-testid="galeria" /> }));

const { ProductoForm } = await import("./ProductoForm");

const URL_FOTO = "https://x.supabase.co/storage/v1/object/public/productos/nueva.jpg";
const ID = "8f1c2a8e-4b8e-4c1e-9f0a-1b2c3d4e5f60";

const escribir = (label: string, valor: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: valor } });
const subirFoto = async (container: HTMLElement) => {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [new File(["x"], "foto.jpg", { type: "image/jpeg" })] } });
  await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Imagen subida"));
};
const agregarColor = (color: string) => {
  const input = screen.getByPlaceholderText("Ej: Camel");
  fireEvent.change(input, { target: { value: color } });
  fireEvent.keyDown(input, { key: "Enter" });
};
const guardar = (texto: RegExp) => fireEvent.click(screen.getByRole("button", { name: texto }));

beforeEach(() => {
  vi.clearAllMocks();
  createAdminProduct.mockResolvedValue({ id: "nuevo" });
  updateAdminProduct.mockResolvedValue({ ok: true });
  uploadProductImage.mockResolvedValue(URL_FOTO);
});

describe("ProductoForm — producto nuevo", () => {
  it("carga un producto completo y lo crea", async () => {
    const { container } = render(<ProductoForm mode="create" />);

    escribir("Nombre", "Collar Corazón <3");
    expect(screen.getByLabelText("Slug (URL)")).toHaveValue("collar-corazon-3");
    escribir("Precio (ARS)", "9000");
    escribir("Stock", "5");
    escribir("Categoría", "Cuero");
    await subirFoto(container);
    fireEvent.click(screen.getByRole("button", { name: "Único" }));
    agregarColor("Camel, Negro");
    agregarColor("camel"); // repetido (sin importar mayúsculas): no se agrega
    guardar(/Crear producto/);

    await waitFor(() => expect(createAdminProduct).toHaveBeenCalledTimes(1));
    expect(createAdminProduct).toHaveBeenCalledWith({
      data: {
        accessToken: "token-de-prueba",
        product: expect.objectContaining({
          nombre: "Collar Corazón <3",
          slug: "collar-corazon-3",
          precio: 9000,
          stock: 5,
          categoria: "Cuero",
          imagen_url: URL_FOTO,
          talles: ["Único"],
          color: ["Camel", "Negro"],
          activo: true,
        }),
      },
    });
    expect(toast.success).toHaveBeenCalledWith("Producto creado");
    expect(navigate).toHaveBeenCalledWith({ to: "/admin/productos" });
  });

  it("no arranca con foto ni categoría de ejemplo", () => {
    render(<ProductoForm mode="create" />);
    expect(screen.getByLabelText("Categoría")).toHaveValue("");
    expect(screen.getByText("Sin imagen")).toBeInTheDocument();
  });

  it("muestra las categorías de la base en el selector", () => {
    render(<ProductoForm mode="create" />);
    const opciones = [...(screen.getByLabelText("Categoría") as HTMLSelectElement).options].map((o) => o.value);
    expect(opciones).toEqual(["", "Accesorios", "Cuero", "Remeras"]);
  });

  it("sin foto no deja crear y avisa", async () => {
    render(<ProductoForm mode="create" />);
    escribir("Nombre", "Mate");
    escribir("Categoría", "Cuero");
    fireEvent.click(screen.getByRole("button", { name: "Único" }));
    guardar(/Crear producto/);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Imagen principal: Subí una imagen principal"));
    expect(createAdminProduct).not.toHaveBeenCalled();
  });

  it("sin categoría no deja crear y avisa", async () => {
    const { container } = render(<ProductoForm mode="create" />);
    escribir("Nombre", "Mate");
    await subirFoto(container);
    fireEvent.click(screen.getByRole("button", { name: "Único" }));
    guardar(/Crear producto/);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Categoría: Elegí una categoría"));
    expect(createAdminProduct).not.toHaveBeenCalled();
  });

  it("si la foto no se puede subir, muestra el error", async () => {
    uploadProductImage.mockRejectedValue(new Error("La imagen supera 5MB."));
    const { container } = render(<ProductoForm mode="create" />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["x"], "grande.jpg", { type: "image/jpeg" })] } });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("La imagen supera 5MB."));
  });
});

describe("ProductoForm — editar producto", () => {
  const existente = {
    id: ID,
    slug: "pulsera-franca",
    nombre: "Pulsera Franca",
    descripcion: "Pulsera de cuero",
    precio: 8000,
    costo: 3000,
    stock: 10,
    imagen_url: "https://x.supabase.co/storage/v1/object/public/productos/p.jpg",
    categoria: "Accesorios",
    talles: ["Único"],
    color: ["Camel", "Negro"],
    destacado: false,
    activo: true,
    talles_medidas: {},
  };

  it("cambia la categoría, el stock y los colores, y guarda sobre el mismo producto", async () => {
    render(<ProductoForm mode="edit" initial={existente} />);
    expect(screen.getByLabelText("Categoría")).toHaveValue("Accesorios");

    escribir("Categoría", "Cuero");
    escribir("Stock", "0");
    fireEvent.click(screen.getByRole("button", { name: "Quitar Negro" }));
    agregarColor("Marrón chocolate");
    guardar(/Guardar cambios/);

    await waitFor(() => expect(updateAdminProduct).toHaveBeenCalledTimes(1));
    const { product } = updateAdminProduct.mock.calls[0][0].data;
    expect(product).toMatchObject({ id: ID, categoria: "Cuero", stock: 0, color: ["Camel", "Marrón chocolate"] });
    expect(createAdminProduct).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Producto actualizado");
  });

  it("mantiene una categoría que ya no existe en la lista (no la pisa)", () => {
    render(<ProductoForm mode="edit" initial={{ ...existente, categoria: "Vieja" }} />);
    expect(screen.getByLabelText("Categoría")).toHaveValue("Vieja");
  });

  it("muestra la galería de fotos para agregar más imágenes", () => {
    render(<ProductoForm mode="edit" initial={existente} />);
    expect(screen.getByTestId("galeria")).toBeInTheDocument();
  });

  it("slug repetido: avisa en castellano y no sale de la página", async () => {
    updateAdminProduct.mockRejectedValue(new Error('duplicate key value violates unique constraint "productos_slug_key"'));
    render(<ProductoForm mode="edit" initial={existente} />);
    guardar(/Guardar cambios/);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Ya existe un producto con ese slug (URL). Cambiá el slug."));
    expect(navigate).not.toHaveBeenCalled();
  });

  it("al cambiar el nombre de un producto existente no cambia su URL", () => {
    render(<ProductoForm mode="edit" initial={{ ...existente, slug: "url-personalizada" }} />);
    escribir("Nombre", "Pulsera Franca nueva");
    expect(screen.getByLabelText("Slug (URL)")).toHaveValue("url-personalizada");
  });
});
