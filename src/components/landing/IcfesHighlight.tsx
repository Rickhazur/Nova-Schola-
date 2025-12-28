import { Button } from "@/components/ui/button";
import { Target, ArrowDown } from "lucide-react";

const IcfesHighlight = () => {
  const scrollToModules = () => {
    const modulesSection = document.getElementById('key-modules');
    if (modulesSection) {
      modulesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 mb-6 shadow-lg">
            <Target className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Listos para la nueva era del ICFES
          </h2>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            El examen Saber 11° mantiene sus cinco pruebas clásicas, pero cada vez exige más 
            lectura profunda, análisis de contexto y razonamiento en todas las áreas. Nova Schola 
            entiende hacia dónde va el ICFES y prepara a tus estudiantes con simulacros alineados 
            a la estructura oficial 2026, análisis por área y estrategias de examen impulsadas por IA.
          </p>

          {/* CTA Button */}
          <Button 
            variant="outline" 
            size="lg" 
            onClick={scrollToModules}
            className="group border-orange-500/30 hover:border-orange-500 hover:bg-orange-500/10 transition-all duration-300"
          >
            Ver módulo de Preparación ICFES
            <ArrowDown className="ml-2 w-4 h-4 group-hover:translate-y-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default IcfesHighlight;
