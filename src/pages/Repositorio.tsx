import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderOpen, FileText, Image, Calendar, Download, Eye } from "lucide-react";

const weeks = [
  {
    week: "Semana 12",
    date: "16 - 22 Dic 2024",
    items: [
      { type: "document", title: "Ensayo: Cambio Climático", subject: "Ciencias", status: "Completado" },
      { type: "image", title: "Diagrama de Funciones", subject: "Matemáticas", status: "Completado" },
    ],
  },
  {
    week: "Semana 11",
    date: "9 - 15 Dic 2024",
    items: [
      { type: "document", title: "Análisis Literario: Don Quijote", subject: "Literatura", status: "Completado" },
      { type: "document", title: "Práctica de Integrales", subject: "Cálculo", status: "Completado" },
      { type: "image", title: "Mapa Mental: Historia", subject: "Historia", status: "Completado" },
    ],
  },
  {
    week: "Semana 10",
    date: "2 - 8 Dic 2024",
    items: [
      { type: "document", title: "Reporte de Laboratorio: Química", subject: "Química", status: "Completado" },
      { type: "image", title: "Gráficas Estadísticas", subject: "Estadística", status: "Completado" },
    ],
  },
];

const Repositorio = () => {
  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mi Repositorio</h1>
            <p className="text-muted-foreground mt-1">
              Evidencias de tu trabajo organizado por semana
            </p>
          </div>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Download className="w-4 h-4 mr-2" />
            Exportar Todo
          </Button>
        </div>

        <div className="space-y-6">
          {weeks.map((week) => (
            <Card key={week.week} className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">{week.week}</CardTitle>
                      <CardDescription>{week.date}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">{week.items.length} evidencias</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {week.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          item.type === "document" ? "bg-accent/10" : "bg-gold/10"
                        }`}>
                          {item.type === "document" ? (
                            <FileText className="w-4 h-4 text-accent" />
                          ) : (
                            <Image className="w-4 h-4 text-gold" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.subject}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs border-accent/30 text-accent">
                          {item.status}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Repositorio;
