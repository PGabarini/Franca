import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// @ts-ignore
import { getEvent } from "vinxi/http";

// Función maestra para obtener el cliente de Supabase con las variables de Cloudflare
function getSupabaseAdmin() {
  const event = getEvent();
  const env = event?.context?.cloudflare?.env || process.env;
  const supabaseUrl = env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase server environment variables. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
  }

  return createClient(supabaseUrl, supabaseKey);
}

const CATEGORIES = ["Sweaters", "Pantalones", "Camisas", "Abrigos", "Faldas", "Accesorios"] as const;

const authSchema = z.object({ accessToken: z.string().min(20) });

const productSchema = z.object({
  slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
  nombre: z.string().trim().min(1).max(120),
  descripcion: z.string().trim().max(2000),
  precio: z.number().min(0).max(99999999),
  costo: z.number().min(0).max(99999999).nullable().optional(),
  stock: z.number().int().min(0).max(99999),
  imagen_url: z.string().trim().min(1).max(500).refine((value) => /^p[1-8]$/.test(value) || /^https?:\/\//i.test(value)),
  categoria: z.string().min(1, "La categoría es obligatoria"),
  talles: z.array(z.string()).min(1),
  color: z.array(z.string().trim().min(1).max(60)).max(20),
  destacado: z.boolean(),
  activo: z.boolean(),
  talles_medidas: z.record(z.string().min(1).max(20), z.string().trim().max(500)).default({}),
});

const idSchema = z.object({ id: z.string().uuid() });
const updateProductSchema = productSchema.extend({ id: z.string().uuid() });
const promoteSchema = authSchema.extend({ email: z.string().trim().email() });

const imageUrlSchema = z.string().trim().min(1).max(500).refine(
  (v) => /^p[1-8]$/.test(v) || /^https?:\/\//i.test(v),
  "Imagen inválida: usá p1..p8 o una URL http(s)://",
);

const productImageSchema = z.object({
  producto_id: z.string().uuid(),
  url: imageUrlSchema,
  alt: z.string().trim().max(120).default(""),
  orden: z.number().int().min(0).max(99).default(0),
});

const updateImageSchema = z.object({
  id: z.string().uuid(),
  url: imageUrlSchema.optional(),
  alt: z.string().trim().max(120).optional(),
  orden: z.number().int().min(0).max(99).optional(),
});

const normalizeProduct = (row: any) => ({
  ...row,
  precio: Number(row.precio),
  talles: Array.isArray(row.talles) ? row.talles : [],
});

async function getUserIdFromToken(accessToken: string) {
  const { data, error } = await getSupabaseAdmin().auth.getUser(accessToken);
  if (error || !data.user) {
    throw new Error("Sesión inválida o expirada. Iniciá sesión nuevamente.");
  }
  return data.user.id;
}

async function ensureAdmin(userId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) throw new Error(`No se pudo validar el rol admin: ${error.message}`);
  if (!data) throw new Error("No autorizado: tu cuenta no tiene rol admin.");
}

async function ensureAdminFromToken(accessToken: string) {
  const userId = await getUserIdFromToken(accessToken);
  await ensureAdmin(userId);
  return userId;
}

