import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Layers, Zap, Clock, Target, Plus, Play } from "lucide-react";

const decks = [
  {
    title: "Cálculo Integral",
    cards: 45,
    mastered: 32,
    dueToday: 8,
    color: "primary",
  },
  {
    title: "Vocabulario Inglés",
    cards: 120,
    mastered: 85,
    dueToday: 15,
    color: "accent",
  },
  {
    title: "Fórmulas de Física",
    cards: 30,
    mastered: 18,
    dueToday: 5,
    color: "gold",
  },
  {
    title: "Historia Universal",
    cards: 60,
    mastered: 42,
    dueToday: 10,
    color: "primary",
  },
];

const Flashcards = () => {
  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">AI Flashcards</h1>
            <p className="text-muted-foreground mt-1">
              Sistema de repaso espaciado inteligente
            </p>
          </div>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Crear Deck
          </Button>
        </div>

        {/* Today's Review */}
        <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center shadow-glow-teal">
                  <Zap className="w-7 h-7 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Repaso de Hoy</h2>
                  <p className="text-muted-foreground">38 tarjetas pendientes de revisar</p>
                </div>
              </div>
              <Button className="bg-accent text-accent-foreground hover:opacity-90">
                <Play className="w-4 h-4 mr-2" />
                Comenzar Repaso
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">255</p>
                  <p className="text-xs text-muted-foreground">Total de tarjetas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">177</p>
                  <p className="text-xs text-muted-foreground">Dominadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">7</p>
                  <p className="text-xs text-muted-foreground">Días de racha</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Decks */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Mis Decks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {decks.map((deck, idx) => {
              const colorClasses = {
                primary: "border-primary/20 hover:border-primary/40",
                accent: "border-accent/20 hover:border-accent/40",
                gold: "border-gold/20 hover:border-gold/40",
              };
              const progressColor = deck.color === "gold" ? "bg-gold" : deck.color === "accent" ? "bg-accent" : "bg-primary";
              const masteryPercent = Math.round((deck.mastered / deck.cards) * 100);

              return (
                <Card key={idx} className={`bg-card border transition-colors ${colorClasses[deck.color as keyof typeof colorClasses]}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-foreground">{deck.title}</CardTitle>
                      <Badge variant="outline" className="border-gold/30 text-gold">
                        {deck.dueToday} hoy
                      </Badge>
                    </div>
                    <CardDescription>{deck.cards} tarjetas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Dominio</span>
                          <span className="text-foreground font-medium">{masteryPercent}%</span>
                        </div>
                        <Progress value={masteryPercent} className={`h-2 ${progressColor}`} />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 border-border hover:border-primary/50">
                          Estudiar
                        </Button>
                        <Button variant="ghost" className="px-3">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Flashcards;
