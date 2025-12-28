import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, Brain, Coins, CheckCircle } from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      
      {/* Dark Overlay with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      
      {/* Subtle Accent Glows */}
      <div className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange/8 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10 pt-24 pb-12">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-8 animate-slide-up opacity-0" style={{ animationFillMode: 'forwards' }}>
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Potenciado por Inteligencia Artificial
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up opacity-0 stagger-1 leading-[1.1]" style={{ animationFillMode: 'forwards' }}>
            El Futuro de la{" "}
            <span className="text-gradient">Educación Élite</span>,{" "}
            <span className="text-orange">Hoy</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl animate-slide-up opacity-0 stagger-2" style={{ animationFillMode: 'forwards' }}>
            Domina <span className="text-foreground font-semibold">STEM, IB, AP y las pruebas ICFES</span> con 
            tu tutor IA personal. Resultados medibles, método socrático y acompañamiento 24/7.
          </p>

          {/* Key Benefits */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-10 animate-slide-up opacity-0 stagger-2" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span>Sin tarjeta de crédito</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span>3 días gratis</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span>Cancela cuando quieras</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-slide-up opacity-0 stagger-3" style={{ animationFillMode: 'forwards' }}>
            <Link to="/app/select-plan">
              <Button variant="orange" size="xl" className="group w-full sm:w-auto shadow-glow-orange">
                Comenzar Gratis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="outline" size="xl" className="w-full sm:w-auto bg-background/50 backdrop-blur-sm border-border hover:bg-background/80">
              <Play className="w-5 h-5" />
              Ver Demo Tour
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-6 animate-slide-up opacity-0 stagger-4" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Método Socrático</p>
                <p className="text-xs text-muted-foreground">Aprendizaje guiado</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">IA Multimodal</p>
                <p className="text-xs text-muted-foreground">Voz, texto y pizarra</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                <Coins className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Nova Coins</p>
                <p className="text-xs text-muted-foreground">Gamificación real</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
