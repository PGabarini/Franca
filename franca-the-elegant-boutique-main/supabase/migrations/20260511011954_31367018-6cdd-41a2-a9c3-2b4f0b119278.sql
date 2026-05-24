
CREATE TABLE public.site_imagenes (
  key TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_imagenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_imagenes_public_read"
  ON public.site_imagenes FOR SELECT
  USING (true);

CREATE POLICY "site_imagenes_admin_insert"
  ON public.site_imagenes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "site_imagenes_admin_update"
  ON public.site_imagenes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_imagenes (key, url, alt) VALUES
  ('home_hero', '', 'Editorial Franca otoño invierno 2026'),
  ('home_editorial', '', 'Campaña Franca'),
  ('auth_side', '', 'Editorial Franca');
