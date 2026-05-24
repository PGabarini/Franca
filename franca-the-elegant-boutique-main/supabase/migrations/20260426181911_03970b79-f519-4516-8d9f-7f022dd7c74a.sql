-- ENUMS
CREATE TYPE public.categoria_producto AS ENUM ('Sweaters','Pantalones','Camisas','Abrigos','Faldas','Accesorios');
CREATE TYPE public.estado_pedido AS ENUM ('pendiente','confirmado','enviado','entregado','cancelado');

-- PRODUCTOS
CREATE TABLE public.productos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  precio NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  imagen_url TEXT NOT NULL DEFAULT '',
  categoria public.categoria_producto NOT NULL,
  talles TEXT[] NOT NULL DEFAULT '{}',
  color TEXT NOT NULL DEFAULT '',
  destacado BOOLEAN NOT NULL DEFAULT false,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_productos_categoria ON public.productos(categoria);
CREATE INDEX idx_productos_destacado ON public.productos(destacado);

-- PERFILES
CREATE TABLE public.perfiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT,
  telefono TEXT,
  direccion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ROLES (separate table per security best practice)
CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- PEDIDOS
CREATE TABLE public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT,
  total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  estado public.estado_pedido NOT NULL DEFAULT 'pendiente',
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pedidos_user ON public.pedidos(user_id);
CREATE INDEX idx_pedidos_estado ON public.pedidos(estado);

-- CARRITO_ITEMS (líneas del pedido)
CREATE TABLE public.carrito_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
  nombre_snapshot TEXT NOT NULL,
  precio_unitario NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  talle TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_carrito_items_pedido ON public.carrito_items(pedido_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_productos_updated BEFORE UPDATE ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_perfiles_updated BEFORE UPDATE ON public.perfiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_pedidos_updated BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre) VALUES (NEW.id, NEW.raw_user_meta_data->>'nombre');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ENABLE RLS
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrito_items ENABLE ROW LEVEL SECURITY;

-- POLICIES: productos (lectura pública de activos, escritura solo admin)
CREATE POLICY "Productos activos visibles para todos"
  ON public.productos FOR SELECT USING (activo = true);
CREATE POLICY "Admin gestiona productos"
  ON public.productos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- POLICIES: perfiles
CREATE POLICY "Usuario ve su perfil"
  ON public.perfiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Usuario edita su perfil"
  ON public.perfiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Usuario inserta su perfil"
  ON public.perfiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- POLICIES: user_roles (solo admin lee/edita; usuario ve sus roles)
CREATE POLICY "Usuario ve sus roles"
  ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin gestiona roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- POLICIES: pedidos (cualquiera puede crear pedido — incluye invitados; admin ve todo; user ve los suyos)
CREATE POLICY "Crear pedido (incluye invitado)"
  ON public.pedidos FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Usuario ve sus pedidos"
  ON public.pedidos FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin ve todos los pedidos"
  ON public.pedidos FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin actualiza pedidos"
  ON public.pedidos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- POLICIES: carrito_items
CREATE POLICY "Insertar items con pedido"
  ON public.carrito_items FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pedidos p
      WHERE p.id = pedido_id
        AND (p.user_id IS NULL OR p.user_id = auth.uid())
    )
  );
CREATE POLICY "Usuario ve items de sus pedidos"
  ON public.carrito_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_id AND p.user_id = auth.uid()));
CREATE POLICY "Admin ve todos los items"
  ON public.carrito_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));