#!/usr/bin/env node
/**
 * Prueba de humo de un deploy de Franca. Es SOLO LECTURA: no crea pedidos ni modifica datos.
 *
 *   npm run test:smoke                       -> prueba https://franca.ar
 *   npm run test:smoke -- https://desarrollo-franca.pagabarini.workers.dev
 *
 * Toma la URL de Supabase y la publishable key de .env.production.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const BASE = (process.argv[2] ?? "https://franca.ar").replace(/\/$/, "");
const envFile = readFileSync(fileURLToPath(new URL("../.env.production", import.meta.url)), "utf8");
const env = Object.fromEntries(
  envFile.split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")];
  }),
);
const SB_URL = env.VITE_SUPABASE_URL;
const PUB = env.VITE_SUPABASE_PUBLISHABLE_KEY;

let fallas = 0;
const check = (nombre, ok, detalle = "") => {
  if (!ok) fallas += 1;
  console.log(`  [${ok ? "OK" : "FALLA"}] ${nombre}${detalle ? ` — ${detalle}` : ""}`);
};
const get = async (url, init) => {
  const r = await fetch(url, { ...init, headers: { "user-agent": "franca-smoke", ...init?.headers } });
  return { status: r.status, body: await r.text() };
};

console.log(`Supabase (${SB_URL}):`);
const prodRes = await get(`${SB_URL}/rest/v1/productos?select=slug,nombre,stock&activo=eq.true`, { headers: { apikey: PUB } });
const productos = prodRes.status === 200 ? JSON.parse(prodRes.body) : [];
check("leer productos activos con la clave pública", productos.length > 0, `HTTP ${prodRes.status}, ${productos.length} productos`);
for (const tabla of ["user_roles", "pedidos"]) {
  const r = await get(`${SB_URL}/rest/v1/${tabla}?select=*&limit=1`, { headers: { apikey: PUB } });
  check(`${tabla} NO visible con la clave pública`, r.status !== 200 || r.body.trim() === "[]", `HTTP ${r.status}`);
}

console.log(`Páginas (${BASE}):`);
const paginas = ["/", "/catalogo", "/carrito", "/favoritos", "/contacto", "/faqs", "/login", "/registro",
  "/terminos", "/privacidad", "/cambios-y-devoluciones", "/admin", ...productos.slice(0, 3).map((p) => `/producto/${p.slug}`)];
let html = "";
for (const p of paginas) {
  const r = await get(BASE + p);
  html += r.body;
  const error = r.body.match(/Missing Supabase|Internal Server Error|Something went wrong/)?.[0];
  check(`GET ${p}`, r.status === 200 && !error, `HTTP ${r.status}${error ? `, ${error}` : ""}`);
}
for (const p of productos.slice(0, 3)) check(`se ve "${p.nombre}"`, html.includes(p.slug));

const imgs = [...new Set(html.match(/https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/[^"'\s)]+/g) ?? [])].slice(0, 3);
check("hay imágenes de productos", imgs.length > 0);
for (const u of imgs) check(`imagen ${u.split("/").pop()}`, (await fetch(u)).status === 200);

const pendientes = new Set(html.match(/\/assets\/[\w.-]+\.js/g) ?? []);
const vistos = new Set();
let js = "";
while ([...pendientes].some((p) => !vistos.has(p))) {
  const p = [...pendientes].find((x) => !vistos.has(x));
  vistos.add(p);
  const { body } = await get(BASE + p);
  js += body;
  for (const m of body.match(/[\w.-]+-[\w-]{8}\.js/g) ?? []) pendientes.add(`/assets/${m}`);
}
console.log(`Código público (${vistos.size} archivos JS):`);
check("usa la publishable key de .env.production", js.includes(PUB));
const roles = [...(js + html).matchAll(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.([\w-]+)/g)].map((m) => {
  try { return JSON.parse(Buffer.from(m[1], "base64url").toString()).role; } catch { return "?"; }
});
check("sin claves JWT viejas (anon/service_role)", roles.length === 0, roles.join(", "));
check("sin clave secreta (sb_secret_)", !(js + html).includes("sb_secret_"));

console.log("Servidor (funciones de admin con un token falso, no pueden modificar nada):");
const tok = "x".repeat(60);
const payload = JSON.stringify({ t: { t: 10, i: 0, p: { k: ["data"], v: [{ t: 10, i: 1, p: { k: ["accessToken"], v: [{ t: 1, s: tok }] }, o: 0 }] }, o: 0 }, f: 63, m: [] });
let sesion = 0, missing = 0;
for (const id of new Set(js.match(/"[a-f0-9]{64}"/g)?.map((s) => s.slice(1, -1)) ?? [])) {
  const { body } = await get(`${BASE}/_serverFn/${id}`, {
    method: "POST",
    headers: { "x-tsr-serverFn": "true", "content-type": "application/json", accept: "application/json" },
    body: payload,
  });
  if (body.includes("Sesión inválida")) sesion += 1;
  if (body.includes("Missing Supabase")) missing += 1;
}
check("el servidor lee el secreto y consulta Supabase Auth", sesion > 0 && missing === 0, `${sesion} 'Sesión inválida', ${missing} 'Missing env'`);

console.log(`\nRESULTADO: ${fallas === 0 ? "TODO OK" : `${fallas} FALLA(S)`}`);
process.exit(fallas === 0 ? 0 : 1);
