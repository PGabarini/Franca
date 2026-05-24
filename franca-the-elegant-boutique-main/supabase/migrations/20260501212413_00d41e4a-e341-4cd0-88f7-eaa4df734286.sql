CREATE TABLE public.producto_imagenes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id uuid NOT NULL,
  url text NOT NULL,
  alt text NOT NULL DEFAULT '',
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_producto_imagenes_producto ON public.producto_imagenes(producto_id, orden);

ALTER TABLE public.producto_imagenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Imagenes de productos visibles para todos"
  ON public.producto_imagenes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin inserta imagenes"
  ON public.producto_imagenes FOR INSERT
  TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin edita imagenes"
  ON public.producto_imagenes FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin elimina imagenes"
  ON public.producto_imagenes FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));