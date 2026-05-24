
DROP POLICY IF EXISTS "Productos: admins pueden subir" ON storage.objects;
DROP POLICY IF EXISTS "Productos: admins pueden actualizar" ON storage.objects;
DROP POLICY IF EXISTS "Productos: admins pueden eliminar" ON storage.objects;

CREATE POLICY "Productos: admins pueden subir"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'productos' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Productos: admins pueden actualizar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'productos' AND private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'productos' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Productos: admins pueden eliminar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'productos' AND private.has_role(auth.uid(), 'admin'::app_role));
