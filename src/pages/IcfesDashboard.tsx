import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Target,
  Brain,
  BookOpen,
  Timer,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Award,
  FileText,
  Zap,
  Play,
} from "lucide-react";

interface ScoresBySubject {
  matematicas?: number;
  lectura_critica?: number;
  sociales?: number;
  ciencias?: number;
  ingles?: number;
}

interface IcfesResult {
  score_global: number | null;
  scores_by_subject: ScoresBySubject | null;
  time_spent_seconds: number;
  completed_at: string;
}

interface IcfesStats {
  weakest_area: string | null;
  strongest_area: string | null;
  avg_score_global: number | null;
  total_questions_answered: number;
}

const AREA_LABELS: Record<string, string> = {
  matematicas: "Matemáticas",
  lectura: "Lectura Crítica",
  lectura_critica: "Lectura Crítica",
  ciencias: "Ciencias Naturales",
  sociales: "Sociales y Ciudadanas",
  ingles: "Inglés",
};

export default function IcfesDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [results, setResults] = useState<IcfesResult[]>([]);
  const [stats, setStats] = useState<IcfesStats | null>(null);
  const [loading, setLoading] = useState(true);

  const firstName = profile?.full_name?.split(" ")[0] || "Estudiante";

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      // Fetch results
      const { data: resultsData } = await supabase
        .from("icfes_results")
        .select("score_global, scores_by_subject, time_spent_seconds, completed_at")
        .eq("student_id", user.id)
        .order("completed_at", { ascending: false });

      if (resultsData) {
        setResults(resultsData as IcfesResult[]);
      }

      // Fetch stats
      const { data: statsData } = await supabase
        .from("icfes_stats")
        .select("weakest_area, strongest_area, avg_score_global, total_questions_answered")
        .eq("student_id", user.id)
        .maybeSingle();

      if (statsData) {
        setStats(statsData);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const isLoading = authLoading || loading;
  const latestResult = results[0];
  const globalScore = latestResult?.score_global ?? null;
  const scoresBySubject: ScoresBySubject = (latestResult?.scores_by_subject as ScoresBySubject) || {};
  const mocksCompleted = results.length;
  const totalTimeMinutes = Math.round(results.reduce((sum, r) => sum + (r.time_spent_seconds || 0), 0) / 60);
  const suggestedGoal = globalScore ? globalScore + 30 : 350;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Preparación ICFES, {firstName}</h1>
            <p className="text-muted-foreground mt-1">
              Entrena con simulacros, técnica y análisis estilo Milton Ochoa, integrado a tus contenidos Nova Schola (IB
              + currículo colombiano).
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/app/icfes/entrenador?area=matematicas&count=10">
                <Play className="mr-2 h-4 w-4" />
                Práctica Libre
              </Link>
            </Button>
            <Button asChild variant="orange">
              <Link to="/app/icfes/entrenador?area=matematicas&count=20">
                Iniciar Simulacro
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Puntaje simulado */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardDescription>Puntaje simulado</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "—" : globalScore !== null ? `${globalScore} / 500` : "Sin datos"}
              </p>
              <Progress value={globalScore !== null ? (globalScore / 500) * 100 : 0} className="mt-2 h-2" />
            </CardContent>
          </Card>

          {/* Simulacros completados */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardDescription>Simulacros completados</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{isLoading ? "—" : mocksCompleted}</p>
            </CardContent>
          </Card>

          {/* Tiempo dedicado */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                <CardDescription>Tiempo dedicado</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{isLoading ? "—" : `${totalTimeMinutes} min`}</p>
            </CardContent>
          </Card>

          {/* Meta sugerida */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <CardDescription>Meta sugerida</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{isLoading ? "—" : `${suggestedGoal}+`}</p>
            </CardContent>
          </Card>
        </div>

        {/* Recommended Next Step */}
        {stats?.weakest_area && (
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 dark:border-orange-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <Zap className="h-5 w-5" />
                Próximo paso recomendado
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-muted-foreground">
                  Tu área con mayor oportunidad de mejora es{" "}
                  <strong className="text-foreground">{AREA_LABELS[stats.weakest_area] || stats.weakest_area}</strong>.
                  {stats.total_questions_answered > 0 && (
                    <> Has respondido {stats.total_questions_answered} preguntas hasta ahora.</>
                  )}
                </p>
              </div>
              <Button variant="orange" asChild className="flex-shrink-0">
                <Link to={`/app/icfes/entrenador?area=${stats.weakest_area}&count=10`}>
                  Practicar {AREA_LABELS[stats.weakest_area] || stats.weakest_area}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="resumen" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="resumen">Resumen por área</TabsTrigger>
            <TabsTrigger value="entrenar">Entrenar por competencias</TabsTrigger>
            <TabsTrigger value="estrategias">Guías y estrategias</TabsTrigger>
          </TabsList>

          {/* Tab: Resumen */}
          <TabsContent value="resumen" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Matemáticas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Matemáticas
                  </CardTitle>
                  <CardDescription>Razonamiento cuantitativo, álgebra, funciones y geometría.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {isLoading ? "—" : (scoresBySubject.matematicas ?? "—")} / 100
                    </p>
                    <Progress value={scoresBySubject.matematicas ?? 0} className="mt-2 h-2" />
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/app/icfes/entrenador?area=matematicas&count=10">
                      Entrenar Matemáticas
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Lectura Crítica */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Lectura Crítica
                  </CardTitle>
                  <CardDescription>Comprensión lectora, análisis textual e inferencias.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {isLoading ? "—" : (scoresBySubject.lectura_critica ?? "—")} / 100
                    </p>
                    <Progress value={scoresBySubject.lectura_critica ?? 0} className="mt-2 h-2" />
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/app/icfes/entrenador?area=lectura_critica&count=10">
                      Entrenar Lectura Crítica
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Ciencias & Sociales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Ciencias & Sociales
                  </CardTitle>
                  <CardDescription>Competencias ciudadanas, ciencias naturales y sociales.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Sociales</p>
                      <p className="font-semibold text-foreground">
                        {isLoading ? "—" : (scoresBySubject.sociales ?? "—")} / 100
                      </p>
                      <Progress value={scoresBySubject.sociales ?? 0} className="mt-1 h-2" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ciencias</p>
                      <p className="font-semibold text-foreground">
                        {isLoading ? "—" : (scoresBySubject.ciencias ?? "—")} / 100
                      </p>
                      <Progress value={scoresBySubject.ciencias ?? 0} className="mt-1 h-2" />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/app/icfes/entrenador?area=ciencias&count=10">
                      Entrenar Ciencias & Sociales
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Entrenar */}
          <TabsContent value="entrenar" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Entrenador de competencias ICFES</CardTitle>
                <CardDescription>
                  Practica con preguntas tipo ICFES, recibe explicaciones técnicas detalladas y conecta lo aprendido con
                  el enfoque IB y el currículo colombiano.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button variant="secondary" className="h-auto py-4" asChild>
                    <Link to="/app/icfes/entrenador?area=matematicas&count=10" className="flex flex-col items-center gap-2">
                      <Brain className="h-6 w-6" />
                      <span>Matemáticas</span>
                    </Link>
                  </Button>
                  <Button variant="secondary" className="h-auto py-4" asChild>
                    <Link
                      to="/app/icfes/entrenador?area=lectura_critica&count=10"
                      className="flex flex-col items-center gap-2"
                    >
                      <BookOpen className="h-6 w-6" />
                      <span>Lectura Crítica</span>
                    </Link>
                  </Button>
                  <Button variant="secondary" className="h-auto py-4" asChild>
                    <Link to="/app/icfes/entrenador?area=ingles&count=10" className="flex flex-col items-center gap-2">
                      <FileText className="h-6 w-6" />
                      <span>Inglés</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Estrategias */}
          <TabsContent value="estrategias" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Estrategias estilo Milton Ochoa
                </CardTitle>
                <CardDescription>Técnicas probadas para maximizar tu puntaje en el ICFES.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>
                      <strong className="text-foreground">Técnica de descarte rápido:</strong> Identifica palabras
                      absolutas (siempre, nunca, todos) que suelen indicar distractores incorrectos.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>
                      <strong className="text-foreground">Manejo del tiempo:</strong> No dediques más de 90 segundos por
                      pregunta. Si no sabes, marca y sigue adelante.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>
                      <strong className="text-foreground">Conecta con IB:</strong> Relaciona los conceptos vistos en
                      clase con el formato de pregunta ICFES para reforzar tu comprensión.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>
                      <strong className="text-foreground">Lee primero las opciones:</strong> A veces las respuestas te
                      dan pistas sobre qué buscar en el texto o problema.
                    </span>
                  </li>
                </ul>
                <Button variant="outline" asChild>
                  <Link to="/app/icfes/estrategias">
                    Ver taller completo de estrategias
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
