import { describe, expect, it } from "vitest";
import { buildResumenWhatsApp, clienteSchema, direccionSchema, formatDireccion, SUCURSALES } from "./checkout";
import { producto } from "@/test/fixtures";

const direccion = {
  calle: "Av. Siempreviva", numero: "742", piso: "2B", ciudad: "Junín", provincia: "Buenos Aires", cp: "6000", referencias: "",
};

describe("clienteSchema", () => {
  it("acepta datos válidos con teléfono opcional", () => {
    expect(clienteSchema.safeParse({ nombre: "Ana Pérez", email: "ana@mail.com", telefono: "" }).success).toBe(true);
  });
  it("rechaza nombre corto y email inválido", () => {
    const r = clienteSchema.safeParse({ nombre: "A", email: "no-es-mail" });
    expect(r.success).toBe(false);
    const campos = r.success ? [] : r.error.issues.map((i) => i.path[0]);
    expect(campos).toEqual(expect.arrayContaining(["nombre", "email"]));
  });
});

describe("direccionSchema", () => {
  it("acepta una dirección completa", () => expect(direccionSchema.safeParse(direccion).success).toBe(true));
  it("exige calle, número, ciudad, provincia y CP", () => {
    const r = direccionSchema.safeParse({ ...direccion, calle: "", numero: "", cp: "1" });
    expect(r.success).toBe(false);
  });
});

describe("formatDireccion", () => {
  it("incluye piso y referencias solo si existen", () => {
    expect(formatDireccion(direccion)).toBe("Av. Siempreviva 742, 2B, Junín, Buenos Aires (CP 6000)");
    expect(formatDireccion({ ...direccion, piso: "", referencias: "timbre roto" })).toBe(
      "Av. Siempreviva 742, Junín, Buenos Aires (CP 6000) (timbre roto)",
    );
  });
});

describe("buildResumenWhatsApp", () => {
  const base = {
    items: [{ product: producto({ nombre: "Mate coquito", precio: 12000 }), cantidad: 1, talle: "Único" }],
    subtotal: 12000,
    cliente: { nombre: "Ana", email: "ana@mail.com", telefono: "" },
  };

  it("envío a domicilio muestra costo y dirección", () => {
    const url = buildResumenWhatsApp({ ...base, costoEnvio: 20000, total: 32000, metodo: "envio", direccion });
    const texto = decodeURIComponent(url.split("?text=")[1]);
    expect(texto).toContain("Envío a: Av. Siempreviva 742");
    expect(texto).not.toContain("Tel:");
  });

  it("retiro en sucursal es sin cargo", () => {
    const url = buildResumenWhatsApp({ ...base, costoEnvio: 0, total: 12000, metodo: "retiro", sucursal: SUCURSALES[0] });
    const texto = decodeURIComponent(url.split("?text=")[1]);
    expect(texto).toContain("Envío: Sin cargo");
    expect(texto).toContain(`Retiro en: ${SUCURSALES[0].nombre}`);
  });
});
