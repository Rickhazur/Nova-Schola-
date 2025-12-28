import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Target,
  Brain,
  BookOpen,
  Beaker,
  Users,
  Languages,
  CheckCircle2,
  XCircle,
  Trophy,
  Home,
} from "lucide-react";

// ✅ Tipos alineados a la tabla real: public.icfes_questions
interface IcfesQuestion {
  id: string;
  area: string;
  competencia: string | null;
  enunciado: string;
  imagen_url: string | null;
  opcion_a: string;
  opcion_b: string;
  opcion_c: string;
  opcion_d: string;
  respuesta_correcta: string; // "A" | "B" | "C" | "D"
  dificultad: number;
  explicacion: string | null;
  is_active: boolean;
}

interface Answer {
  questionId: string;
  respuesta: string | null; // "A" | "B" | "C" | "D"
  timeSpent: number;
}

const AREA_ICONS: Record<string, typeof Brain> = {
  matematicas: Brain,
  lectura_critica: BookOpen,
  ciencias: Beaker,
  sociales: Users,
  ingles: Languages,
};

const AREA_LABELS: Record<string, string> = {
  matematicas: "Matemáticas",
  lectura_critica: "Lectura Crítica",
  ciencias: "Ciencias",
  sociales: "Sociales",
  ingles: "Inglés",
};

