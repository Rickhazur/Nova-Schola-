import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown, Flame, Swords, Users, Star } from "lucide-react";

const leaderboard = [
  { rank: 1, name: "María García", points: 12450, streak: 15, avatar: "MG" },
  { rank: 2, name: "Carlos López", points: 11200, streak: 12, avatar: "CL" },
  { rank: 3, name: "Ana Martínez", points: 10800, streak: 10, avatar: "AM" },
  { rank: 4, name: "Tú", points: 9500, streak: 7, avatar: "NS", isUser: true },
  { rank: 5, name: "Diego Torres", points: 9200, streak: 8, avatar: "DT" },
];

const challenges = [
  {
    title: "Desafío Semanal de Matemáticas",
    participants: 234,
    prize: 500,
    endsIn: "2 días",
    difficulty: "Medio",
  },
  {
    title: "Maratón de Ciencias",
    participants: 156,
    prize: 1000,
    endsIn: "5 días",
    difficulty: "Difícil",
  },
  {
    title: "Quiz de Historia",
    participants: 89,
    prize: 300,
    endsIn: "1 día",
    difficulty: "Fácil",
  },
];

const Arena = () => {
  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Arena & Ranking</h1>
          <p className="text-muted-foreground mt-1">
            Compite con otros estudiantes y gana recompensas
          </p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-gold/10 to-gold/5 border-gold/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">#12</p>
                  <p className="text-xs text-muted-foreground">Tu ranking</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">9,500</p>
                  <p className="text-xs text-muted-foreground">Puntos totales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">7 días</p>
                  <p className="text-xs text-muted-foreground">Racha actual</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Medal className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">15</p>
                  <p className="text-xs text-muted-foreground">Medallas ganadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leaderboard */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Tabla de Líderes</CardTitle>
                  <CardDescription>Top estudiantes esta semana</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((user) => (
                  <div
                    key={user.rank}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      user.isUser
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-muted/50 border border-border hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        user.rank === 1 ? "bg-gold text-gold-foreground" :
                        user.rank === 2 ? "bg-gray-400 text-white" :
                        user.rank === 3 ? "bg-amber-700 text-white" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {user.rank}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-foreground">{user.avatar}</span>
                      </div>
                      <div>
                        <p className={`font-medium ${user.isUser ? "text-primary" : "text-foreground"}`}>
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.points.toLocaleString()} pts</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-accent">
                      <Flame className="w-4 h-4" />
                      <span className="text-sm font-medium">{user.streak}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Challenges */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Swords className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Desafíos Activos</CardTitle>
                  <CardDescription>Compite y gana monedas Nova</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {challenges.map((challenge, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-foreground">{challenge.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{challenge.participants} participantes</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs ${
                        challenge.difficulty === "Fácil" ? "border-accent/30 text-accent" :
                        challenge.difficulty === "Medio" ? "border-gold/30 text-gold" :
                        "border-destructive/30 text-destructive"
                      }`}>
                        {challenge.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gold font-semibold">{challenge.prize}</span>
                        <span className="text-xs text-muted-foreground">monedas</span>
                      </div>
                      <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                        Participar
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Termina en {challenge.endsIn}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Arena;
