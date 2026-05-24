
-- 1) Server-side order creation function
CREATE OR REPLACE FUNCTION public.crear_pedido_seguro(
  p_items jsonb,
  p_cliente_nombre text,
  p_cliente_telefono text DEFAULT NULL,
  p_cliente_email text DEFAULT NULL,
  p_direccion_envio text DEFAULT NULL,
  p_notas text DEFAULT NULL,
  p_metodo_pago text DEFAULT 'transferencia'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_pedido_id uuid;
  v_total numeric := 0;
  v_item jsonb;
  v_prod record;
  v_cant int;
  v_talle text;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El pedido no contiene items';
  END IF;
  IF p_cliente_nombre IS NULL OR length(trim(p_cliente_nombre)) = 0 THEN
    RAISE EXCEPTION 'Nombre de cliente requerido';
  END IF;
  IF length(p_cliente_nombre) > 120 THEN
    RAISE EXCEPTION 'Nombre demasiado largo';
  END IF;

  INSERT INTO public.pedidos (
    user_id, cliente_nombre, cliente_telefono, cliente_email,
    direccion_envio, total, notas, metodo_pago, estado
  ) VALUES (
    v_user,
    trim(p_cliente_nombre),
    NULLIF(trim(coalesce(p_cliente_telefono,'')), ''),
    NULLIF(trim(coalesce(p_cliente_email,'')), ''),
    NULLIF(trim(coalesce(p_direccion_envio,'')), ''),
    0,
    NULLIF(trim(coalesce(p_notas,'')), ''),
    coalesce(p_metodo_pago, 'transferencia'),
    'esperando_transferencia'
  )
  RETURNING id INTO v_pedido_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_cant := (v_item->>'cantidad')::int;
    v_talle := v_item->>'talle';

    IF v_cant IS NULL OR v_cant <= 0 OR v_cant > 99 THEN
      RAISE EXCEPTION 'Cantidad inválida';
    END IF;
    IF v_talle IS NULL OR length(v_talle) = 0 OR length(v_talle) > 20 THEN
      RAISE EXCEPTION 'Talle inválido';
    END IF;

    SELECT id, nombre, precio, stock, activo
      INTO v_prod
      FROM public.productos
      WHERE id = (v_item->>'producto_id')::uuid;

    IF NOT FOUND OR NOT v_prod.activo THEN
      RAISE EXCEPTION 'Producto no disponible';
    END IF;

    INSERT INTO public.carrito_items (
      pedido_id, producto_id, nombre_snapshot, precio_unitario, cantidad, talle
    ) VALUES (
      v_pedido_id, v_prod.id, v_prod.nombre, v_prod.precio, v_cant, v_talle
    );

    v_total := v_total + (v_prod.precio * v_cant);
  END LOOP;

  UPDATE public.pedidos SET total = v_total WHERE id = v_pedido_id;

  RETURN v_pedido_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crear_pedido_seguro(jsonb, text, text, text, text, text, text) TO anon, authenticated;

-- 2) Lock down direct inserts on pedidos / carrito_items so prices can only be set via RPC
DROP POLICY IF EXISTS "Crear pedido (incluye invitado)" ON public.pedidos;
DROP POLICY IF EXISTS "Insertar items con pedido" ON public.carrito_items;

-- 3) Restrictive policy preventing non-admins from inserting into user_roles
DROP POLICY IF EXISTS "Bloquear self-asignacion de roles" ON public.user_roles;
CREATE POLICY "Bloquear self-asignacion de roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
