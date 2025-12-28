import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  Clock,
  CreditCard,
  MessageSquare,
  Star,
  Rocket,
  Crown,
  Smartphone,
  Building2,
  CheckCircle,
  Copy,
  ExternalLink,
  Gift,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    id: 'BASIC',
    name: "Nova Básico",
    priceCOP: "COP $79.000",
    icon: Star,
  },
  {
    id: 'PRO',
    name: "Nova Pro",
    priceCOP: "COP $179.000",
    icon: Rocket,
    recommended: true,
  },
  {
    id: 'ELITE',
    name: "Nova Elite",
    priceCOP: "COP $349.000",
    icon: Crown,
  },
];

const WHATSAPP_NUMBER = "573166267836";
const NEQUI_NUMBER = "316 6267836";
const BANCOLOMBIA_ACCOUNT = "63452446199";
const ACCOUNT_HOLDER = "Ricardo Torres";
const CEDULA = "79241822";

const TrialEnded = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [showInstructions, setShowInstructions] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const studentName = profile?.full_name || "Estudiante";
  const selectedPlanId = profile?.plan || "PRO";
  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[1];

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copiado",
      description: `${field} copiado al portapapeles`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openWhatsApp = () => {
    const message = `Hola Nova Schola, adjunto el comprobante de pago para la suscripción de ${studentName} al plan ${selectedPlan.name} (${selectedPlan.priceCOP}/mes).`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
  };

  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        {/* Header */}
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-primary">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Nova Schola</span>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Button
            variant="ghost"
            onClick={() => setShowInstructions(false)}
            className="mb-6"
          >
            ← Volver
          </Button>

          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary mx-auto mb-4 flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Instrucciones de Pago</CardTitle>
              <CardDescription>
                Realiza el pago por Nequi o Bancolombia y envía el comprobante
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan selected */}
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <selectedPlan.icon className="w-6 h-6 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{selectedPlan.name}</p>
                      <p className="text-sm text-muted-foreground">Plan seleccionado</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-1">
                    {selectedPlan.priceCOP}/mes
                  </Badge>
                </div>
              </div>

              {/* Nequi */}
              <div className="p-5 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#E6007A]/10 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-[#E6007A]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Nequi</h3>
                    <p className="text-sm text-muted-foreground">Pago móvil instantáneo</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-xs text-muted-foreground">Número Nequi</p>
                      <p className="font-mono font-semibold text-foreground">{NEQUI_NUMBER}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("3166267836", "Número Nequi")}
                    >
                      {copiedField === "Número Nequi" ? (
                        <CheckCircle className="w-4 h-4 text-accent" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-xs text-muted-foreground">Titular</p>
                      <p className="font-semibold text-foreground">{ACCOUNT_HOLDER}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(ACCOUNT_HOLDER, "Titular")}
                    >
                      {copiedField === "Titular" ? (
                        <CheckCircle className="w-4 h-4 text-accent" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bancolombia */}
              <div className="p-5 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#FDDA24]/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#FDDA24]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Bancolombia</h3>
                    <p className="text-sm text-muted-foreground">Cuenta de Ahorros</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-xs text-muted-foreground">Número de cuenta</p>
                      <p className="font-mono font-semibold text-foreground">{BANCOLOMBIA_ACCOUNT}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(BANCOLOMBIA_ACCOUNT, "Cuenta")}
                    >
                      {copiedField === "Cuenta" ? (
                        <CheckCircle className="w-4 h-4 text-accent" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-xs text-muted-foreground">Titular</p>
                      <p className="font-semibold text-foreground">{ACCOUNT_HOLDER}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(ACCOUNT_HOLDER, "Titular Banco")}
                    >
                      {copiedField === "Titular Banco" ? (
                        <CheckCircle className="w-4 h-4 text-accent" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-xs text-muted-foreground">Cédula</p>
                      <p className="font-mono font-semibold text-foreground">{CEDULA}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(CEDULA, "Cédula")}
                    >
                      {copiedField === "Cédula" ? (
                        <CheckCircle className="w-4 h-4 text-accent" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* WhatsApp button */}
              <Button
                onClick={openWhatsApp}
                size="lg"
                className="w-full h-14 bg-[#25D366] hover:bg-[#25D366]/90 text-white"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Enviar comprobante por WhatsApp
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Una vez recibido el comprobante, activaremos tu suscripción en menos de 24 horas.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-primary">
          <BookOpen className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">Nova Schola</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <Card className="bg-card border-border overflow-hidden">
            {/* Header section */}
            <div className="bg-gradient-to-br from-primary/20 via-transparent to-accent/10 p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 mx-auto mb-6 flex items-center justify-center">
                <Clock className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-3">
                Tu prueba gratuita ha terminado
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Para seguir usando tu plan de nivelación y tu Tutor IA, tu acudiente debe activar tu suscripción.
              </p>
            </div>

            <CardContent className="p-8 space-y-6">
              {/* Plans */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Planes disponibles en Colombia:
                </h2>
                <div className="space-y-3">
                  {plans.map((plan) => {
                    const Icon = plan.icon;
                    return (
                      <div
                        key={plan.id}
                        className={`p-4 rounded-xl border transition-all ${
                          plan.recommended
                            ? "bg-primary/5 border-primary/30"
                            : "bg-muted/30 border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              plan.recommended ? "bg-gradient-primary" : "bg-muted"
                            }`}>
                              <Icon className={`w-5 h-5 ${
                                plan.recommended ? "text-primary-foreground" : "text-foreground"
                              }`} />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{plan.name}</p>
                              {plan.recommended && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  Recomendado
                                </Badge>
                              )}
                            </div>
                          </div>
                          <span className="text-lg font-bold text-foreground">
                            {plan.priceCOP}
                            <span className="text-sm text-muted-foreground font-normal">/mes</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={() => setShowInstructions(true)}
                  size="lg"
                  className="w-full h-14 bg-gradient-primary hover:opacity-90"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Ver instrucciones de pago
                </Button>
                <Button
                  onClick={() => {
                    toast({
                      title: "¡Gracias!",
                      description: "Tu activación será procesada en menos de 24 horas.",
                    });
                    navigate("/app/dashboard");
                  }}
                  variant="outline"
                  size="lg"
                  className="w-full h-14 border-border"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Ya realicé el pago
                </Button>
              </div>

              <p className="text-sm text-muted-foreground text-center pt-2">
                ¿Tienes preguntas? Escríbenos por{" "}
                <button
                  onClick={openWhatsApp}
                  className="text-primary hover:underline"
                >
                  WhatsApp
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrialEnded;
