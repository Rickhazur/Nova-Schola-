import { Check, Sparkles, Crown, Rocket, Star, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const plans = [
  {
    id: 'BASIC',
    name: "Nova Básico",
    priceCOP: "COP $79.000",
    period: "/ mes",
    description: "Perfecto para comenzar",
    icon: Star,
    features: [
      "5 sesiones de tutoría IA / mes",
      "Tutor Socrático básico",
      "Reportes básicos para acudientes",
      "Historial de 30 días",
    ],
    cta: "Probar Gratis",
    variant: "secondary" as const,
  },
  {
    id: 'PRO',
    name: "Nova Pro",
    priceCOP: "COP $179.000",
    period: "/ mes",
    description: "Todo para dominar cualquier materia",
    icon: Rocket,
    features: [
      "20 sesiones de tutoría IA / mes",
      "Plan de Nivelación 4 semanas",
      "Reportes WhatsApp semanales",
      "Arena + Tienda + Flashcards",
      "Sync Google Classroom",
      "Análisis de comprensión",
    ],
    cta: "Probar Pro Gratis",
    variant: "gradient" as const,
    popular: true,
  },
  {
    id: 'ELITE',
    name: "Nova Elite",
    priceCOP: "COP $349.000",
    period: "/ mes",
    description: "La experiencia completa",
    icon: Crown,
    features: [
      "Uso IA prácticamente ilimitado",
      "Todo lo de Pro incluido",
      "Múltiples planes nivelación",
      "Career Pathfinder completo",
      "Soporte prioritario 24/7",
      "Analíticas avanzadas",
    ],
    cta: "Probar Elite Gratis",
    variant: "gold" as const,
    elite: true,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          {/* Trial badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Gift className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-foreground">
              3 días de prueba GRATIS
            </span>
          </div>
          
          <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
            Precios Colombia
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Planes simples,{" "}
            <span className="text-gradient">precios justos</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tus necesidades. Todos incluyen 3 días de prueba gratis.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative p-8 rounded-2xl transition-all duration-300 ${
                  plan.popular
                    ? "bg-gradient-card border-2 border-primary/30 shadow-glow"
                    : plan.elite
                    ? "bg-gradient-card border-2 border-gold/30 shadow-glow-gold"
                    : "bg-background border border-border hover:border-primary/20"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-primary text-primary-foreground px-4 py-1.5 text-xs font-semibold">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Más popular
                    </Badge>
                  </div>
                )}
                
                {plan.elite && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-gold text-primary-foreground px-4 py-1.5 text-xs font-semibold">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-8 pt-2">
                  <div className={`w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                    plan.popular 
                      ? "bg-gradient-primary" 
                      : plan.elite 
                      ? "bg-gradient-gold" 
                      : "bg-muted"
                  }`}>
                    <Icon className={`w-7 h-7 ${
                      plan.popular || plan.elite 
                        ? "text-primary-foreground" 
                        : "text-foreground"
                    }`} />
                  </div>
                  <h3 className="font-bold text-xl text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-foreground">
                      {plan.priceCOP}
                    </span>
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10">
                    <Gift className="w-3 h-3 text-accent" />
                    <span className="text-xs text-accent font-medium">3 días gratis</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.elite ? "bg-gold/20" : "bg-primary/10"
                      }`}>
                        <Check className={`w-3 h-3 ${plan.elite ? "text-gold" : "text-primary"}`} />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/app/select-plan">
                  <Button
                    variant={plan.variant}
                    size="lg"
                    className="w-full"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Enterprise CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-3">
            ¿Eres un colegio o institución educativa?
          </p>
          <a href="#contact" className="text-primary hover:text-primary/80 font-semibold transition-colors">
            Contacta para un plan personalizado →
          </a>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
