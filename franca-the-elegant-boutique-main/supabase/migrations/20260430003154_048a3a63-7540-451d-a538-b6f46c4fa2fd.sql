-- Tabla de favoritos por usuario
CREATE TABLE public.favoritos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  producto_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, producto_id)
);

CREATE INDEX idx_favoritos_user ON public.favoritos(user_id);
CREATE INDEX idx_favoritos_producto ON public.favoritos(producto_id);

ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;

-- El usuario solo ve, crea y borra sus propios favoritos
CREATE POLICY "Usuario ve sus favoritos"
ON public.favoritos FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Usuario crea sus favoritos"
ON public.favoritos FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuario elimina sus favoritos"
ON public.favoritos FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Admin puede ver todos (para métricas)
CREATE POLICY "Admin ve todos los favoritos"
ON public.favoritos FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));