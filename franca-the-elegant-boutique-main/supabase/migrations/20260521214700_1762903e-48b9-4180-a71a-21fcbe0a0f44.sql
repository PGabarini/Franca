
-- 1. Tabla categorias
CREATE TABLE public.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  orden integer NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categorias activas visibles"
  ON public.categorias FOR SELECT
  TO anon, authenticated
  USING (activo = true);

CREATE POLICY "Admin ve todas las categorias"
  ON public.categorias FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin inserta categorias"
  ON public.categorias FOR INSERT
  TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin edita categorias"
  ON public.categorias FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin elimina categorias"
  ON public.categorias FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_categorias_updated
  BEFORE UPDATE ON public.categorias
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Sembrar con los valores actuales del enum
INSERT INTO public.categorias (nombre, orden)
SELECT DISTINCT categoria::text, 0 FROM public.productos
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO public.categorias (nombre, orden) VALUES
  ('Sweaters', 1), ('Pantalones', 2), ('Camisas', 3),
  ('Abrigos', 4), ('Faldas', 5), ('Vestidos', 6), ('Accesorios', 7)
ON CONFLICT (nombre) DO NOTHING;

-- 3. Convertir productos.categoria de enum a text
ALTER TABLE public.productos
  ALTER COLUMN categoria TYPE text USING categoria::text;

-- 4. Eliminar el enum viejo si ya no lo usa nadie
DROP TYPE IF EXISTS public.categoria;
