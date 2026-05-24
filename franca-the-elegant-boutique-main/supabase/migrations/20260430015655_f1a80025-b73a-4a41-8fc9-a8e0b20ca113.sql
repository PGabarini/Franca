-- Extend estado_pedido enum
ALTER TYPE public.estado_pedido ADD VALUE IF NOT EXISTS 'esperando_transferencia';
ALTER TYPE public.estado_pedido ADD VALUE IF NOT EXISTS 'comprobante_recibido';
ALTER TYPE public.estado_pedido ADD VALUE IF NOT EXISTS 'pagado';
ALTER TYPE public.estado_pedido ADD VALUE IF NOT EXISTS 'enviado';
ALTER TYPE public.estado_pedido ADD VALUE IF NOT EXISTS 'cancelado';

-- Add columns to pedidos
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS cliente_email text,
  ADD COLUMN IF NOT EXISTS direccion_envio text,
  ADD COLUMN IF NOT EXISTS comprobante_url text,
  ADD COLUMN IF NOT EXISTS metodo_pago text NOT NULL DEFAULT 'transferencia';

-- Allow guest/owner to update their order's comprobante_url
CREATE POLICY "Cliente sube comprobante a su pedido"
ON public.pedidos
FOR UPDATE
TO anon, authenticated
USING ((user_id IS NULL) OR (user_id = auth.uid()))
WITH CHECK ((user_id IS NULL) OR (user_id = auth.uid()));

-- Bank details table
CREATE TABLE public.datos_bancarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titular TEXT NOT NULL DEFAULT '',
  cbu TEXT NOT NULL DEFAULT '',
  alias TEXT NOT NULL DEFAULT '',
  banco TEXT NOT NULL DEFAULT '',
  email_contacto TEXT NOT NULL DEFAULT '',
  notas TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.datos_bancarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Datos bancarios visibles para todos"
ON public.datos_bancarios FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin edita datos bancarios"
ON public.datos_bancarios FOR UPDATE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin inserta datos bancarios"
ON public.datos_bancarios FOR INSERT
TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_datos_bancarios_updated_at
BEFORE UPDATE ON public.datos_bancarios
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Insert single default row
INSERT INTO public.datos_bancarios (titular, cbu, alias, banco, email_contacto, notas)
VALUES ('', '', '', '', '', '');

-- Storage bucket for comprobantes (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes', 'comprobantes', false)
ON CONFLICT (id) DO NOTHING;

-- Anyone can upload a comprobante (path includes pedido_id)
CREATE POLICY "Subir comprobante"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'comprobantes');

-- Only admin can read/list comprobantes
CREATE POLICY "Admin lee comprobantes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'comprobantes' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin elimina comprobantes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'comprobantes' AND private.has_role(auth.uid(), 'admin'::app_role));