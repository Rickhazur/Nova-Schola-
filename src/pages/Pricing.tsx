import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  GraduationCap,
  Check,
  Users,
  School,
  Sparkles,
  Camera,
  Mic,
  FileText,
  Mail,
  Building,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: PlanFeature[];
  cta: string;
  ctaAction: "student" | "advisor" | "demo";
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    id: "student",
    name: "Plan Estudiante",
    description: "Para estudiantes individuales y familias con un solo hijo.",
    icon: <GraduationCap className="w-8 h-8" />,
    features: [
      { text: "Acceso al Tutor Socrático (Primaria o Secundaria)", included: true },
      { text: "Ayuda con fotos de tareas", included: true },
      { text: "Pizarra interactiva", included: true },
      { text: "Conversación por voz", included: true },
      { text: "Reporte mensual básico para padres", included: true },
    ],
    cta: "Comenzar como estudiante",
    ctaAction: "student",
  },
  {
    id: "family",
    name: "Plan Familia Plus",
    description: "Para familias con varios hijos que quieren aprender juntos.",
    icon: <Users className="w-8 h-8" />,
    features: [
      { text: "Todo lo del Plan Estudiante", included: true },
      { text: "Hasta 3 perfiles de estudiante", included: true },
      { text: "Reporte semanal por correo", included: true },
      { text: "Dashboard familiar unificado", included: true },
      { text: "Soporte por chat prioritario", included: true },
    ],
    cta: "Hablar con un asesor",
    ctaAction: "advisor",
    highlighted: true,
  },
  {
    id: "school",
    name: "Plan Colegios",
    description: "Para instituciones educativas que buscan innovar.",
    icon: <School className="w-8 h-8" />,
    features: [
      { text: "Panel admin para coordinadores", included: true },
      { text: "Múltiples estudiantes ilimitados", included: true },
      { text: "Reportes de cohortes y analytics", included: true },
      { text: "Integración con sistemas escolares", included: true },
      { text: "Soporte prioritario dedicado", included: true },
    ],
    cta: "Agendar demo",
    ctaAction: "demo",
  },
];

const Pricing = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"student" | "advisor" | "demo">("student");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    school: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const openDialog = (type: "student" | "advisor" | "demo") => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "¡Formulario enviado!",
      description: "Nos pondremos en contacto contigo pronto.",
    });

    setFormData({ name: "", email: "", phone: "", school: "", message: "" });
    setDialogOpen(false);
    setSubmitting(false);
  };

  const getDialogContent = () => {
    switch (dialogType) {
      case "student":
        return {
          title: "Comenzar como Estudiante",
          description: "Déjanos tus datos y te enviaremos instrucciones para empezar.",
          showSchool: false,
        };
      case "advisor":
        return {
          title: "Hablar con un Asesor",
          description: "Un asesor te contactará para explicarte el Plan Familia Plus.",
          showSchool: false,
        };
      case "demo":
        return {
          title: "Agendar Demo para Colegios",
          description: "Agenda una demostración personalizada para tu institución.",
          showSchool: true,
        };
    }
  };

  const dialogContent = getDialogContent();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2 rounded-xl bg-gradient-primary group-hover:shadow-glow transition-all">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg text-foreground">
                Nova<span className="text-gradient">Schola</span>
              </span>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Planes y Precios
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Elige el plan perfecto para{" "}
            <span className="text-gradient">tu aprendizaje</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Desde estudiantes individuales hasta colegios completos, tenemos un plan que se adapta a tus necesidades educativas.
          </p>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-3xl border transition-all duration-300 hover:shadow-xl ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-primary/10 to-background border-primary/30 shadow-lg scale-[1.02]"
                    : "bg-gradient-card border-border hover:border-primary/20"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-medium shadow-glow">
                      Más Popular
                    </span>
                  </div>
                )}

                <div className="p-6 lg:p-8">
                  {/* Plan Header */}
                  <div className="mb-6">
                    <div
                      className={`inline-flex p-3 rounded-xl mb-4 ${
                        plan.highlighted ? "bg-primary/20 text-primary" : "bg-secondary text-foreground"
                      }`}
                    >
                      {plan.icon}
                    </div>
                    <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">{plan.description}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 rounded-full bg-green-500/20">
                          <Check className="w-3 h-3 text-green-500" />
                        </div>
                        <span className="text-sm text-foreground">{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    onClick={() => openDialog(plan.ctaAction)}
                    className="w-full"
                    variant={plan.highlighted ? "gradient" : "secondary"}
                    size="lg"
                  >
                    {plan.ctaAction === "demo" && <Calendar className="w-4 h-4 mr-2" />}
                    {plan.ctaAction === "advisor" && <Mail className="w-4 h-4 mr-2" />}
                    {plan.cta}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-16 border-t border-border bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Todos los planes incluyen
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: <Sparkles className="w-6 h-6" />, title: "IA Socrática", desc: "Método de enseñanza probado" },
              { icon: <Camera className="w-6 h-6" />, title: "Foto de Tareas", desc: "Sube fotos de ejercicios" },
              { icon: <Mic className="w-6 h-6" />, title: "Voz Natural", desc: "Conversa como con un tutor real" },
              { icon: <FileText className="w-6 h-6" />, title: "Reportes", desc: "Seguimiento del progreso" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="text-center p-6 rounded-2xl bg-background border border-border"
              >
                <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground mb-4">
            ¿Tienes preguntas? Escríbenos a{" "}
            <a href="mailto:contacto@novaschola.ai" className="text-primary hover:underline">
              contacto@novaschola.ai
            </a>
          </p>
        </div>
      </section>

      {/* Contact Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{dialogContent.title}</DialogTitle>
            <DialogDescription>{dialogContent.description}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tu nombre"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+56 9 1234 5678"
              />
            </div>

            {dialogContent.showSchool && (
              <div className="space-y-2">
                <Label htmlFor="school">Nombre del colegio</Label>
                <Input
                  id="school"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  placeholder="Nombre de tu institución"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message">Mensaje (opcional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Cuéntanos más sobre tus necesidades..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" variant="gradient" disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pricing;
