DROP POLICY IF EXISTS site_imagenes_admin_insert ON public.site_imagenes;
DROP POLICY IF EXISTS site_imagenes_admin_update ON public.site_imagenes;

CREATE POLICY site_imagenes_admin_insert
ON public.site_imagenes
FOR INSERT
TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY site_imagenes_admin_update
ON public.site_imagenes
FOR UPDATE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated;
