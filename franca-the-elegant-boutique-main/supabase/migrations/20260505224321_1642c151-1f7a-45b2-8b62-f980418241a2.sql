CREATE TABLE public.mensajes_contacto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  nombre text NOT NULL,
  email text NOT NULL,
  telefono text,
  asunto text NOT NULL,
  mensaje text NOT NULL,
  leido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mensajes_contacto_created_at ON public.mensajes_contacto (created_at DESC);
CREATE INDEX idx_mensajes_contacto_email ON public.mensajes_contacto (lower(email), created_at DESC);

ALTER TABLE public.mensajes_contacto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin ve mensajes" ON public.mensajes_contacto
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin actualiza mensajes" ON public.mensajes_contacto
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin elimina mensajes" ON public.mensajes_contacto
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

-- INSERT bloqueado por defecto: forzar uso de la RPC
CREATE OR REPLACE FUNCTION public.crear_mensaje_contacto(
  p_nombre text,
  p_email text,
  p_asunto text,
  p_mensaje text,
  p_telefono text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_email text := lower(trim(p_email));
  v_recent int;
BEGIN
  IF p_nombre IS NULL OR length(trim(p_nombre)) = 0 OR length(p_nombre) > 80 THEN
    RAISE EXCEPTION 'Nombre inválido';
  END IF;
  IF v_email IS NULL OR length(v_email) = 0 OR length(v_email) > 255
     OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Email inválido';
  END IF;
  IF p_asunto IS NULL OR length(trim(p_asunto)) = 0 OR length(p_asunto) > 120 THEN
    RAISE EXCEPTION 'Asunto inválido';
  END IF;
  IF p_mensaje IS NULL OR length(trim(p_mensaje)) < 10 OR length(p_mensaje) > 2000 THEN
    RAISE EXCEPTION 'Mensaje inválido (10-2000 caracteres)';
  END IF;
  IF p_telefono IS NOT NULL AND length(p_telefono) > 30 THEN
    RAISE EXCEPTION 'Teléfono inválido';
  END IF;

  SELECT count(*) INTO v_recent
  FROM public.mensajes_contacto
  WHERE lower(email) = v_email
    AND created_at > now() - interval '10 minutes';

  IF v_recent >= 3 THEN
    RAISE EXCEPTION 'Demasiados mensajes recientes. Probá nuevamente en unos minutos.';
  END IF;

  INSERT INTO public.mensajes_contacto (user_id, nombre, email, telefono, asunto, mensaje)
  VALUES (
    auth.uid(),
    trim(p_nombre),
    v_email,
    NULLIF(trim(coalesce(p_telefono, '')), ''),
    trim(p_asunto),
    trim(p_mensaje)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crear_mensaje_contacto(text, text, text, text, text) TO anon, authenticated;