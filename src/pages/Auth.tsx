import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, GraduationCap, Shield, Globe } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<"estudiante" | "administrativo">("estudiante");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check for existing session and redirect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkUserRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUserRole = async (userId: string) => {
    // Check DB role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleData?.role === 'admin') {
      navigate("/app/panel-control");
    } else {
      // Also check metadata if DB redundant
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.role === 'admin') {
        navigate("/app/panel-control");
      } else {
        navigate("/app/dashboard");
      }
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Credenciales incorrectas. Verifica tu email y contraseña.");
          } else if (error.message.includes("Email not confirmed")) {
            toast.error("Por favor confirma tu email antes de iniciar sesión.");
          } else {
            toast.error(error.message);
          }
          return;
        }

        if (data.user) {
          toast.success("¡Bienvenido de vuelta!");
          checkUserRole(data.user.id);
        }
      } else {
        const redirectUrl = `${window.location.origin}/`;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              role: userType === 'estudiante' ? 'student' : 'admin',
              user_type: userType,
              full_name: email, // Fallback name
            },
          },
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            toast.error("Este email ya está registrado. Intenta iniciar sesión.");
          } else {
            toast.error(error.message);
          }
          return;
        }

        if (data.user) {
          toast.success("¡Cuenta creada! Revisa tu email para confirmar.");
        }
      }
    } catch (error: any) {
      toast.error("Ha ocurrido un error. Intenta de nuevo.");
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Dark with branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[hsl(var(--nova-dark))] nova-grid-bg relative flex-col items-center justify-center p-12">
        <div className="text-center space-y-8">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-[hsl(var(--nova-purple))] shadow-lg shadow-[hsl(var(--nova-purple)/0.4)]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-12 h-12 text-white"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              <path d="M8 7h6" />
              <path d="M8 11h8" />
            </svg>
          </div>

          {/* Brand Name */}
          <h1 className="text-5xl font-bold">
            <span className="text-[hsl(var(--nova-purple))]">Nova</span>
            <span className="text-white ml-2">Schola</span>
          </h1>

          {/* Tagline */}
          <p className="text-[hsl(var(--muted-foreground))] text-xl max-w-md">
            El futuro de la educación personalizada
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--nova-dark-lighter))] border border-[hsl(var(--border))]">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--nova-purple))]" />
              <span className="text-sm text-[hsl(var(--muted-foreground))]">AI Powered</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--nova-dark-lighter))] border border-[hsl(var(--border))]">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--nova-purple))]" />
              <span className="text-sm text-[hsl(var(--muted-foreground))]">Personalized Learning</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--nova-dark-lighter))] border border-[hsl(var(--border))]">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--nova-purple))]" />
              <span className="text-sm text-[hsl(var(--muted-foreground))]">24/7 Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-background">
        {/* Language selector */}
        <div className="flex justify-end p-4">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Globe className="w-4 h-4" />
            <span className="text-sm">ES</span>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">
                {isLogin ? "Bienvenido de vuelta" : "Crear cuenta"}
              </h2>
              <p className="text-muted-foreground">
                {isLogin
                  ? "Tu tutor personal de IA está esperando"
                  : "Únete a la revolución educativa"}
              </p>
            </div>

            {/* User Type Tabs */}
            <div className="flex rounded-lg border border-border p-1 bg-muted/30">
              <button
                onClick={() => setUserType("estudiante")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${userType === "estudiante"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <GraduationCap className="w-4 h-4" />
                Estudiante
              </button>
              <button
                onClick={() => setUserType("administrativo")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${userType === "administrativo"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Shield className="w-4 h-4" />
                Administrativo
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-background border-border focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground">
                    Contraseña
                  </Label>
                  {isLogin && (
                    <button
                      type="button"
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-12 bg-background border-border focus:ring-primary pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base rounded-full transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Toggle login/signup */}
            <p className="text-center text-muted-foreground">
              {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {isLogin ? "Crear cuenta gratis" : "Iniciar sesión"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
