import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/registro")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { nombre },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cuenta creada. Inicia sesión con tu nueva cuenta.");
    navigate({ to: "/login" });
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error("No se pudo continuar con Google");
  };

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Sumate a Franca para guardar tus piezas favoritas y seguir tus pedidos."
      footer={
        <p>
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="nombre" className="text-xs tracking-brand uppercase">Nombre</Label>
          <Input id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="h-11 rounded-none border-0 border-b bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs tracking-brand uppercase">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-none border-0 border-b bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs tracking-brand uppercase">Contraseña</Label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-none border-0 border-b bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" />
          <p className="text-[11px] text-muted-foreground">Mínimo 6 caracteres.</p>
        </div>
        <Button type="submit" disabled={loading} className="w-full h-12 rounded-none tracking-brand uppercase text-xs">
          {loading ? "Creando…" : "Crear cuenta"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground tracking-brand uppercase">
        <span className="h-px flex-1 bg-border" />
        <span>o</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </AuthLayout>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.12A6.99 6.99 0 0 1 5.47 12c0-.74.13-1.46.36-2.12V7.04H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.96l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
