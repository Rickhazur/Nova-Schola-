import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { AlertTriangle, Upload, BookOpen, CheckCircle2, Clock } from "lucide-react";

interface PendingHomework {
  id: string;
  description: string;
  due_date: string | null;
  status: string;
  last_score: number | null;
  feedback: string | null;
}

interface CurrentWeek {
  week_number: number;
  topic: string;
  objectives: string | null;
}

interface RemedialBlockerProps {
  reason: string;
  pendingHomework: PendingHomework | null;
  currentWeek: CurrentWeek | null;
  variant: "primary" | "highschool";
}

export function RemedialBlocker({ reason, pendingHomework, currentWeek, variant }: RemedialBlockerProps) {
  const isPrimary = variant === "primary";

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isPrimary 
        ? "bg-gradient-to-b from-amber-50 to-orange-50" 
        : "bg-background"
    }`}>
      <Card className={`max-w-lg w-full ${
        isPrimary ? "bg-white border-amber-200" : "bg-card border-border"
      }`}>
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            pendingHomework?.status === 'redo_required' 
              ? "bg-orange-100" 
              : "bg-amber-100"
          }`}>
            {pendingHomework?.status === 'redo_required' ? (
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            ) : (
              <Upload className="w-8 h-8 text-amber-500" />
            )}
          </div>
          <CardTitle className={`text-xl ${isPrimary ? "text-amber-900" : "text-foreground"}`}>
            {pendingHomework?.status === 'redo_required' 
              ? (isPrimary ? "¡Tu tarea necesita mejoras! 📝" : "Tarea Requiere Correcciones")
              : (isPrimary ? "¡Primero tu tarea! 📚" : "Tarea Pendiente")
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentWeek && (
            <div className={`p-3 rounded-lg ${isPrimary ? "bg-amber-50" : "bg-secondary"}`}>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className={`w-4 h-4 ${isPrimary ? "text-amber-600" : "text-primary"}`} />
                <span className={`font-medium text-sm ${isPrimary ? "text-amber-800" : "text-foreground"}`}>
                  Semana {currentWeek.week_number}: {currentWeek.topic}
                </span>
              </div>
            </div>
          )}

          <p className={`text-center ${isPrimary ? "text-amber-700" : "text-muted-foreground"}`}>
            {reason}
          </p>

          {pendingHomework && (
            <div className={`p-4 rounded-lg border ${
              isPrimary ? "bg-white border-amber-200" : "bg-card border-border"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${isPrimary ? "text-amber-900" : "text-foreground"}`}>
                  Tu tarea:
                </span>
                {pendingHomework.status === 'redo_required' && pendingHomework.last_score !== null && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    Puntaje: {pendingHomework.last_score}/100
                  </Badge>
                )}
              </div>
              
              <p className={`text-sm mb-3 ${isPrimary ? "text-amber-800" : "text-muted-foreground"}`}>
                {pendingHomework.description.length > 200 
                  ? pendingHomework.description.substring(0, 200) + '...' 
                  : pendingHomework.description
                }
              </p>

              {pendingHomework.feedback && pendingHomework.status === 'redo_required' && (
                <div className={`p-3 rounded-lg mb-3 ${
                  isPrimary ? "bg-orange-50 border border-orange-200" : "bg-orange-500/10 border border-orange-500/20"
                }`}>
                  <p className={`text-sm font-medium mb-1 ${isPrimary ? "text-orange-800" : "text-orange-400"}`}>
                    {isPrimary ? "💡 Consejos de tu tutor:" : "Retroalimentación:"}
                  </p>
                  <p className={`text-sm ${isPrimary ? "text-orange-700" : "text-orange-300"}`}>
                    {pendingHomework.feedback.length > 300 
                      ? pendingHomework.feedback.substring(0, 300) + '...' 
                      : pendingHomework.feedback
                    }
                  </p>
                </div>
              )}

              {pendingHomework.due_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Fecha límite: {new Date(pendingHomework.due_date).toLocaleDateString('es-CO')}</span>
                </div>
              )}
            </div>
          )}

          <Link to="/app/repositorio" className="block">
            <Button 
              className={`w-full ${
                isPrimary 
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white" 
                  : "bg-primary hover:bg-primary/90"
              }`}
              size="lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              {isPrimary ? "¡Subir mi tarea! 📸" : "Ir al Repositorio"}
            </Button>
          </Link>

          <Link to="/app/dashboard" className="block">
            <Button variant="ghost" className="w-full">
              Volver al Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
