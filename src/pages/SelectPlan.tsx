import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Check, 
  Sparkles, 
  Crown, 
  Rocket, 
  Star,
  Bot,
  BarChart3,
  MessageSquare,
  Gamepad2,
  ShoppingBag,
  Compass,
  Headphones,
  Calendar,
  FileText,
  Loader2,
  BookOpen,
  Gift,
  Zap
} from "lucide-react";

type PlanType = 'BASIC' | 'PRO' | 'ELITE';

interface PlanFeature {
  icon: React.ElementType;
  text: string;
  included: boolean;
}

interface Plan {
  id: PlanType;
  name: string;
  priceCOP: number;
  priceFormatted: string;
  period: string;
  description: string;
  icon: React.ElementType;
  features: PlanFeature[];
  cta: string;
  popular?: boolean;
  elite?: boolean;
  tokenAllowance: number;
  trialTokens: number;
}

const plans: Plan[] = [
  {
    id: 'BASIC',
    name: "Nova Básico",
    priceCOP: 79000,
    priceFormatted: "COP $79.000",
    period: "/ mes",
    description: "Perfecto para comenzar tu viaje de aprendizaje",
    icon: Star,
    tokenAllowance: 50,
    trialTokens: 10,
    features: [
      { icon: Bot, text: "5 sesiones de tutoría IA / mes", included: true },
      { icon: MessageSquare, text: "Tutor Socrático básico", included: true },
      { icon: FileText, text: "Reportes básicos para acudientes", included: true },
      { icon: Calendar, text: "Historial de 30 días", included: true },
      { icon: BarChart3, text: "Plan de Nivelación", included: false },
      { icon: MessageSquare, text: "Reportes WhatsApp semanales", included: false },
      { icon: Gamepad2, text: "Acceso a Arena", included: false },
      { icon: ShoppingBag, text: "Tienda Nova", included: false },
      { icon: Compass, text: "Career Pathfinder", included: false },
    ],
    cta: "Probar Gratis",
  },
  {
    id: 'PRO',
    name: "Nova Pro",
    priceCOP: 179000,
    priceFormatted: "COP $179.000",
    period: "/ mes",
    description: "Todo lo que necesitas para dominar cualquier materia",
    icon: Rocket,
    tokenAllowance: 200,
    trialTokens: 10,
    popular: true,
    features: [
      { icon: Bot, text: "20 sesiones de tutoría IA / mes", included: true },
      { icon: BarChart3, text: "Plan de Nivelación 4 semanas (Matemáticas)", included: true },
      { icon: MessageSquare, text: "Reportes semanales para acudientes", included: true },
      { icon: Calendar, text: "Sync con Google Classroom", included: true },
      { icon: MessageSquare, text: "Resúmenes WhatsApp semanales", included: true },
      { icon: Gamepad2, text: "Acceso completo a Arena", included: true },
      { icon: ShoppingBag, text: "Tienda Nova + Flashcards + Repositorio", included: true },
      { icon: FileText, text: "Análisis de comprensión", included: true },
      { icon: Compass, text: "Career Pathfinder", included: false },
      { icon: Headphones, text: "Soporte prioritario", included: false },
    ],
    cta: "Probar Pro Gratis",
  },
  {
    id: 'ELITE',
    name: "Nova Elite",
    priceCOP: 349000,
    priceFormatted: "COP $349.000",
    period: "/ mes",
    description: "La experiencia educativa más completa y personalizada",
    icon: Crown,
    tokenAllowance: 1000,
    trialTokens: 10,
    elite: true,
    features: [
      { icon: Bot, text: "Uso IA prácticamente ilimitado", included: true },
      { icon: MessageSquare, text: "Todo lo incluido en Pro", included: true },
      { icon: BarChart3, text: "Múltiples planes nivelación (Mate + Física)", included: true },
      { icon: Compass, text: "Career Pathfinder completo", included: true },
      { icon: Headphones, text: "Soporte prioritario 24/7", included: true },
      { icon: BarChart3, text: "Analíticas avanzadas para admin", included: true },
      { icon: Calendar, text: "Planes de estudio personalizados", included: true },
      { icon: Sparkles, text: "Acceso anticipado a funciones", included: true },
      { icon: MessageSquare, text: "Coaching 1-a-1 mensual", included: true },
    ],
    cta: "Probar Elite Gratis",
  },
];

