import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Target, 
  Calendar, 
  BookOpen, 
  Loader2, 
  Sparkles, 
  ChevronRight,
  CheckCircle,
  Clock,
  Flame
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WeeklyPlan {
  week: number;
  focus: string;
  topics: string[];
  sessions: number;
  activities: string[];
}

interface RecommendedSession {
  topic: string;
  estimated_minutes: number;
  difficulty: string;
  week: number;
}

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
  recommended_sessions: RecommendedSession[];
  weekly_plan: WeeklyPlan[];
  completed_sessions: number;
  total_sessions: number;
}

interface LevelingPlanCardProps {
  studentId: string;
  plan: LevelingPlan | null;
  onPlanGenerated: (plan: LevelingPlan) => void;
  isLoading?: boolean;
}

export function LevelingPlanCard({ studentId, plan, onPlanGenerated, isLoading: externalLoading }: LevelingPlanCardProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const generatePlan = async (subject: string) => {
    setIsGenerating(subject);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para generar un plan",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke('generate-leveling-plan', {
        body: { studentId, subject }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error al generar el plan');
      }

      if (response.data?.plan) {
        toast({
          title: "¡Plan generado!",
          description: `Tu plan de nivelación de ${subject} está listo`,
        });
        onPlanGenerated(response.data.plan);
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo generar el plan",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(null);
    }
  };

  // Calculate current week
  const getCurrentWeek = () => {
    if (!plan) return 1;
    const start = new Date(plan.start_date);
    const now = new Date();
    const diffTime = now.getTime() - start.getTime();
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1;
    return Math.min(Math.max(diffWeeks, 1), 4);
  };

  const currentWeek = getCurrentWeek();
  const progressPercentage = plan ? (plan.completed_sessions / plan.total_sessions) * 100 : 0;

  if (externalLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // No active plan
  if (!plan) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-foreground">Progreso Académico</CardTitle>
              <CardDescription>Planes de nivelación personalizados con IA</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No hay plan de nivelación activo
            </h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Genera un plan personalizado basado en el desempeño del estudiante en las sesiones de tutoría.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="orange" 
                onClick={() => generatePlan("Matemáticas")}
                disabled={!!isGenerating}
                className="gap-2"
              >
                {isGenerating === "Matemáticas" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Asignar Plan Matemáticas (4 semanas)
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => generatePlan("Física")}
                disabled={!!isGenerating}
                className="gap-2 border-border"
              >
                {isGenerating === "Física" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    Asignar Plan Física (Demo)
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active plan exists
  const currentWeekPlan = plan.weekly_plan?.find((w: WeeklyPlan) => w.week === currentWeek);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-foreground">Progreso Académico</CardTitle>
              <CardDescription>Plan de nivelación activo</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-accent/30 text-accent">
            {plan.status === 'ACTIVE' ? 'Activo' : plan.status === 'COMPLETED' ? 'Completado' : 'Pendiente'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan overview */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-foreground">{plan.topic}</h3>
              <p className="text-sm text-muted-foreground">{plan.subject}</p>
            </div>
            <div className="flex items-center gap-1 text-gold">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-medium">Nivel {plan.difficulty_level}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Semana {currentWeek} de 4</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {plan.completed_sessions}/{plan.total_sessions} sesiones
              </span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progreso general</span>
              <span className="text-foreground font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        {/* Current week focus */}
        {currentWeekPlan && (
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">Esta semana: {currentWeekPlan.focus}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentWeekPlan.topics?.map((topic: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="bg-primary/10 text-primary border-0">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Dialog open={showDetail} onOpenChange={setShowDetail}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 border-border gap-2">
                Ver detalle del plan
                <ChevronRight className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{plan.topic}</DialogTitle>
                <DialogDescription>{plan.goals}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                {plan.weekly_plan?.map((week: WeeklyPlan) => (
                  <div 
                    key={week.week} 
                    className={`p-4 rounded-lg border ${
                      week.week === currentWeek 
                        ? 'bg-primary/5 border-primary/30' 
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground">
                        Semana {week.week}: {week.focus}
                      </h4>
                      {week.week === currentWeek && (
                        <Badge className="bg-primary text-primary-foreground">Actual</Badge>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Temas:</p>
                        <div className="flex flex-wrap gap-2">
                          {week.topics?.map((topic: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="border-border">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {week.activities && week.activities.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Actividades:</p>
                          <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                            {week.activities.map((activity: string, idx: number) => (
                              <li key={idx}>{activity}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <p className="text-sm text-muted-foreground">
                        {week.sessions} sesiones programadas
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
