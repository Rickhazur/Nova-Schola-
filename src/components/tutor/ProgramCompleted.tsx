import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PartyPopper, Award, ArrowRight, Sparkles } from "lucide-react";

interface ProgramCompletedProps {
  programTitle: string;
  variant: "primary" | "highschool";
  onContinue: () => void;
}

export function ProgramCompleted({ programTitle, variant, onContinue }: ProgramCompletedProps) {
  const isPrimary = variant === "primary";

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isPrimary 
        ? "bg-gradient-to-b from-amber-50 to-orange-50" 
        : "bg-background"
    }`}>
      <Card className={`max-w-lg w-full text-center ${
        isPrimary ? "bg-white border-amber-200" : "bg-card border-border"
      }`}>
        <CardHeader>
          <div className="mx-auto mb-4">
            <div className={`relative w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
              isPrimary 
                ? "bg-gradient-to-br from-amber-400 to-orange-500" 
                : "bg-gradient-primary"
            }`}>
              <PartyPopper className="w-12 h-12 text-white" />
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </div>
          <CardTitle className={`text-2xl ${isPrimary ? "text-amber-900" : "text-foreground"}`}>
            {isPrimary ? "¡Felicitaciones! 🎉🏆" : "¡Programa Completado!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge className={`text-sm ${
            isPrimary 
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" 
              : "bg-primary"
          }`}>
            <Award className="w-4 h-4 mr-1" />
            {programTitle}
          </Badge>

          <p className={`text-lg ${isPrimary ? "text-amber-700" : "text-muted-foreground"}`}>
            {isPrimary 
              ? "¡Has completado todas las semanas de tu programa de refuerzo! Eres increíble. 🌟"
              : "Has completado exitosamente todas las semanas de tu programa de refuerzo."
            }
          </p>

          <div className={`p-4 rounded-lg ${isPrimary ? "bg-amber-50" : "bg-secondary"}`}>
            <p className={`text-sm ${isPrimary ? "text-amber-800" : "text-foreground"}`}>
              {isPrimary 
                ? "Ahora puedes usar el tutor para practicar cualquier tema que quieras. ¡Sigue aprendiendo!"
                : "El tutor ahora funcionará en modo general. Puedes explorar cualquier tema."
              }
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button 
              onClick={onContinue}
              className={`w-full ${
                isPrimary 
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white" 
                  : ""
              }`}
              size="lg"
            >
              {isPrimary ? "¡Continuar aprendiendo! 🚀" : "Continuar con el Tutor"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Link to="/app/dashboard" className="block">
              <Button variant="ghost" className="w-full">
                Ir al Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
