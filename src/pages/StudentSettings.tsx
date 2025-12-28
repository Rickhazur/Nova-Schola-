import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ChangePasswordCard } from "@/components/settings/ChangePasswordCard";
import { ArrowLeft, Loader2, User, Settings } from "lucide-react";

const StudentSettings = () => {
  const navigate = useNavigate();
  const { user, profile, role, loading } = useAuth();
  const [enrolledBy, setEnrolledBy] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (role !== "student") {
        navigate("/");
      }
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    const fetchEnrolledBy = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('student_profiles')
        .select('enrolled_by')
        .eq('user_id', user.id)
        .single();
      
      if (!error && data) {
        setEnrolledBy(data.enrolled_by);
      }
      setLoadingProfile(false);
    };

    if (user) {
      fetchEnrolledBy();
    }
  }, [user]);

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/app/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              Configuración
            </h1>
            <p className="text-muted-foreground">Administra tu cuenta y preferencias</p>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <User className="h-5 w-5 text-primary" />
              Información de Perfil
            </CardTitle>
            <CardDescription>Tu información personal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium text-foreground">{profile?.full_name || "No disponible"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Correo electrónico</p>
                <p className="font-medium text-foreground">{user?.email || "No disponible"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grado</p>
                <p className="font-medium text-foreground">
                  {profile?.grade_level ? `Grado ${profile.grade_level}` : "No especificado"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium text-foreground">{profile?.plan || "BASIC"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <ChangePasswordCard enrolledBy={enrolledBy} />
      </div>
    </AppLayout>
  );
};

export default StudentSettings;