async function countAdmins() {
  const { count, error } = await getSupabaseAdmin()
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export const getAdminStatusServer = createServerFn({ method: "POST" })
  .inputValidator((data) => authSchema.parse(data))
  .handler(async ({ data }) => {
    const userId = await getUserIdFromToken(data.accessToken);
    const [{ data: role, error }, adminCount] = await Promise.all([
      getSupabaseAdmin()
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle(),
      countAdmins(),
    ]);

    if (error) throw new Error(error.message);
    return { isAdmin: !!role, adminCount };
  });

export const listAdminProducts = createServerFn({ method: "POST" })
  .inputValidator((data) => authSchema.parse(data))
  .handler(async ({ data }) => {
    await ensureAdminFromToken(data.accessToken);
    const { data: rows, error } = await getSupabaseAdmin()
      .from("productos")
      .select("id,slug,nombre,precio,costo,stock,categoria,activo,destacado,imagen_url")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (rows ?? []).map(normalizeProduct);
  });

export const getAdminProduct = createServerFn({ method: "POST" })
  .inputValidator((data) => authSchema.extend(idSchema.shape).parse(data))
  .handler(async ({ data }) => {
    await ensureAdminFromToken(data.accessToken);
    const { data: row, error } = await getSupabaseAdmin()
      .from("productos")
      .select("id,slug,nombre,descripcion,precio,costo,stock,imagen_url,categoria,talles,color,destacado,activo,talles_medidas")
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return row ? normalizeProduct(row) : null;
  });

export const createAdminProduct = createServerFn({ method: "POST" })
  .inputValidator((data) => authSchema.extend({ product: productSchema }).parse(data))
  .handler(async ({ data }) => {
    await ensureAdminFromToken(data.accessToken);
    const { data: row, error } = await getSupabaseAdmin()
      .from("productos")
      .insert(data.product as any)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

export const updateAdminProduct = createServerFn({ method: "POST" })
  .inputValidator((data) => authSchema.extend({ product: updateProductSchema }).parse(data))
  .handler(async ({ data }) => {
    await ensureAdminFromToken(data.accessToken);
    const { id, ...payload } = data.product;
    const { error } = await getSupabaseAdmin()
      .from("productos")
      .update(payload as any)
      .eq("id", id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAdminProduct = createServerFn({ method: "POST" })
  .inputValidator((data) => authSchema.extend(idSchema.shape).parse(data))
  .handler(async ({ data }) => {
    await ensureAdminFromToken(data.accessToken);
    const { error } = await getSupabaseAdmin().from("productos").delete().eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const claimFirstAdminServer = createServerFn({ method: "POST" })
  .inputValidator((data) => authSchema.parse(data))
  .handler(async ({ data }) => {
    const userId = await getUserIdFromToken(data.accessToken);
    const adminCount = await countAdmins();
    if (adminCount > 0) return false;

    const { error } = await getSupabaseAdmin()
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });

    if (error) throw new Error(error.message);
    return true;
  });

export const promoteUserToAdminServer = createServerFn({ method: "POST" })
  .inputValidator((data) => promoteSchema.parse(data))
  .handler(async ({ data }) => {
    await ensureAdminFromToken(data.accessToken);
    const targetEmail = data.email.toLowerCase();
    let targetUserId: string | null = null;

    for (let page = 1; page <= 20 && !targetUserId; page += 1) {
      const { data: usersPage, error } = await getSupabaseAdmin().auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(error.message);

      const target = usersPage.users.find((user) => user.email?.toLowerCase() === targetEmail);
      targetUserId = target?.id ?? null;
      if (usersPage.users.length < 1000) break;
    }

    if (!targetUserId) throw new Error("Usuario no encontrado");

    const { error } = await getSupabaseAdmin()
      .from("user_roles")
      .insert({ user_id: targetUserId, role: "admin" });

    if (error && error.code !== "23505") throw new Error(error.message);
    return true;
  });

export const listProductImages = createServerFn({ method: "POST" })
  .inputValidator((data) => authSchema.extend({ productoId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await ensureAdminFromToken(data.accessToken);
    const { data: rows, error } = await getSupabaseAdmin()
      .from("producto_imagenes")
      .select("id,producto_id,url,alt,orden")
      .eq("producto_id", data.productoId)
      .order("orden", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const addProductImage = createServerFn({ method: "POST" })
  .inputValidator((data) => authSchema.extend({ image: productImageSchema }).parse(data))
  .handler(async ({ data }) => {
    await ensureAdminFromToken(data.accessToken);
    const { data: row, error } = await getSupabaseAdmin()
      .from("producto_imagenes")
      .insert(data.image as any)
      .select("id,producto_id,url,alt,orden")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateProductImage = createServerFn({ method: "POST" })
  .inputValidator((data) => authSchema.extend({ image: updateImageSchema }).parse(data))
  .handler(async ({ data }) => {
    await ensureAdminFromToken(data.accessToken);
    const { id, ...payload } = data.image;
    const { error } = await getSupabaseAdmin()
      .from("producto_imagenes")
      .update(payload as any)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProductImage = createServerFn({ method: "POST" })
  .inputValidator((data) => authSchema.extend(idSchema.shape).parse(data))
  .handler(async ({ data }) => {
    await ensureAdminFromToken(data.accessToken);
    const { error } = await getSupabaseAdmin().from("producto_imagenes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });