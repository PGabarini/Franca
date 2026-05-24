CREATE TABLE public.producto_consultas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  nombre_usuario TEXT NOT NULL DEFAULT '',
  pregunta TEXT NOT NULL,
  respuesta TEXT,
  respondida_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_producto_consultas_producto ON public.producto_consultas(producto_id, created_at DESC);
CREATE INDEX idx_producto_consultas_user ON public.producto_consultas(user_id);

ALTER TABLE public.producto_consultas ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer las consultas que ya tienen respuesta
CREATE POLICY "Consultas respondidas son publicas"
ON public.producto_consultas
FOR SELECT
TO anon, authenticated
USING (respuesta IS NOT NULL);

-- Usuario ve sus propias consultas (incluso sin responder)
CREATE POLICY "Usuario ve sus consultas"
ON public.producto_consultas
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admin ve todas
CREATE POLICY "Admin ve todas las consultas"
ON public.producto_consultas
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

-- Solo usuarios logueados crean preguntas para si mismos
CREATE POLICY "Usuario crea su consulta"
ON public.producto_consultas
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Solo admin responde / edita
CREATE POLICY "Admin responde consultas"
ON public.producto_consultas
FOR UPDATE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- Solo admin elimina
CREATE POLICY "Admin elimina consultas"
ON public.producto_consultas
FOR DELETE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_producto_consultas_updated_at
BEFORE UPDATE ON public.producto_consultas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();