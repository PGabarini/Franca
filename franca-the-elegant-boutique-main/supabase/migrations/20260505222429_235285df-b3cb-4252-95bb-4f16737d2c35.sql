
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Productos: lectura pública"
ON storage.objects FOR SELECT
USING (bucket_id = 'productos');

CREATE POLICY "Productos: admins pueden subir"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'productos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Productos: admins pueden actualizar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'productos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Productos: admins pueden eliminar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'productos' AND public.has_role(auth.uid(), 'admin'));
