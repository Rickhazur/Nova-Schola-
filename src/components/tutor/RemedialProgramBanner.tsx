import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  Target, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Sparkles,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProgramWeek {
  week_number: number;
  topic: string;
  objectives: string | null;
  status: string;
}

interface RemedialProgram {
  id: string;
  custom_title: string | null;
  subject: string | null;
  current_week: number | null;
  remedial_programs?: {
    name: string;
    subject: string;
  } | null;
}

interface HomeworkTask {
  id: string;
  description: string;
  due_date: string | null;
  status: string;
}

interface RemedialProgramBannerProps {
  program: RemedialProgram;
  currentWeek: ProgramWeek | null;
  variant: "primary" | "highschool";
  onEndSession?: () => void;
  newHomework?: HomeworkTask | null;
}

export function RemedialProgramBanner({ 
  program, 
  currentWeek, 
  variant,
  onEndSession,
  newHomework
}: RemedialProgramBannerProps) {
  const isPrimary = variant === "primary";
  const [showHomeworkDialog, setShowHomeworkDialog] = useState(!!newHomework);

  const programTitle = program.custom_title || program.remedial_programs?.name || 'Programa de Refuerzo';
  const subject = program.subject || program.remedial_programs?.subject || 'General';

  return (
    <>
      <div className={`mb-4 p-3 rounded-lg border ${
        isPrimary 
          ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200" 
          : "bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20"
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isPrimary ? "bg-amber-100" : "bg-primary/10"
            }`}>
              <BookOpen className={`w-5 h-5 ${isPrimary ? "text-amber-600" : "text-primary"}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-medium text-sm ${isPrimary ? "text-amber-900" : "text-foreground"}`}>
                  {programTitle}
                </span>
                <Badge variant="outline" className="text-xs">
                  {subject}
                </Badge>
              </div>
              {currentWeek && (
                <p className={`text-xs ${isPrimary ? "text-amber-600" : "text-muted-foreground"}`}>
                  Semana {currentWeek.week_number}: {currentWeek.topic}
                </p>
              )}
            </div>
          </div>

          {currentWeek && (
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                currentWeek.status === 'completed' 
                  ? "bg-green-100 text-green-700" 
                  : currentWeek.status === 'in_progress'
                    ? "bg-amber-100 text-amber-700"
                    : "bg-muted text-muted-foreground"
              }`}>
                {currentWeek.status === 'completed' ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                <span>
                  {currentWeek.status === 'completed' 
                    ? 'Completada' 
                    : currentWeek.status === 'in_progress'
                      ? 'En progreso'
                      : 'Pendiente'
                  }
                </span>
              </div>
              
              {onEndSession && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onEndSession}
                  className={isPrimary ? "border-amber-300 text-amber-700 hover:bg-amber-50" : ""}
                >
                  Terminar sesión
                </Button>
              )}
            </div>
          )}
        </div>

        {currentWeek?.objectives && (
          <div className={`mt-2 pt-2 border-t ${isPrimary ? "border-amber-200" : "border-border"}`}>
            <div className="flex items-start gap-2">
              <Target className={`w-4 h-4 mt-0.5 ${isPrimary ? "text-amber-500" : "text-primary"}`} />
              <p className={`text-xs ${isPrimary ? "text-amber-700" : "text-muted-foreground"}`}>
                <span className="font-medium">Objetivos: </span>
                {currentWeek.objectives}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Homework Assigned Dialog */}
      <Dialog open={showHomeworkDialog} onOpenChange={setShowHomeworkDialog}>
        <DialogContent className={`sm:max-w-lg ${isPrimary ? "bg-amber-50" : ""}`}>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${isPrimary ? "text-amber-900" : ""}`}>
              <Sparkles className={`w-5 h-5 ${isPrimary ? "text-amber-500" : "text-primary"}`} />
              {isPrimary ? "¡Tarea asignada! 📝" : "Tarea Asignada"}
            </DialogTitle>
            <DialogDescription className={isPrimary ? "text-amber-700" : ""}>
              {isPrimary 
                ? "¡Excelente sesión! Aquí está tu tarea para practicar lo que aprendimos."
                : "Se ha asignado una tarea basada en la sesión de hoy."
              }
            </DialogDescription>
          </DialogHeader>

          {newHomework && (
            <div className={`p-4 rounded-lg ${isPrimary ? "bg-white border border-amber-200" : "bg-secondary"}`}>
              <p className={`text-sm whitespace-pre-wrap ${isPrimary ? "text-amber-800" : "text-foreground"}`}>
                {newHomework.description}
              </p>
              {newHomework.due_date && (
                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Fecha límite: {new Date(newHomework.due_date).toLocaleDateString('es-CO')}</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowHomeworkDialog(false)}>
              Entendido
            </Button>
            <Link to="/app/repositorio">
              <Button className={isPrimary 
                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" 
                : ""
              }>
                Ir al Repositorio
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
