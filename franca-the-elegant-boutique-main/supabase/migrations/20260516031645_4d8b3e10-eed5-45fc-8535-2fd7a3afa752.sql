
-- 1. Color en items del carrito
ALTER TABLE public.carrito_items ADD COLUMN IF NOT EXISTS color text;

-- 2. Tipo enum para descuentos
DO $$ BEGIN
  CREATE TYPE public.tipo_descuento AS ENUM ('porcentaje', 'monto_fijo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Tabla de códigos de descuento
CREATE TABLE IF NOT EXISTS public.codigos_descuento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  tipo public.tipo_descuento NOT NULL,
  valor numeric NOT NULL CHECK (valor > 0),
  activo boolean NOT NULL DEFAULT true,
  expira_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.codigos_descuento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Codigos activos visibles" ON public.codigos_descuento;
CREATE POLICY "Codigos activos visibles" ON public.codigos_descuento
  FOR SELECT TO anon, authenticated
  USING (activo = true);

DROP POLICY IF EXISTS "Admin ve todos los codigos" ON public.codigos_descuento;
CREATE POLICY "Admin ve todos los codigos" ON public.codigos_descuento
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin inserta codigos" ON public.codigos_descuento;
CREATE POLICY "Admin inserta codigos" ON public.codigos_descuento
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin edita codigos" ON public.codigos_descuento;
CREATE POLICY "Admin edita codigos" ON public.codigos_descuento
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin elimina codigos" ON public.codigos_descuento;
CREATE POLICY "Admin elimina codigos" ON public.codigos_descuento
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_codigos_descuento_updated ON public.codigos_descuento;
CREATE TRIGGER trg_codigos_descuento_updated
  BEFORE UPDATE ON public.codigos_descuento
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Descuento aplicado en pedidos
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS codigo_descuento text;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS descuento_aplicado numeric NOT NULL DEFAULT 0;

-- 5. Actualizar RPC para aceptar color por item y código de descuento
CREATE OR REPLACE FUNCTION public.crear_pedido_seguro(
  p_items jsonb,
  p_cliente_nombre text,
  p_cliente_telefono text DEFAULT NULL::text,
  p_cliente_email text DEFAULT NULL::text,
  p_direccion_envio text DEFAULT NULL::text,
  p_notas text DEFAULT NULL::text,
  p_metodo_pago text DEFAULT 'transferencia'::text,
  p_codigo_descuento text DEFAULT NULL
)
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
