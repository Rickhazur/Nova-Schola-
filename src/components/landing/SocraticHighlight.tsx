import { Brain, Sparkles, User } from "lucide-react";

const SocraticHighlight = () => {
  return (
    <section className="py-24 bg-card/50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,hsl(199_89%_48%/0.08),transparent_50%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
              Tutor IA Socrático
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              La IA que{" "}
              <span className="text-gradient">nunca da respuestas</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Basado en el método de Sócrates, nuestro tutor te hace las preguntas correctas 
              para que tú descubras las respuestas. Así el conocimiento se convierte en 
              verdadera comprensión.
            </p>

            <div className="space-y-4">
              {[
                {
                  title: "No te da la respuesta",
                  description: "Te guía con preguntas estratégicas hacia el entendimiento.",
                },
                {
                  title: "Se adapta a tu nivel",
                  description: "Detecta cuánto sabes y ajusta la dificultad en tiempo real.",
                },
                {
                  title: "Fomenta el pensamiento crítico",
                  description: "Desarrollas habilidades que duran toda la vida.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Chat Demo */}
          <div className="relative">
            <div className="rounded-2xl bg-background border border-border shadow-elevated overflow-hidden">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Tutor IA</p>
                  <p className="text-xs text-muted-foreground">Método Socrático</p>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-green-500" />
              </div>

              {/* Chat Messages */}
              <div className="p-6 space-y-4">
                {/* User Message */}
                <div className="flex gap-3 justify-end">
                  <div className="bg-primary/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-foreground">
                      No entiendo cómo resolver esta ecuación: 2x + 5 = 13
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                {/* AI Message 1 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-foreground">
                      ¡Interesante! Pensemos juntos. 🤔 Si quieres despejar la x, ¿qué crees que deberías hacer primero con ese +5?
                    </p>
                  </div>
                </div>

                {/* User Message 2 */}
                <div className="flex gap-3 justify-end">
                  <div className="bg-primary/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-foreground">
                      ¿Restarlo de ambos lados?
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                {/* AI Message 2 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-foreground">
                      ¡Exacto! 🎯 Y si restas 5 de 13, ¿qué te queda al lado derecho?
                    </p>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="px-6 py-4 border-t border-border">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary">
                  <span className="text-sm text-muted-foreground">Escribe tu respuesta...</span>
                </div>
              </div>
            </div>

            {/* Decorative Glow */}
            <div className="absolute -z-10 inset-0 blur-3xl bg-primary/5 rounded-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocraticHighlight;
