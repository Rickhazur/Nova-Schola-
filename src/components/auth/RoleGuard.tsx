import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Loader2, Shield, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  fallbackPath?: string;
  showMessage?: boolean;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallbackPath,
  showMessage = true 
}: RoleGuardProps) {
  const { role, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // No role found - deny access (security: prevent access when role check fails)
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Verificando permisos...
          </h2>
          <p className="text-muted-foreground mb-6">
            No se pudo verificar tu rol. Por favor, intenta cerrar sesión e iniciar sesión nuevamente.
          </p>
          <Button asChild>
            <Link to="/auth">Ir a Iniciar Sesión</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Role not allowed
  if (!allowedRoles.includes(role)) {
    if (fallbackPath) {
      return <Navigate to={fallbackPath} replace />;
    }

    if (showMessage) {
      const isAdmin = role === "admin";
      const isGuardian = role === "guardian";
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              {isAdmin ? (
                <Shield className="w-8 h-8 text-muted-foreground" />
              ) : (
                <GraduationCap className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {isAdmin ? "Vista de Estudiantes" : isGuardian ? "Vista de Estudiantes" : "Acceso Restringido"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isAdmin 
                ? "Esta sección está diseñada para estudiantes. Como administrador, puedes gestionar usuarios desde el Panel de Control."
                : isGuardian
                ? "Esta sección está diseñada para estudiantes. Como acudiente, puedes ver el progreso desde tu portal."
                : "Esta sección es exclusiva para administradores."}
            </p>
            <Button asChild>
              <Link to={isAdmin ? "/app/panel-control" : isGuardian ? "/guardian/my-students" : "/app/dashboard"}>
                {isAdmin ? "Ir al Panel de Control" : isGuardian ? "Ir a Mis Estudiantes" : "Ir al Dashboard"}
              </Link>
            </Button>
          </div>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}