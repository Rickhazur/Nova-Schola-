import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SidebarProvider } from '@/components/ui/sidebar';
import { GuardianSidebar } from '@/components/layout/GuardianSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { gradeToLevel, levelLabels } from '@/types/guardian';
import { 
  ArrowLeft, 
  GraduationCap, 
  Coins, 
  Calendar, 
  BookOpen,
  Target,
  TrendingUp
} from 'lucide-react';

export default function StudentProgress() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  // Fetch student profile
  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ['guardian-student', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', id)
        .eq('guardian_id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user?.id
  });

  // Fetch tutor sessions count
  const { data: sessionsData } = useQuery({
    queryKey: ['guardian-student-sessions', id],
    queryFn: async () => {
      if (!id) return null;
      const { count, error } = await supabase
        .from('tutor_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', id);
      
      if (error) throw error;
      return { count: count || 0 };
    },
    enabled: !!id
  });

  // Fetch ICFES stats
  const { data: icfesStats } = useQuery({
    queryKey: ['guardian-student-icfes', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('icfes_stats')
        .select('*')
        .eq('student_id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  if (loadingStudent) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <GuardianSidebar />
          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!student) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <GuardianSidebar />
          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">No se encontró el estudiante</p>
                  <Button asChild>
                    <Link to="/guardian/my-students">Volver a mis estudiantes</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const level = gradeToLevel(student.grade_level);
  const tokenPercentage = (student.tokens_used_this_month / student.token_allowance) * 100;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <GuardianSidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Back link */}
            <Link 
              to="/guardian/my-students" 
              className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a mis estudiantes
            </Link>

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{student.full_name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{levelLabels[level]}</Badge>
                  <Badge variant="outline">Plan {student.plan}</Badge>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              {/* Token Usage */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Coins className="w-4 h-4 text-primary" />
                    Uso de Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {student.tokens_used_this_month} / {student.token_allowance}
                  </div>
                  <Progress value={tokenPercentage} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(tokenPercentage)}% usado este mes
                  </p>
                </CardContent>
              </Card>

              {/* Sessions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Sesiones de Tutoría
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sessionsData?.count || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sesiones completadas
                  </p>
                </CardContent>
              </Card>

              {/* ICFES Score */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Puntaje ICFES
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {icfesStats?.avg_score_global 
                      ? Math.round(Number(icfesStats.avg_score_global)) 
                      : '--'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {icfesStats?.total_questions_answered || 0} preguntas respondidas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* ICFES Details */}
            {icfesStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Desempeño ICFES por Área
                  </CardTitle>
                  <CardDescription>
                    Puntajes promedio en cada área de conocimiento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { name: 'Matemáticas', score: icfesStats.score_matematicas },
                      { name: 'Lectura Crítica', score: icfesStats.score_lectura_critica },
                      { name: 'Ciencias Naturales', score: icfesStats.score_ciencias },
                      { name: 'Sociales y Ciudadanas', score: icfesStats.score_sociales },
                      { name: 'Inglés', score: icfesStats.score_ingles }
                    ].map(area => (
                      <div key={area.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="font-medium">{area.name}</span>
                        <span className="text-lg font-bold text-primary">
                          {area.score ? Math.round(Number(area.score)) : '--'}
                        </span>
                      </div>
                    ))}
                  </div>
                  {icfesStats.strongest_area && (
                    <div className="mt-4 p-3 bg-green-500/10 rounded-lg">
                      <p className="text-sm">
                        <span className="font-medium text-green-600">Área más fuerte:</span>{' '}
                        {icfesStats.strongest_area}
                      </p>
                    </div>
                  )}
                  {icfesStats.weakest_area && (
                    <div className="mt-2 p-3 bg-orange-500/10 rounded-lg">
                      <p className="text-sm">
                        <span className="font-medium text-orange-600">Área a mejorar:</span>{' '}
                        {icfesStats.weakest_area}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Account Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Información de la Cuenta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de registro</p>
                    <p className="font-medium">
                      {new Date(student.created_at).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado del onboarding</p>
                    <p className="font-medium">
                      {student.onboarding_completed ? 'Completado' : 'Pendiente'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Próximo reinicio de tokens</p>
                    <p className="font-medium">
                      {new Date(student.token_reset_date).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                      {student.status === 'active' ? 'Activo' : student.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
