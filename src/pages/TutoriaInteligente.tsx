import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Calculator, Atom, BookOpen, Globe, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppMode } from "@/contexts/AppModeContext";

const subjects = [
  {
    id: "math-ib",
    title: "Math Mastery IB",
    description: "Domina matemáticas para el Bachillerato Internacional",
    icon: Calculator,
    color: "primary",
    topics: ["Álgebra", "Cálculo", "Estadística", "Geometría"],
    level: "Avanzado",
  },
  {
    id: "math-ap",
    title: "Math Mastery AP",
    description: "Preparación para AP Calculus y AP Statistics",
    icon: Brain,
    color: "accent",
    topics: ["AP Calculus AB/BC", "AP Statistics", "Pre-Calculus"],
    level: "Avanzado",
  },
  {
    id: "science",
    title: "Ciencias Naturales",
    description: "Física, Química y Biología con explicaciones claras",
    icon: Atom,
    color: "gold",
    topics: ["Física", "Química", "Biología"],
    level: "Intermedio",
  },
  {
    id: "humanities",
    title: "Humanidades",
    description: "Historia, Literatura y Ciencias Sociales",
    icon: BookOpen,
    color: "primary",
    topics: ["Historia", "Literatura", "Filosofía"],
    level: "Todos los niveles",
  },
  {
    id: "languages",
    title: "Idiomas",
    description: "Inglés, Español y más idiomas",
    icon: Globe,
    color: "accent",
    topics: ["Inglés", "Español", "Francés"],
    level: "Todos los niveles",
  },
];

const TutoriaInteligente = () => {
  const { mode } = useAppMode();
  const tutorPath = mode === "kids" ? "/app/tutor-ia/primary" : "/app/tutor-ia/highschool";

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tutoría Inteligente</h1>
          <p className="text-muted-foreground mt-1">
            Selecciona una materia para comenzar tu sesión de tutoría con IA
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => {
            const colorClasses = {
              primary: "bg-primary/10 text-primary border-primary/20 hover:border-primary/50",
              accent: "bg-accent/10 text-accent border-accent/20 hover:border-accent/50",
              gold: "bg-gold/10 text-gold border-gold/20 hover:border-gold/50",
            };
            const iconBgClasses = {
              primary: "bg-primary/10",
              accent: "bg-accent/10",
              gold: "bg-gold/10",
            };
            const iconColorClasses = {
              primary: "text-primary",
              accent: "text-accent",
              gold: "text-gold",
            };

            return (
              <Card
                key={subject.id}
                className={`bg-card border transition-all duration-200 hover:shadow-lg cursor-pointer group ${colorClasses[subject.color as keyof typeof colorClasses]}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl ${iconBgClasses[subject.color as keyof typeof iconBgClasses]} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <subject.icon className={`w-6 h-6 ${iconColorClasses[subject.color as keyof typeof iconColorClasses]}`} />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {subject.level}
                    </Badge>
                  </div>
                  <CardTitle className="text-foreground mt-4">{subject.title}</CardTitle>
                  <CardDescription>{subject.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {subject.topics.map((topic) => (
                      <Badge key={topic} variant="outline" className="text-xs border-border text-muted-foreground">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                  <Button asChild className="w-full bg-gradient-primary hover:opacity-90">
                    <Link to={tutorPath}>
                      Comenzar <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default TutoriaInteligente;
