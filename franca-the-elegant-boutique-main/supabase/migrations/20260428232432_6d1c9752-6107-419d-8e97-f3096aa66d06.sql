DROP POLICY IF EXISTS "Admin gestiona productos" ON public.productos;
DROP POLICY IF EXISTS "Productos activos visibles para todos" ON public.productos;

CREATE POLICY "Productos activos visibles para todos"
ON public.productos
FOR SELECT
TO public
USING (activo = true);

CREATE POLICY "Admins ven todos los productos"
ON public.productos
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins crean productos"
ON public.productos
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins editan productos"
ON public.productos
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins eliminan productos"
ON public.productos
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));