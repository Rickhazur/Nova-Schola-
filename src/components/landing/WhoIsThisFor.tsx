import { GraduationCap, Users, School } from "lucide-react";

const audiences = [
  {
    icon: GraduationCap,
    title: "Estudiantes",
    description: "Sube tus notas y domina STEM sin estudiar a ciegas.",
    features: ["Tutor IA disponible 24/7", "Método socrático personalizado", "Gamificación con Nova Coins"],
    gradient: "from-primary to-accent",
    glow: "group-hover:shadow-glow",
  },
  {
    icon: Users,
    title: "Familias",
    description: "Entiende el progreso real sin perseguir tareas.",
    features: ["Panel de control para padres", "Reportes de comprensión", "Alertas de progreso"],
    gradient: "from-accent to-primary",
    glow: "group-hover:shadow-glow-teal",
  },
  {
    icon: School,
    title: "Colegios",
    description: "Resultados institucionales con analíticas y reportes automáticos.",
    features: ["Dashboard institucional", "Integración con LMS", "Reportes por aula y grado"],
    gradient: "from-gold to-amber-400",
    glow: "group-hover:shadow-glow-gold",
  },
];

const WhoIsThisFor = () => {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(199_89%_48%/0.03),transparent_70%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
            Para Todos
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            ¿Para quién es{" "}
            <span className="text-gradient">Nova Schola</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Diseñado para adaptarse a las necesidades de cada tipo de usuario.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {audiences.map((audience) => (
            <div
              key={audience.title}
              className={`group relative p-8 rounded-2xl bg-gradient-card border border-border hover:border-primary/30 transition-all duration-500 ${audience.glow}`}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${audience.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300`}>
                <audience.icon className="w-7 h-7 text-primary-foreground" />
              </div>

              {/* Content */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {audience.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {audience.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2">
                {audience.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Hover Glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${audience.gradient} opacity-[0.03]`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhoIsThisFor;
