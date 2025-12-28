import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { Compass, Briefcase, GraduationCap, Lightbulb, ArrowRight, Star } from "lucide-react";

const careers = [
  {
    title: "Ingeniería de Software",
    match: 92,
    skills: ["Matemáticas", "Lógica", "Creatividad"],
    universities: ["MIT", "Stanford", "Georgia Tech"],
  },
  {
    title: "Medicina",
    match: 78,
    skills: ["Biología", "Química", "Empatía"],
    universities: ["Harvard", "Johns Hopkins", "UNAM"],
  },
  {
    title: "Arquitectura",
    match: 85,
    skills: ["Diseño", "Matemáticas", "Creatividad"],
    universities: ["MIT", "Cornell", "ITESM"],
  },
];

const CareerPathfinder = () => {
  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Career Pathfinder</h1>
          <p className="text-muted-foreground mt-1">
            Descubre tu camino profesional ideal con ayuda de la IA
          </p>
        </div>

        <FeatureGate feature="careerPathfinder" requiredPlan="ELITE">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Career Pathfinder</h1>
            <p className="text-muted-foreground mt-1">
              Descubre tu camino profesional ideal con ayuda de la IA
            </p>
          </div>

        {/* Assessment Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                  <Compass className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Evaluación de Intereses</h2>
                  <p className="text-muted-foreground">Completa tu perfil para mejores recomendaciones</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={65} className="h-2 w-32" />
                    <span className="text-sm text-muted-foreground">65% completado</span>
                  </div>
                </div>
              </div>
              <Button className="bg-gradient-primary hover:opacity-90">
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Career Recommendations */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Carreras Recomendadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {careers.map((career, idx) => (
              <Card key={idx} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground">{career.title}</CardTitle>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10">
                      <Star className="w-3 h-3 text-accent fill-accent" />
                      <span className="text-sm font-semibold text-accent">{career.match}%</span>
                    </div>
                  </div>
                  <CardDescription>Compatibilidad con tu perfil</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Habilidades clave:</p>
                      <div className="flex flex-wrap gap-1">
                        {career.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Universidades top:</p>
                      <div className="flex flex-wrap gap-1">
                        {career.universities.map((uni) => (
                          <Badge key={uni} variant="outline" className="text-xs border-primary/30 text-primary">
                            {uni}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" className="w-full border-border hover:border-primary/50">
                      Explorar carrera
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Skills Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-gold" />
              </div>
              <div>
                <CardTitle className="text-foreground">Desarrolla tus Habilidades</CardTitle>
                <CardDescription>Cursos recomendados basados en tus metas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Pensamiento Computacional</span>
                </div>
                <p className="text-sm text-muted-foreground">Desarrolla lógica y resolución de problemas</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <GraduationCap className="w-5 h-5 text-accent" />
                  <span className="font-medium text-foreground">Comunicación Efectiva</span>
                </div>
                <p className="text-sm text-muted-foreground">Mejora tus habilidades de presentación</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </FeatureGate>
      </div>
    </AppLayout>
  );
};

export default CareerPathfinder;
