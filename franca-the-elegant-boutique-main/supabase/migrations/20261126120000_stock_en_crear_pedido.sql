-- Valida el stock al crear un pedido (antes se podía comprar un producto sin stock).
-- Basado en la definición vigente en producción (leída el 2026-11-26), solo agrega el bloque de stock.
-- No descuenta stock: eso sigue siendo manual desde el admin.

CREATE OR REPLACE FUNCTION public.crear_pedido_seguro(p_items jsonb, p_cliente_nombre text, p_cliente_telefono text DEFAULT NULL::text, p_cliente_email text DEFAULT NULL::text, p_direccion_envio text DEFAULT NULL::text, p_notas text DEFAULT NULL::text, p_metodo_pago text DEFAULT 'transferencia'::text, p_codigo_descuento text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_pedido_id uuid;
  v_total numeric := 0;
  v_subtotal numeric := 0;
  v_descuento numeric := 0;
  v_codigo_norm text;
  v_cod record;
  v_item jsonb;
  v_prod record;
  v_cant int;
  v_talle text;
  v_color text;
  v_req record;
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

  -- Stock: se valida por producto sumando todas sus líneas (el stock no es por talle).
  -- FOR UPDATE bloquea las filas para que dos compras simultáneas no pasen ambas el control.
  FOR v_req IN
    SELECT (e->>'producto_id')::uuid AS producto_id,
           sum(coalesce((e->>'cantidad')::int, 0)) AS cantidad
      FROM jsonb_array_elements(p_items) AS e
     GROUP BY 1
  LOOP
    SELECT nombre, stock INTO v_prod
      FROM public.productos
     WHERE id = v_req.producto_id
       FOR UPDATE;
    IF FOUND AND v_req.cantidad > coalesce(v_prod.stock, 0) THEN
      IF coalesce(v_prod.stock, 0) <= 0 THEN
        RAISE EXCEPTION 'Sin stock: %', v_prod.nombre;
      END IF;
      RAISE EXCEPTION 'Stock insuficiente: % (quedan %)', v_prod.nombre, v_prod.stock;
    END IF;
  END LOOP;

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
    v_color := NULLIF(trim(coalesce(v_item->>'color','')), '');

    IF v_cant IS NULL OR v_cant <= 0 OR v_cant > 99 THEN
      RAISE EXCEPTION 'Cantidad inválida';
    END IF;
    IF v_talle IS NULL OR length(v_talle) = 0 OR length(v_talle) > 20 THEN
      RAISE EXCEPTION 'Talle inválido';
    END IF;
    IF v_color IS NOT NULL AND length(v_color) > 60 THEN
      RAISE EXCEPTION 'Color inválido';
    END IF;

    SELECT id, nombre, precio, stock, activo
      INTO v_prod
      FROM public.productos
      WHERE id = (v_item->>'producto_id')::uuid;

    IF NOT FOUND OR NOT v_prod.activo THEN
      RAISE EXCEPTION 'Producto no disponible';
    END IF;

    INSERT INTO public.carrito_items (
      pedido_id, producto_id, nombre_snapshot, precio_unitario, cantidad, talle, color
    ) VALUES (
      v_pedido_id, v_prod.id, v_prod.nombre, v_prod.precio, v_cant, v_talle, v_color
    );

    v_subtotal := v_subtotal + (v_prod.precio * v_cant);
  END LOOP;

  v_total := v_subtotal;

  -- Aplicar código de descuento (server-side, fuente de verdad)
  v_codigo_norm := upper(NULLIF(trim(coalesce(p_codigo_descuento,'')), ''));
  IF v_codigo_norm IS NOT NULL THEN
    SELECT * INTO v_cod
      FROM public.codigos_descuento
      WHERE upper(codigo) = v_codigo_norm
        AND activo = true
        AND (expira_at IS NULL OR expira_at > now());

    IF FOUND THEN
      IF v_cod.tipo = 'porcentaje' THEN
        v_descuento := round(v_subtotal * (least(v_cod.valor, 100) / 100.0));
      ELSE
        v_descuento := least(v_cod.valor, v_subtotal);
      END IF;
      v_total := greatest(v_subtotal - v_descuento, 0);
      UPDATE public.pedidos
        SET codigo_descuento = v_cod.codigo,
            descuento_aplicado = v_descuento
        WHERE id = v_pedido_id;
    END IF;
  END IF;

  UPDATE public.pedidos SET total = v_total WHERE id = v_pedido_id;

  RETURN v_pedido_id;
END;
$function$;
