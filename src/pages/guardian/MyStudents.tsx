import { Link } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { GuardianSidebar } from '@/components/layout/GuardianSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useGuardianStudents } from '@/hooks/useGuardianStudents';
import { gradeToLevel, levelLabels } from '@/types/guardian';
import { UserPlus, GraduationCap, Coins, Eye, Users } from 'lucide-react';

export default function MyStudents() {
  const { data: students, isLoading, error } = useGuardianStudents();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <GuardianSidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Mis Estudiantes</h1>
                <p className="text-muted-foreground mt-1">Gestiona los estudiantes a tu cargo</p>
              </div>
              <Button asChild>
                <Link to="/guardian/add-student">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Agregar Estudiante
                </Link>
              </Button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-4 w-20" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <p className="text-destructive">Error al cargar los estudiantes. Intenta de nuevo.</p>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!isLoading && !error && students?.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Aún no has agregado estudiantes
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Agrega a los estudiantes bajo tu cuidado para monitorear su progreso académico.
                  </p>
                  <Button asChild size="lg">
                    <Link to="/guardian/add-student">
                      <UserPlus className="w-5 h-5 mr-2" />
                      Agregar mi primer estudiante
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Students Grid */}
            {!isLoading && !error && students && students.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map(student => {
                  const level = gradeToLevel(student.grade_level);
                  return (
                    <Card key={student.id} className="hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                              <GraduationCap className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{student.full_name}</CardTitle>
                              <Badge variant="secondary" className="mt-1">
                                {levelLabels[level]}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-muted-foreground mb-4">
                          <Coins className="w-4 h-4" />
                          <span className="text-sm">
                            {student.tokens_used_this_month} / {student.token_allowance} tokens usados
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-4">
                          <span className="text-sm">
                            Plan: <span className="font-medium text-foreground">{student.plan}</span>
                          </span>
                        </div>
                        <Button asChild variant="outline" className="w-full">
                          <Link to={`/guardian/student/${student.user_id}/progress`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Progreso
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
