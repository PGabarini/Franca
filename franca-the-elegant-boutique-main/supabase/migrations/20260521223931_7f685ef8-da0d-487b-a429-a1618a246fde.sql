CREATE TABLE public.locales_retiro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  direccion text NOT NULL DEFAULT '',
  ciudad text NOT NULL DEFAULT '',
  provincia text NOT NULL DEFAULT '',
  horarios text NOT NULL DEFAULT '',
  telefono text NOT NULL DEFAULT '',
  notas text NOT NULL DEFAULT '',
  orden integer NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.locales_retiro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Locales activos visibles"
ON public.locales_retiro FOR SELECT
TO anon, authenticated
USING (activo = true);

CREATE POLICY "Admin ve todos los locales"
ON public.locales_retiro FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin inserta locales"
ON public.locales_retiro FOR INSERT
TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin edita locales"
ON public.locales_retiro FOR UPDATE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin elimina locales"
ON public.locales_retiro FOR DELETE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_updated_at_locales_retiro
BEFORE UPDATE ON public.locales_retiro
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();