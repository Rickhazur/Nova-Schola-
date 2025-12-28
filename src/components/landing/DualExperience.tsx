import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, GraduationCap, Palette, Brain, ArrowRight, Gamepad2, BookOpen } from "lucide-react";

export const DualExperience = () => {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background gradients */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5 text-primary">
                        Un Camino, Dos Experiencias
                    </Badge>
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">
                        Crecemos junto a <span className="text-gradient">tu hijo</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Desde sus primeros trazos y sumas hasta su preparación para la universidad.
                        Nova adapta su interfaz, tono y metodología a cada etapa del desarrollo.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 lg:gap-12">

                    {/* NOVA KIDS */}
                    <div className="group relative rounded-3xl border-2 border-amber-200 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-50 to-amber-50/50 dark:from-orange-950/20 dark:to-background p-8 overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_-5px_hsl(30,100%,50%,0.15)] hover:-translate-y-1">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles className="w-32 h-32 text-orange-500" />
                        </div>

                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
                                <Palette className="w-7 h-7 text-white" />
                            </div>

                            <h3 className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-2">
                                Nova Kids
                            </h3>
                            <p className="text-orange-700/80 dark:text-orange-200/70 font-medium mb-6">
                                Para Pequeños Genios (5-11 años)
                            </p>

                            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                                Un entorno seguro y mágico donde aprender es un juego. Pizarras interactivas,
                                personajes animados y recompensas visuales que fomentan la curiosidad innata.
                            </p>

                            <ul className="space-y-3 mb-8">
                                {[
                                    { icon: Gamepad2, text: "Aprendizaje gamificado" },
                                    { icon: Palette, text: "Pizarras de dibujo libre" },
                                    { icon: Sparkles, text: "Tutoría paciente y amable" }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-foreground/80">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                            <item.icon className="w-4 h-4" />
                                        </div>
                                        {item.text}
                                    </li>
                                ))}
                            </ul>

                            <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-lg shadow-orange-500/20">
                                <Link to="/app/tutor-ia/primary">
                                    Explorar Kids <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* NOVA HIGH SCHOOL */}
                    <div className="group relative rounded-3xl border border-primary/20 bg-gradient-to-b from-card to-card/50 p-8 overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_-5px_hsl(221,100%,50%,0.1)] hover:-translate-y-1">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Brain className="w-32 h-32 text-primary" />
                        </div>

                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                                <GraduationCap className="w-7 h-7 text-white" />
                            </div>

                            <h3 className="text-3xl font-bold text-foreground mb-2">
                                Nova High School
                            </h3>
                            <p className="text-primary font-medium mb-6">
                                Para Futuros Líderes (12-18 años)
                            </p>

                            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                                Rigor académico y herramientas profesionales. Preparación para IB, AP e ICFES
                                con analíticas detalladas y metodología socrática puros.
                            </p>

                            <ul className="space-y-3 mb-8">
                                {[
                                    { icon: Brain, text: "Pensamiento crítico profundo" },
                                    { icon: BookOpen, text: "Material nivel universitario" },
                                    { icon: GraduationCap, text: "Preparación exámenes Estado" }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-foreground/80">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <item.icon className="w-4 h-4" />
                                        </div>
                                        {item.text}
                                    </li>
                                ))}
                            </ul>

                            <Button asChild variant="outline" className="w-full border-primary/20 hover:bg-primary/5">
                                <Link to="/app/tutor-ia/highschool">
                                    Ver Nivel Avanzado <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default DualExperience;
