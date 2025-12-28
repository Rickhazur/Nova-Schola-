import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Trophy, Flame, Target, ArrowRight, BookOpen, Zap, Loader2, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface StudentStats {
  tutorSessions: number;
  avgAccuracy: number;
  arenaRank: number | null;
  flashcardsMastered: number;
  streak: number;
  lastSessionProgress: number;
  lastSessionTopic: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, role, loading, isPrimaryStudent } = useAuth();
  const [stats, setStats] = useState<StudentStats>({
    tutorSessions: 0,
    avgAccuracy: 0,
    arenaRank: null,
    flashcardsMastered: 0,
    streak: 0,
    lastSessionProgress: 0,
    lastSessionTopic: "",
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch student stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Fetch tutor sessions count
        const { count: sessionCount } = await supabase
          .from('tutor_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', user.id);

        // Fetch ICFES stats for accuracy
        const { data: icfesStats } = await supabase
          .from('icfes_stats')
          .select('total_correct, total_questions_answered')
          .eq('student_id', user.id)
          .single();

        // Calculate average accuracy
        let avgAccuracy = 0;
        if (icfesStats && icfesStats.total_questions_answered > 0) {
          avgAccuracy = Math.round((icfesStats.total_correct / icfesStats.total_questions_answered) * 100);
        }

        // Fetch coins for basic engagement metric
        const { data: coinsData } = await supabase
          .from('student_coins')
          .select('total_earned')
          .eq('student_id', user.id)
          .single();

        setStats({
          tutorSessions: sessionCount || 0,
          avgAccuracy,
          arenaRank: null, // No ranking system yet
          flashcardsMastered: 0, // No flashcard tracking yet
          streak: 0, // Could calculate from session dates
          lastSessionProgress: 0,
          lastSessionTopic: isPrimaryStudent() ? "Matemáticas - Fracciones" : "Álgebra - Ecuaciones Cuadráticas",
        });

      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (user && !loading) {
      fetchStats();
    }
  }, [user, loading, isPrimaryStudent]);

  // Redirect if not logged in or not a student
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (role === "admin") {
        navigate("/app/panel-control");
      } else if (role === "student" && !profile?.onboarding_completed) {
        navigate("/app/onboarding");
      }
    }
  }, [user, role, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profile?.full_name?.split(" ")[0] || "Estudiante";
  const tutorRoute = isPrimaryStudent() ? "/app/tutor-ia/primary" : "/app/tutor-ia/highschool";
  const gradeLabel = profile?.grade_level ? `Grado ${profile.grade_level}` : "";

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Welcome section */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">¡Hola, {displayName}! 👋</h1>
            <p className="text-muted-foreground mt-1">
              {gradeLabel && <span className="text-primary font-medium">{gradeLabel}</span>}
              {gradeLabel && " · "}
              Continúa tu aprendizaje donde lo dejaste
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild>
              <Link to="/app/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            {stats.streak > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                <Flame className="w-5 h-5 text-accent" />
                <span className="font-semibold text-accent">{stats.streak} días de racha</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.tutorSessions}</p>
                  <p className="text-xs text-muted-foreground">Sesiones de tutoría</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.avgAccuracy}%</p>
                  <p className="text-xs text-muted-foreground">Precisión promedio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.arenaRank ? `#${stats.arenaRank}` : "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">Ranking Arena</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.flashcardsMastered}</p>
                  <p className="text-xs text-muted-foreground">Flashcards dominadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Continue learning */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Continuar aprendiendo</CardTitle>
            <CardDescription>
              {stats.tutorSessions > 0 
                ? "Retoma tu última sesión de tutoría" 
                : "Comienza tu primera sesión de tutoría"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{stats.lastSessionTopic}</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.lastSessionProgress > 0 
                    ? `Progreso: ${stats.lastSessionProgress}% completado`
                    : "¡Comienza tu aprendizaje hoy!"
                  }
                </p>
                {stats.lastSessionProgress > 0 && (
                  <Progress value={stats.lastSessionProgress} className="h-2 mt-2" />
                )}
              </div>
              <Button asChild variant="orange">
                <Link to={tutorRoute}>
                  {stats.tutorSessions > 0 ? "Continuar" : "Iniciar"} Tutoría <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group">
            <CardContent className="p-6">
              <Link to="/app/tutoria-inteligente" className="block">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Tutoría Inteligente</h3>
                <p className="text-sm text-muted-foreground">Domina Math Mastery IB/AP con IA</p>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-accent/50 transition-colors cursor-pointer group">
            <CardContent className="p-6">
              <Link to="/app/flashcards" className="block">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Zap className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">AI Flashcards</h3>
                <p className="text-sm text-muted-foreground">Repaso espaciado inteligente</p>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-gold/50 transition-colors cursor-pointer group">
            <CardContent className="p-6">
              <Link to="/app/arena" className="block">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <Trophy className="w-6 h-6 text-gold" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Arena & Ranking</h3>
                <p className="text-sm text-muted-foreground">Compite y gana recompensas</p>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;