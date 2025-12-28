import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LevelingPlanCard } from "@/components/leveling/LevelingPlanCard";
import { WhatsAppSummaryCard } from "@/components/guardian/WhatsAppSummaryCard";
import { TokenUsageCard } from "@/components/subscription/TokenUsageCard";
import { AdminPlanManager } from "@/components/subscription/AdminPlanManager";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { PaymentManagement } from "@/components/subscription/PaymentManagement";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Settings,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  Calendar,
  BarChart3,
  Bell,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";

const students = [
  {
    name: "Estudiante 1",
    avatar: "E1",
    lastActive: "Hace 2 horas",
    weeklyProgress: 75,
    status: "on-track",
  },
  {
    name: "Estudiante 2",
    avatar: "E2",
    lastActive: "Hace 1 día",
    weeklyProgress: 45,
    status: "needs-attention",
  },
];

const recentActivity = [
  { action: "Completó sesión de matemáticas", student: "Estudiante 1", time: "Hace 2h" },
  { action: "Ganó 150 monedas en Arena", student: "Estudiante 1", time: "Hace 4h" },
  { action: "Subió evidencia de tarea", student: "Estudiante 2", time: "Hace 1d" },
];

interface LevelingPlan {
  id: string;
  student_id: string;
  subject: string;
  topic: string;
  start_date: string;
  end_date: string;
  status: string;
  difficulty_level: number;
  goals: string;
  recommended_sessions: any[];
  weekly_plan: any[];
  completed_sessions: number;
  total_sessions: number;
}

const PanelControl = () => {
  const navigate = useNavigate();
  const { user, profile, role, loading: authLoading } = useAuth();
  const [activePlan, setActivePlan] = useState<LevelingPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch active leveling plan
  useEffect(() => {
    const fetchActivePlan = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('leveling_plans')
          .select('*')
          .eq('student_id', user.id)
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: false })
          .maybeSingle();

        if (error) {
          console.error('Error fetching leveling plan:', error);
        } else if (data) {
          setActivePlan(data as LevelingPlan);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoadingPlan(false);
      }
    };

    if (user) {
      fetchActivePlan();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Panel de Control</h1>
            <p className="text-muted-foreground mt-1">
              Monitorea el progreso de los estudiantes
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-border">
              <Bell className="w-4 h-4 mr-2" />
              Alertas
            </Button>
            <Button variant="outline" className="border-border">
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">2</p>
                  <p className="text-xs text-muted-foreground">Estudiantes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">12.5h</p>
                  <p className="text-xs text-muted-foreground">Tiempo esta semana</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">+15%</p>
                  <p className="text-xs text-muted-foreground">Mejora promedio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">28</p>
                  <p className="text-xs text-muted-foreground">Tareas completadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Token Usage and Leveling Plan */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TokenUsageCard showAdminControls={role === 'admin'} />
          
          <FeatureGate feature="levelingPlan" requiredPlan="PRO">
            <LevelingPlanCard
              studentId={user?.id || ''}
              plan={activePlan}
              onPlanGenerated={(plan) => setActivePlan(plan)}
              isLoading={loadingPlan}
            />
          </FeatureGate>
          
          <FeatureGate feature="weeklyWhatsAppReports" requiredPlan="PRO">
            <WhatsAppSummaryCard
              studentId={user?.id || ''}
              studentName={profile?.full_name || 'Estudiante'}
              guardianWhatsapp={profile?.guardian_whatsapp}
            />
          </FeatureGate>
        </div>

        {/* Admin Payment & Plan Management - Only for admins */}
        {role === 'admin' && (
          <>
            <PaymentManagement />
            <AdminPlanManager />
          </>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students Overview */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">Estudiantes</CardTitle>
                    <CardDescription>Progreso semanal</CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-border">
                  Ver todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.map((student, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-foreground">{student.avatar}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.lastActive}</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          student.status === "on-track"
                            ? "border-accent/30 text-accent"
                            : "border-gold/30 text-gold"
                        }
                      >
                        {student.status === "on-track" ? "En buen camino" : "Necesita atención"}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progreso semanal</span>
                        <span className="text-foreground font-medium">{student.weeklyProgress}%</span>
                      </div>
                      <Progress value={student.weeklyProgress} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Actividad Reciente</CardTitle>
                  <CardDescription>Últimas acciones de los estudiantes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                  >
                    <div>
                      <p className="font-medium text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.student}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tools */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-gold" />
              </div>
              <div>
                <CardTitle className="text-foreground">Herramientas de Administración</CardTitle>
                <CardDescription>Acceso rápido a funciones administrativas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="h-auto p-4 border-border hover:border-primary/50 justify-start">
                <Link to="/admin/tutor-sessions">
                  <div className="text-left">
                    <p className="font-medium text-foreground">Sesiones de Tutoría</p>
                    <p className="text-xs text-muted-foreground">Ver historial completo</p>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 border-border hover:border-primary/50 justify-start">
                <div className="text-left">
                  <p className="font-medium text-foreground">Reportes</p>
                  <p className="text-xs text-muted-foreground">Generar informes de progreso</p>
                </div>
              </Button>
              <Button variant="outline" className="h-auto p-4 border-border hover:border-primary/50 justify-start">
                <div className="text-left">
                  <p className="font-medium text-foreground">Configuración</p>
                  <p className="text-xs text-muted-foreground">Ajustes de la cuenta</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default PanelControl;
