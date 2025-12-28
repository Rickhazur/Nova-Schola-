import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GraduationCap,
  Home,
  Eye,
  Clock,
  MessageSquare,
  Users,
  BarChart3,
  Shield,
  RefreshCw,
  Trash2, // NUEVO
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceStrict } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast"; // NUEVO

interface TutorSession {
  id: string;
  student_id: string;
  student_name: string | null;
  age_group: string;
  timestamp_start: string;
  timestamp_end: string | null;
  messages: Array<{ role: string; content: string }>;
  status_timeline: string[];
  skill: string | null;
  overall_status: string | null;
  notes: string | null;
  is_active: boolean;
}

const statusColors: Record<string, string> = {
  UNDERSTOOD: "bg-green-500/20 text-green-400 border-green-500/30",
  PARTIAL: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  CONFUSED: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabels: Record<string, string> = {
  UNDERSTOOD: "Comprendido",
  PARTIAL: "Parcial",
  CONFUSED: "Confundido",
};

const AdminTutorSessions = () => {
  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<TutorSession | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [resetting, setResetting] = useState(false); // NUEVO
  const { toast } = useToast(); // NUEVO

  const fetchSessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tutor_sessions")
      .select("*")
      .order("timestamp_start", { ascending: false });

    if (error) {
      console.error("Error fetching sessions:", error);
    } else {
      const mapped = (data || []).map((s) => ({
        id: s.id,
        student_id: s.student_id,
        student_name: s.student_name,
        age_group: s.age_group,
        timestamp_start: s.timestamp_start,
        timestamp_end: s.timestamp_end,
        messages: Array.isArray(s.messages)
          ? (s.messages as Array<{ role: string; content: string }>)
          : [],
        status_timeline: Array.isArray(s.status_timeline)
          ? (s.status_timeline as string[])
          : [],
        skill: s.skill,
        overall_status: s.overall_status,
        notes: s.notes,
        is_active: s.is_active,
      }));
      setSessions(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Función para borrar TODAS las sesiones
  const handleResetSessions = async () => {
    const confirmMessage = `¿Estás seguro de que deseas borrar TODAS las sesiones del tutor IA?\n\nEsto eliminará:\n- ${sessions.length} sesiones\n- Todo el historial de conversaciones\n- Todos los estados y notas\n\nEsta acción NO se puede deshacer.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setResetting(true);

    try {
      // Obtener todos los IDs de sesiones existentes
      const sessionIds = sessions.map((s) => s.id);
      
      if (sessionIds.length === 0) {
        toast({
          title: "Sin sesiones",
          description: "No hay sesiones que borrar.",
        });
        setResetting(false);
        return;
      }

      // Borrar por IDs existentes
      const { error } = await supabase
        .from("tutor_sessions")
        .delete()
        .in("id", sessionIds);

      if (error) throw error;

      // Actualizar el estado local (vaciar la lista)
      setSessions([]);

      // Mostrar notificación de éxito
      toast({
        title: "Historial borrado",
        description: "Todas las sesiones del tutor han sido eliminadas correctamente.",
        variant: "default",
      });

    } catch (error: unknown) {
      console.error("Error al borrar sesiones:", error);
      const message = error instanceof Error ? error.message : "No se pudieron borrar las sesiones.";
      toast({
        title: "Error al borrar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  const getDuration = (start: string, end: string | null) => {
    if (!end) return "En curso";
    return formatDistanceStrict(new Date(end), new Date(start), { locale: es });
  };

  const getStatusCounts = (timeline: string[]) => {
    return {
      understood: timeline.filter((s) => s === "UNDERSTOOD").length,
      partial: timeline.filter((s) => s === "PARTIAL").length,
      confused: timeline.filter((s) => s === "CONFUSED").length,
    };
  };

  const openDetail = (session: TutorSession) => {
    setSelectedSession(session);
    setDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">
              Nova<span className="text-gradient">Schola</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            to="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            to="/admin/tutor-sessions"
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium"
          >
            <MessageSquare className="w-4 h-4" />
            Sesiones de Tutor
          </Link>
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4" />
            Admin Only
          </div>
          <Link to="/">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <Home className="w-4 h-4" />
              Volver al inicio
            </button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header - MODIFICADO: ahora con dos botones */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                Sesiones de Tutor IA
              </h1>
              <p className="text-muted-foreground">
                Historial de todas las conversaciones con estudiantes.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={fetchSessions} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleResetSessions} 
                disabled={resetting || sessions.length === 0}
              >
                <Trash2 className={`w-4 h-4 mr-2 ${resetting ? "animate-spin" : ""}`} />
                {resetting ? "Borrando..." : "Borrar historial"}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-gradient-card border border-border flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sesiones</p>
                <p className="font-display text-xl font-bold text-foreground">{sessions.length}</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-card border border-border flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activas</p>
                <p className="font-display text-xl font-bold text-foreground">
                  {sessions.filter((s) => s.is_active).length}
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-card border border-border flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estudiantes Únicos</p>
                <p className="font-display text-xl font-bold text-foreground">
                  {new Set(sessions.map((s) => s.student_id)).size}
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-gradient-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Fecha</TableHead>
                    <TableHead className="text-muted-foreground">Estudiante</TableHead>
                    <TableHead className="text-muted-foreground">Edad / Nivel</TableHead>
                    <TableHead className="text-muted-foreground">Tema / Habilidad</TableHead>
                    <TableHead className="text-muted-foreground">Estado</TableHead>
                    <TableHead className="text-muted-foreground">Duración</TableHead>
                    <TableHead className="text-muted-foreground">Mensajes</TableHead>
                    <TableHead className="text-muted-foreground"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Cargando sesiones...
                      </TableCell>
                    </TableRow>
                  ) : sessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No hay sesiones registradas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((session) => (
                      <TableRow key={session.id} className="border-border">
                        <TableCell className="text-foreground">
                          {format(new Date(session.timestamp_start), "dd MMM yyyy, HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">
                              {session.student_name || "Anónimo"}
                            </p>
                            <p className="text-xs text-muted-foreground">{session.student_id.slice(0, 8)}...</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {session.age_group === "primary" ? "Primaria" : "Secundaria"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {session.skill || "-"}
                        </TableCell>
                        <TableCell>
                          {session.overall_status ? (
                            <Badge className={`${statusColors[session.overall_status]} border`}>
                              {statusLabels[session.overall_status] || session.overall_status}
                            </Badge>
                          ) : session.is_active ? (
                            <Badge variant="outline" className="text-muted-foreground">
                              En curso
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {getDuration(session.timestamp_start, session.timestamp_end)}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {session.messages.length}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => openDetail(session)}>
                            <Eye className="w-4 h-4 mr-1" />
                            Ver detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </main>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Detalle de Sesión
            </DialogTitle>
          </DialogHeader>

          {selectedSession && (
            <div className="flex-1 overflow-hidden flex flex-col gap-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Estudiante</p>
                  <p className="font-medium text-foreground">
                    {selectedSession.student_name || "Anónimo"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Estado Final</p>
                  {selectedSession.overall_status ? (
                    <Badge className={`${statusColors[selectedSession.overall_status]} border`}>
                      {statusLabels[selectedSession.overall_status]}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">En curso</span>
                  )}
                </div>
              </div>

              {/* Status Timeline */}
              {selectedSession.status_timeline.length > 0 && (
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Timeline de Estado</p>
                  <div className="flex gap-2 flex-wrap">
                    {(() => {
                      const counts = getStatusCounts(selectedSession.status_timeline);
                      return (
                        <>
                          <Badge className={`${statusColors.UNDERSTOOD} border`}>
                            ✓ {counts.understood}
                          </Badge>
                          <Badge className={`${statusColors.PARTIAL} border`}>
                            ~ {counts.partial}
                          </Badge>
                          <Badge className={`${statusColors.CONFUSED} border`}>
                            ✗ {counts.confused}
                          </Badge>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex gap-1 mt-3">
                    {selectedSession.status_timeline.map((status, idx) => (
                      <div
                        key={idx}
                        className={`w-3 h-3 rounded-full ${
                          status === "UNDERSTOOD"
                            ? "bg-green-500"
                            : status === "PARTIAL"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        title={`Turno ${idx + 1}: ${statusLabels[status] || status}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedSession.notes && (
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Notas del Resumen</p>
                  <p className="text-sm text-foreground">{selectedSession.notes}</p>
                </div>
              )}

              {/* Chat History */}
              <div className="flex-1 min-h-0">
                <p className="text-xs text-muted-foreground mb-2">
                  Historial de Chat ({selectedSession.messages.length} mensajes)
                </p>
                <ScrollArea className="h-[300px] rounded-lg border border-border bg-background p-4">
                  <div className="space-y-3">
                    {selectedSession.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg ${
                          msg.role === "user"
                            ? "bg-primary/10 ml-8"
                            : "bg-secondary mr-8"
                        }`}
                      >
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {msg.role === "user" ? "Estudiante" : "Tutor IA"}
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    ))}
                    {selectedSession.messages.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm">
                        No hay mensajes en esta sesión.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTutorSessions;
