
-- 1) Drop public SELECT on codigos_descuento; expose only a single-code validator
DROP POLICY IF EXISTS "Codigos activos visibles" ON public.codigos_descuento;

CREATE OR REPLACE FUNCTION public.validar_codigo_descuento(p_codigo text)
RETURNS TABLE(codigo text, tipo public.tipo_descuento, valor numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.codigo, c.tipo, c.valor
  FROM public.codigos_descuento c
  WHERE c.activo = true
    AND upper(c.codigo) = upper(trim(p_codigo))
    AND (c.expira_at IS NULL OR c.expira_at > now())
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.validar_codigo_descuento(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validar_codigo_descuento(text) TO anon, authenticated;

-- 2) datos_bancarios: hide email_contacto from public; expose safe fields via RPC
DROP POLICY IF EXISTS "Datos bancarios visibles para todos" ON public.datos_bancarios;

CREATE OR REPLACE FUNCTION public.get_datos_bancarios_publico()
RETURNS TABLE(id uuid, titular text, cbu text, alias text, banco text, notas text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id, d.titular, d.cbu, d.alias, d.banco, d.notas
  FROM public.datos_bancarios d
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_datos_bancarios_publico() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_datos_bancarios_publico() TO anon, authenticated;

-- 3) Pedidos: remove unrestricted guest UPDATE; provide tight RPC to attach comprobante
DROP POLICY IF EXISTS "Cliente sube comprobante a su pedido" ON public.pedidos;

CREATE OR REPLACE FUNCTION public.set_comprobante_pedido(p_pedido_id uuid, p_path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  IF p_path IS NULL OR length(p_path) = 0 OR length(p_path) > 500 THEN
    RAISE EXCEPTION 'Path inválido';
  END IF;
  IF position((p_pedido_id::text || '/') in p_path) <> 1 THEN
    RAISE EXCEPTION 'Path no corresponde al pedido';
  END IF;

  SELECT user_id INTO v_owner FROM public.pedidos WHERE id = p_pedido_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;
  IF v_owner IS NOT NULL AND v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  UPDATE public.pedidos
     SET comprobante_url = p_path,
         estado = 'comprobante_recibido'
   WHERE id = p_pedido_id
     AND comprobante_url IS NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.set_comprobante_pedido(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_comprobante_pedido(uuid, text) TO anon, authenticated;

-- 4) Tighten comprobantes storage uploads: must be in a folder matching an existing pedido id
DROP POLICY IF EXISTS "Subir comprobante" ON storage.objects;
CREATE POLICY "Subir comprobante"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'comprobantes'
  AND (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = ((storage.foldername(name))[1])::uuid
      AND p.comprobante_url IS NULL
  )
);

-- 5) Drop unused public.has_role; private.has_role already powers all RLS
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 6) producto_consultas: replace public SELECT with safe RPC excluding user_id
DROP POLICY IF EXISTS "Consultas respondidas son publicas" ON public.producto_consultas;

CREATE OR REPLACE FUNCTION public.get_consultas_publicas(p_producto_id uuid)
RETURNS TABLE(
  id uuid,
  producto_id uuid,
  nombre_usuario text,
  pregunta text,
  respuesta text,
  respondida_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.producto_id, c.nombre_usuario, c.pregunta, c.respuesta, c.respondida_at, c.created_at
  FROM public.producto_consultas c
  WHERE c.producto_id = p_producto_id
    AND c.respuesta IS NOT NULL
  ORDER BY c.created_at DESC;
$$;
REVOKE ALL ON FUNCTION public.get_consultas_publicas(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_consultas_publicas(uuid) TO anon, authenticated;

-- 7) Lock down SECURITY DEFINER functions: revoke broad EXECUTE, grant only where needed
REVOKE ALL ON FUNCTION public.crear_pedido_seguro(jsonb, text, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crear_pedido_seguro(jsonb, text, text, text, text, text, text, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.crear_mensaje_contacto(text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crear_mensaje_contacto(text, text, text, text, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

REVOKE ALL ON FUNCTION public.promote_user_to_admin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(text) TO authenticated;