const SelectPlan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refetchProfile } = useAuth();
  const [selecting, setSelecting] = useState<PlanType | null>(null);

  const handleSelectPlan = async (plan: Plan) => {
    // If user is not logged in, save plan choice and redirect to signup
    if (!user) {
      // Store selected plan in localStorage for after signup
      localStorage.setItem('selectedPlan', JSON.stringify({
        id: plan.id,
        tokenAllowance: plan.tokenAllowance,
        trialTokens: plan.trialTokens,
        priceCOP: plan.priceCOP,
      }));
      
      toast({
        title: `Plan ${plan.name} seleccionado`,
        description: "Crea tu cuenta para comenzar tu prueba gratis de 3 días",
      });
      
      navigate("/auth?signup=true");
      return;
    }

    // User is logged in - update their plan directly
    setSelecting(plan.id);

    try {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 3);

      const { error } = await supabase
        .from('student_profiles')
        .update({
          plan: plan.id,
          token_allowance: plan.trialTokens, // During trial, use daily limit
          tokens_used_this_month: 0,
          token_reset_date: new Date().toISOString().split('T')[0],
          is_trial_active: true,
          trial_ends_at: trialEndsAt.toISOString(),
          is_paid: false,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "¡Prueba gratuita activada!",
        description: `Tienes 3 días para probar el plan ${plan.name}.`,
      });

      refetchProfile();
      navigate("/app/onboarding");
    } catch (err) {
      console.error('Error selecting plan:', err);
      toast({
        title: "Error",
        description: "No se pudo seleccionar el plan. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSelecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="p-2 rounded-xl bg-gradient-primary">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Nova Schola</span>
        </div>
        
        {!user && (
          <Button 
            variant="outline" 
            onClick={() => navigate("/auth")}
            className="border-border"
          >
            Ya tengo cuenta
          </Button>
        )}
      </div>

      {/* Glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-24">
        {/* Title */}
        <div className="text-center mb-12">
          {/* Trial badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30 mb-6">
            <Gift className="w-5 h-5 text-accent" />
            <span className="text-base font-semibold text-foreground">
              3 días de prueba GRATIS en cualquier plan
            </span>
            <Zap className="w-5 h-5 text-gold" />
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Elige tu plan{" "}
            <span className="text-gradient">Nova Schola</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comienza hoy con acceso completo. Sin tarjeta de crédito.
            Precios en pesos colombianos (COP).
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelecting = selecting === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`relative p-8 rounded-2xl transition-all duration-500 transform hover:scale-[1.02] ${
                  plan.popular
                    ? "bg-gradient-to-b from-card via-card to-primary/5 border-2 border-primary/40 shadow-glow"
                    : plan.elite
                    ? "bg-gradient-to-b from-card via-card to-gold/5 border-2 border-gold/40 shadow-glow-gold"
                    : "bg-card border border-border hover:border-primary/30"
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-primary text-primary-foreground px-5 py-1.5 text-sm shadow-glow">
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      Más popular
                    </Badge>
                  </div>
                )}

                {/* Elite badge */}
                {plan.elite && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-gold text-primary-foreground px-5 py-1.5 text-sm shadow-glow-gold">
                      <Crown className="w-4 h-4 mr-1.5" />
                      Premium
                    </Badge>
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-6 pt-2">
                  <div className={`w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-lg ${
                    plan.elite 
                      ? "bg-gradient-gold shadow-glow-gold" 
                      : plan.popular 
                      ? "bg-gradient-primary shadow-glow" 
                      : "bg-muted"
                  }`}>
                    <Icon className={`w-8 h-8 ${
                      plan.elite || plan.popular 
                        ? "text-primary-foreground" 
                        : "text-foreground"
                    }`} />
                  </div>
                  <h3 className="font-bold text-2xl text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-2">
                    <span className="text-3xl md:text-4xl font-bold text-foreground">
                      {plan.priceFormatted}
                    </span>
                    <span className="text-muted-foreground ml-2 text-lg">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                  
                  {/* Trial info */}
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                    <Gift className="w-4 h-4 text-accent" />
                    <span className="text-xs font-medium text-accent">
                      3 días gratis • 10 mensajes/día
                    </span>
                  </div>
                </div>

                {/* Features list */}
                <ul className="space-y-3 mb-8">
                  {plan.features.slice(0, 6).map((feature, idx) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <li 
                        key={idx} 
                        className={`flex items-center gap-3 ${
                          feature.included ? '' : 'opacity-40'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          feature.included
                            ? plan.elite 
                              ? "bg-gold/20" 
                              : "bg-primary/10"
                            : "bg-muted/50"
                        }`}>
                          {feature.included ? (
                            <FeatureIcon className={`w-4 h-4 ${
                              plan.elite ? "text-gold" : "text-primary"
                            }`} />
                          ) : (
                            <FeatureIcon className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className={`text-sm ${
                          feature.included 
                            ? "text-foreground" 
                            : "text-muted-foreground line-through"
                        }`}>
                          {feature.text}
                        </span>
                      </li>
                    );
                  })}
                  {plan.features.length > 6 && (
                    <li className="text-xs text-muted-foreground text-center pt-2">
                      +{plan.features.length - 6} funciones más...
                    </li>
                  )}
                </ul>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={selecting !== null}
                  size="lg"
                  className={`w-full h-14 text-base font-semibold transition-all ${
                    plan.elite
                      ? "bg-gradient-gold hover:opacity-90 text-primary-foreground shadow-glow-gold"
                      : plan.popular
                      ? "bg-gradient-primary hover:opacity-90 shadow-glow"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  {isSelecting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Gift className="w-5 h-5 mr-2" />
                      {plan.cta}
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Guarantee */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="p-6 rounded-2xl bg-card/50 backdrop-blur border border-border text-center">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-accent" />
                <span className="text-sm text-foreground">Sin tarjeta de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-accent" />
                <span className="text-sm text-foreground">Cancela cuando quieras</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-accent" />
                <span className="text-sm text-foreground">Pago manual en Colombia</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectPlan;
