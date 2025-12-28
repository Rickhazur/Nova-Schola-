import { Check, Sparkles, Crown, Rocket, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";

const plans = [
  {
    id: 'BASIC',
    name: "Nova Básico",
    price: "$19",
    period: "por mes",
    description: "Perfecto para comenzar tu viaje de aprendizaje",
    icon: Star,
    features: [
      "5 sesiones de tutoría al mes",
      "Tutor Socrático IA",
      "Reportes básicos de progreso",
      "Historial de 30 días",
      "Soporte por email",
    ],
    notIncluded: [
      "Plan de Nivelación automático",
      "Sincronización con Classroom",
      "Reportes semanales WhatsApp",
      "Acceso a Arena y Tienda",
      "Career Pathfinder",
    ],
    cta: "Comenzar con Básico",
    variant: "secondary" as const,
  },
  {
    id: 'PRO',
    name: "Nova Pro",
    price: "$49",
    period: "por mes",
    description: "Todo lo que necesitas para dominar cualquier materia",
    icon: Rocket,
    features: [
      "20 sesiones de tutoría al mes",
      "Tutor Socrático IA avanzado",
      "Plan de Nivelación (4 semanas)",
      "Sincronización con Google Classroom",
      "Reportes semanales para WhatsApp",
      "Acceso completo a Arena",
      "Tienda Nova con recompensas",
      "Historial completo ilimitado",
      "Análisis de comprensión detallado",
    ],
    notIncluded: [
      "Career Pathfinder",
      "Soporte prioritario",
      "Analíticas avanzadas de admin",
    ],
    cta: "Elegir Pro",
    variant: "gradient" as const,
    popular: true,
  },
  {
    id: 'ELITE',
    name: "Nova Elite",
    price: "$99",
    period: "por mes",
    description: "La experiencia educativa más completa",
    icon: Crown,
    features: [
      "Sesiones prácticamente ilimitadas",
      "Todo lo incluido en Pro",
      "Career Pathfinder personalizado",
      "Soporte prioritario 24/7",
      "Panel de admin avanzado",
      "Analíticas predictivas",
      "Planes de estudio personalizados",
      "Acceso anticipado a nuevas funciones",
      "Sesiones de coaching 1-a-1 mensuales",
    ],
    notIncluded: [],
    cta: "Ir Elite",
    variant: "gold" as const,
  },
];

const SubscriptionPricing = () => {
  return (
    <Layout>
      <section className="py-20 min-h-screen bg-gradient-dark">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-3 h-3 mr-1" />
              Planes de Suscripción
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Elige tu plan{" "}
              <span className="text-gradient">Nova Schola</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Invierte en el futuro educativo. Cada plan está diseñado para 
              maximizar el aprendizaje y la comprensión.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className={`relative p-8 rounded-2xl transition-all duration-300 ${
                    plan.popular
                      ? "bg-gradient-card border-2 border-primary/30 shadow-glow scale-105"
                      : plan.variant === "gold"
                      ? "bg-gradient-card border-2 border-gold/30 shadow-glow-gold"
                      : "bg-card border border-border hover:border-primary/20"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-primary text-primary-foreground px-4 py-1.5">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Más popular
                      </Badge>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <div className={`w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                      plan.variant === "gold" 
                        ? "bg-gradient-gold" 
                        : plan.popular 
                        ? "bg-gradient-primary" 
                        : "bg-muted"
                    }`}>
                      <Icon className={`w-7 h-7 ${
                        plan.variant === "gold" || plan.popular 
                          ? "text-primary-foreground" 
                          : "text-foreground"
                      }`} />
                    </div>
                    <h3 className="font-bold text-xl text-foreground mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground ml-2">{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          plan.variant === "gold" 
                            ? "bg-gold/20" 
                            : "bg-primary/10"
                        }`}>
                          <Check className={`w-3 h-3 ${
                            plan.variant === "gold" ? "text-gold" : "text-primary"
                          }`} />
                        </div>
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.notIncluded.length > 0 && (
                    <ul className="space-y-2 mb-6 opacity-50">
                      {plan.notIncluded.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <div className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground line-through">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    asChild
                    size="lg"
                    className={`w-full ${
                      plan.variant === "gold"
                        ? "bg-gradient-gold hover:opacity-90 text-primary-foreground"
                        : plan.popular
                        ? "bg-gradient-primary hover:opacity-90"
                        : ""
                    }`}
                    variant={plan.variant === "gold" || plan.popular ? "default" : "secondary"}
                  >
                    <Link to="/auth">
                      {plan.cta}
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>

          {/* FAQ / Bottom CTA */}
          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-3">
              ¿Tienes preguntas? ¿Necesitas un plan personalizado para tu institución?
            </p>
            <Link to="/pricing" className="text-primary hover:text-primary/80 font-semibold transition-colors">
              Contacta con nosotros →
            </Link>
          </div>

          {/* Guarantee */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="p-6 rounded-2xl bg-gradient-card border border-border text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Garantía de 7 días
              </h3>
              <p className="text-sm text-muted-foreground">
                Si no estás satisfecho con Nova Schola, te devolvemos el 100% de tu dinero 
                en los primeros 7 días. Sin preguntas.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SubscriptionPricing;