export default function IcfesTrainer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ✅ Compatibilidad: soporta URLs antiguas (?subject=) y nuevas (?area=)
  const rawArea = searchParams.get("area") || searchParams.get("subject") || "matematicas";
  const normalizedArea = rawArea === "lectura" ? "lectura_critica" : rawArea;

  const count = parseInt(searchParams.get("count") || searchParams.get("total") || "10");

  const [questions, setQuestions] = useState<IcfesQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // ✅ Función para cargar preguntas desde tu tabla real
  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      // cast a any para evitar problema de tipos generados
      const { data, error } = await (supabase
        .from("icfes_questions")
        .select("*")
        .eq("area", normalizedArea)
        .eq("is_active", true)
        .limit(count) as any);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No hay preguntas disponibles",
          description: `No se encontraron preguntas de ${AREA_LABELS[normalizedArea] || normalizedArea}.`,
          variant: "destructive",
        });
        setQuestions([]);
        return;
      }

      // Mezclar preguntas
      const shuffled: IcfesQuestion[] = [...(data as IcfesQuestion[])].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);

      // Inicializar respuestas vacías
      setAnswers(
        shuffled.map((q) => ({
          questionId: q.id,
          respuesta: null,
          timeSpent: 0,
        })),
      );

      setStartTime(Date.now());
      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error("Error loading questions:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las preguntas. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [normalizedArea, count]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (letter: "A" | "B" | "C" | "D") => {
    const timeSpent = Date.now() - questionStartTime;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = {
      questionId: currentQuestion.id,
      respuesta: letter,
      timeSpent,
    };
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setQuestionStartTime(Date.now());
    } else {
      finishSession();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setQuestionStartTime(Date.now());
    }
  };

  // ✅ Guarda el intento usando columnas reales de public.icfes_attempts
  const finishSession = async () => {
    const totalTimeMs = Date.now() - startTime;

    const totalQuestions = questions.length;
    const correctCount = answers.filter((ans, idx) => ans.respuesta === questions[idx].respuesta_correcta).length;

    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const elapsedSeconds = Math.floor(totalTimeMs / 1000);

    if (user?.id) {
      try {
        const attemptRow = {
          student_id: user.id,
          mode: "practica" as const,
          areas: [normalizedArea],
          total_questions: totalQuestions,
          time_limit_seconds: null,
          status: "completed",
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString(),
          score_global: scorePercentage,
          scores_by_area: { [normalizedArea]: scorePercentage },
        };

        const { error } = await supabase.from("icfes_attempts").insert([attemptRow]);

        if (error) {
          console.error("Supabase insert error icfes_attempts:", error);
          throw error;
        }

        toast({
          title: "Sesión completada",
          description: `Obtuviste ${correctCount} de ${totalQuestions} correctas.`,
        });
      } catch (err) {
        console.error("Error saving attempt (catch):", err);
        toast({
          title: "Error al guardar el intento",
          description: "Tus resultados se muestran, pero no pudimos guardar el intento en la base de datos.",
          variant: "destructive",
        });
      }
    }

    setShowResults(true);
  };

  const results = useMemo(() => {
    if (!showResults) return null;

    const correctCount = answers.filter((ans, idx) => ans.respuesta === questions[idx].respuesta_correcta).length;
    const percentage = Math.round((correctCount / questions.length) * 100);

    return {
      correctCount,
      incorrectCount: questions.length - correctCount,
      percentage,
      totalTime: Math.floor((Date.now() - startTime) / 1000),
    };
  }, [showResults, answers, questions, startTime]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando preguntas...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>No hay preguntas disponibles</CardTitle>
            <CardDescription>Intenta con otra área.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/app/icfes")}>
              <Home className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults && results) {
    const AreaIcon = AREA_ICONS[normalizedArea] || Brain;

    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">¡Sesión Completada!</CardTitle>
            <CardDescription>{AREA_LABELS[normalizedArea] || normalizedArea}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{results.correctCount}</p>
                  <p className="text-sm text-muted-foreground">Correctas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{results.incorrectCount}</p>
                  <p className="text-sm text-muted-foreground">Incorrectas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {Math.floor(results.totalTime / 60)}:{(results.totalTime % 60).toString().padStart(2, "0")}
                  </p>
                  <p className="text-sm text-muted-foreground">Tiempo total</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Porcentaje de acierto</span>
                <span className="text-sm font-medium">{results.percentage}%</span>
              </div>
              <Progress value={results.percentage} className="h-3" />
            </div>

            <div className="flex gap-3">
              <Button onClick={() => navigate("/app/icfes")} variant="outline" className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                Volver al inicio
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1">
                <Target className="mr-2 h-4 w-4" />
                Practicar de nuevo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const AreaIcon = AREA_ICONS[normalizedArea] || Brain;
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const currentAnswer = answers[currentIndex]?.respuesta;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate("/app/icfes")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Salir
          </Button>
          <Badge variant="outline" className="gap-2">
            <AreaIcon className="h-4 w-4" />
            {AREA_LABELS[normalizedArea] || normalizedArea}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Pregunta {currentIndex + 1} de {questions.length}
            </span>
            <span>Dificultad: {currentQuestion.dificultad}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Question Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{currentQuestion.enunciado}</CardTitle>
              {currentQuestion.competencia && (
                <Badge variant="secondary" className="text-xs">
                  {currentQuestion.competencia}
                </Badge>
              )}
            </div>
          </div>
          {currentQuestion.imagen_url && (
            <img
              src={currentQuestion.imagen_url}
              alt="Imagen de la pregunta ICFES"
              className="mt-4 max-w-full rounded-lg"
              loading="lazy"
            />
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {(
            [
              { letter: "A" as const, text: currentQuestion.opcion_a },
              { letter: "B" as const, text: currentQuestion.opcion_b },
              { letter: "C" as const, text: currentQuestion.opcion_c },
              { letter: "D" as const, text: currentQuestion.opcion_d },
            ] as const
          ).map((option) => (
            <Button
              key={option.letter}
              variant={currentAnswer === option.letter ? "default" : "outline"}
              className="w-full justify-start text-left h-auto py-4 px-4"
              onClick={() => handleAnswer(option.letter)}
            >
              <span className="font-semibold mr-3">{option.letter}.</span>
              <span className="flex-1">{option.text}</span>
              {currentAnswer === option.letter && <CheckCircle2 className="h-5 w-5 ml-2" />}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>
        <Button onClick={handleNext} disabled={!currentAnswer} className="flex-1">
          {currentIndex === questions.length - 1 ? "Finalizar" : "Siguiente"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
