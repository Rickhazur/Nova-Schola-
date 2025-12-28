import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, GraduationCap, Users, Building } from "lucide-react";

const FinalCTA = () => {
  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(199_89%_48%/0.15),transparent_60%)]" />
      
      {/* Decorative Elements */}
      <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute top-1/2 right-1/4 w-56 h-56 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-8 shadow-glow">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            ¿Listo para el{" "}
            <span className="text-gradient">futuro</span>?
          </h2>

          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Únete a miles de estudiantes que ya están transformando su forma de aprender 
            con inteligencia artificial.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/app/select-plan">
              <Button variant="orange" size="xl" className="group w-full sm:w-auto">
                <Users className="w-5 h-5" />
                Comenzar Prueba Gratis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="hero-secondary" size="xl" className="w-full sm:w-auto">
              <Building className="w-5 h-5" />
              Soy Colegio / Institución
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Sin tarjeta de crédito • <span className="text-primary font-medium">3 días de prueba gratis</span> • Cancela cuando quieras
          </p>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
