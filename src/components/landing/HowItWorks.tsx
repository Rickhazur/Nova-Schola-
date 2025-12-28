import { Search, Route, Brain, Trophy } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Diagnóstico inteligente",
    description: "El tutor evalúa tus conocimientos actuales y detecta áreas de mejora con precisión.",
    color: "primary",
  },
  {
    number: "02",
    icon: Route,
    title: "Plan de ruta personalizado",
    description: "Recibe un plan de estudios adaptado a tu nivel, objetivos y ritmo de aprendizaje.",
    color: "accent",
  },
  {
    number: "03",
    icon: Brain,
    title: "Tutor IA Socrático",
    description: "Aprende con preguntas guiadas que te hacen pensar y descubrir las respuestas por ti mismo.",
    color: "primary",
  },
  {
    number: "04",
    icon: Trophy,
    title: "Seguimiento y recompensas",
    description: "Monitorea tu progreso y gana Nova Coins por cada logro. La motivación que impulsa el éxito.",
    color: "gold",
  },
];

const HowItWorks = () => {
  return (
    <section id="platform" className="py-24 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
            Cómo Funciona
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            4 pasos hacia el{" "}
            <span className="text-gradient">dominio total</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Un proceso simple pero poderoso para transformar tu aprendizaje.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative group"
              >
                <div className="flex gap-5 p-6 rounded-2xl bg-background border border-border hover:border-primary/30 transition-all duration-300">
                  {/* Number & Icon */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <span className="absolute -top-2 -left-2 text-5xl font-bold text-muted/20">
                        {step.number}
                      </span>
                      <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center ${
                        step.color === 'gold' 
                          ? 'bg-gold/10 text-gold' 
                          : step.color === 'accent'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        <step.icon className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Connector Line (hidden on last item and mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-full left-1/2 w-px h-6 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
