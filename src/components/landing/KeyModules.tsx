import { Brain, Sparkles, Coins, Compass, Layers, Trophy, Target } from "lucide-react";

const modules = [
  {
    id: "socratic",
    title: "Método Socrático",
    description: "Aprende a pensar, no a memorizar. El tutor te guía con preguntas que estimulan el pensamiento crítico.",
    icon: Brain,
    gradient: "from-primary to-blue-400",
  },
  {
    id: "multimodal",
    title: "IA Multimodal",
    description: "Interactúa con texto, voz, imágenes y dibujos. El tutor se adapta a tu forma favorita de comunicarte.",
    icon: Sparkles,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "novacoins",
    title: "Nova Coins",
    description: "Gana monedas por cada logro y canjéalas por premios reales. La motivación que impulsa el aprendizaje.",
    icon: Coins,
    gradient: "from-gold to-amber-400",
    isGold: true,
  },
  {
    id: "icfes",
    title: "Preparación ICFES 360°",
    description: "Simulacros tipo ICFES, análisis por área y técnicas de examen con IA. Conecta lo que aprendes en IB y currículo colombiano con los resultados que exige el Estado.",
    icon: Target,
    gradient: "from-emerald-500 to-teal-400",
    isNew: true,
  },
  {
    id: "career",
    title: "Career Pathfinder",
    description: "Descubre tu vocación con IA que analiza tus fortalezas y te sugiere caminos profesionales.",
    icon: Compass,
    gradient: "from-accent to-teal-400",
  },
  {
    id: "flashcards",
    title: "AI Flashcards",
    description: "Sistema de repaso espaciado inteligente que optimiza tu retención de conocimiento a largo plazo.",
    icon: Layers,
    gradient: "from-primary to-cyan-400",
  },
  {
    id: "arena",
    title: "Arena Social",
    description: "Compite con otros estudiantes en desafíos académicos y sube en el ranking global.",
    icon: Trophy,
    gradient: "from-gold to-orange-400",
    isGold: true,
  },
];

const KeyModules = () => {
  return (
    <section id="key-modules" className="py-24 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(43_96%_56%/0.03),transparent_70%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
            Módulos Críticos
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Todo lo que necesitas para{" "}
            <span className="text-gradient">dominar</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Un ecosistema completo de herramientas para el éxito académico.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <div
              key={module.id}
              className={`group relative p-6 rounded-2xl bg-gradient-card border transition-all duration-500 hover:scale-[1.02] ${
                module.isGold 
                  ? 'border-gold/20 hover:border-gold/40' 
                  : 'border-border hover:border-primary/30'
              }`}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <module.icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <h3 className={`text-lg font-bold mb-2 ${module.isGold ? 'text-gradient-gold' : 'text-foreground'}`}>
                {module.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {module.description}
              </p>

              {/* Decorative Corner */}
              {module.isGold && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 rounded-md bg-gold/10 text-gold text-[10px] font-semibold uppercase tracking-wider">
                    Popular
                  </span>
                </div>
              )}
              {module.isNew && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold uppercase tracking-wider">
                    Nuevo
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyModules;
