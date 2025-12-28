import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  GraduationCap, Users, Clock, Search, Home, Settings,
  BarChart3, BookOpen, Gift, Coins, Loader2, UserPlus, Trash2, Eye
} from "lucide-react";
import { EnrollStudentModal } from "@/components/admin/EnrollStudentModal";
import { StudentDetailModal } from "@/components/admin/StudentDetailModal";
import { RewardsManager } from "@/components/admin/RewardsManager";
import { RemedialTemplatesManager } from "@/components/admin/RemedialTemplatesManager";
import { CycleResetCard } from "@/components/admin/CycleResetCard";
import { useToast } from "@/hooks/use-toast";

interface StudentProfile {
  user_id: string;
  full_name: string;
  grade_level: number | null;
  guardian_name: string | null;
  guardian_whatsapp: string | null;
  plan: string;
  status: string;
  updated_at: string;
}

interface StudentWithCoins extends StudentProfile {
  coins_balance: number;
}

const Admin = () => {
  const [students, setStudents] = useState<StudentWithCoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("student_profiles")
      .select("user_id, full_name, grade_level, guardian_name, guardian_whatsapp, plan, status, updated_at")
      .order("full_name");

    const { data: coins } = await supabase
      .from("student_coins")
      .select("student_id, balance");

    const coinsMap = new Map((coins || []).map((c) => [c.student_id, c.balance]));

    const studentsWithCoins: StudentWithCoins[] = (profiles || []).map((p) => ({
      ...p,
      coins_balance: coinsMap.get(p.user_id) || 0,
    }));

    setStudents(studentsWithCoins);
    setLoading(false);
  };

  const deleteStudent = async (student: StudentWithCoins) => {
    const confirmMessage = `¿Estás seguro de que deseas eliminar a ${student.full_name}?\n\nEsta acción eliminará:\n- Su perfil\n- Sus coins y transacciones\n- Sus programas remediales, tareas y envíos\n- Sus canjes de premios\n- Su cuenta de acceso (auth)\n\nEsta acción NO se puede deshacer.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeletingId(student.user_id);

    try {
      // 0. Comprobar sesión
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Debes iniciar sesión como administrador.");
      }

      // 1. Eliminar registros relacionados primero

      // Eliminar coins
      await supabase
        .from("student_coins")
        .delete()
        .eq("student_id", student.user_id);

      // Eliminar transacciones de coins
      await supabase
        .from("coin_transactions")
        .delete()
        .eq("student_id", student.user_id);

      // Eliminar programas remediales y tareas asociadas
      const { data: programs, error: programsError } = await supabase
        .from("student_remedial_programs")
        .select("id")
        .eq("student_id", student.user_id);

      if (programsError) {
        console.error("Error obteniendo programas remediales:", programsError);
      }

      if (programs && programs.length > 0) {
        const programIds = programs.map((p) => p.id);

        await supabase
          .from("homework_tasks")
          .delete()
          .in("student_program_id", programIds);

        await supabase
          .from("homework_submissions")
          .delete()
          .eq("student_id", student.user_id);

        await supabase
          .from("student_remedial_programs")
          .delete()
          .eq("student_id", student.user_id);
      }

      // Eliminar canjes de premios
      await supabase
        .from("reward_redemptions")
        .delete()
        .eq("student_id", student.user_id);

      // 2. Eliminar el perfil del estudiante
      const { error: profileError } = await supabase
        .from("student_profiles")
        .delete()
        .eq("user_id", student.user_id);

      if (profileError) throw profileError;

      // 3. Eliminar el usuario de auth mediante Edge Function
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "admin-delete-user",
        {
          body: { user_id: student.user_id },
        }
      );

      if (fnError) {
        console.error("Error desde admin-delete-user:", fnError);
        throw fnError;
      }

      if (!fnData?.success) {
        throw new Error(fnData?.error || "No se pudo eliminar el usuario de auth.");
      }

      // 4. Actualizar el estado local
      setStudents((prev) => prev.filter((s) => s.user_id !== student.user_id));

      // 5. Mostrar notificación de éxito
      toast({
        title: "Estudiante eliminado",
        description: `${student.full_name} ha sido eliminado correctamente.`,
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error al eliminar estudiante:", error);
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar el estudiante. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel =
      selectedLevel === "all" ||
      (selectedLevel === "primary" && (student.grade_level || 0) <= 5) ||
      (selectedLevel === "highschool" && (student.grade_level || 0) > 5);
    return matchesSearch && matchesLevel;
  });

  const stats = {
    totalStudents: students.length,
    activeStudents: students.filter((s) => s.status === "active").length,
    totalCoins: students.reduce((acc, s) => acc + s.coins_balance, 0),
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
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium"
          >
            <BarChart3 className="w-4 h-4" /> Dashboard
          </Link>
          <Link
            to="/admin/tutor-sessions"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary"
          >
            <BookOpen className="w-4 h-4" /> Sesiones de Tutor
          </Link>
        </nav>
        <div className="p-4 border-t border-border">
          <Link to="/">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary">
              <Home className="w-4 h-4" /> Volver al inicio
            </button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Panel de Administración
            </h1>
            <p className="text-muted-foreground">Gestiona estudiantes, programas y recompensas.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-6 rounded-2xl bg-gradient-card border border-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Estudiantes</p>
                <p className="font-display text-2xl font-bold">{stats.totalStudents}</p>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-card border border-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="font-display text-2xl font-bold">{stats.activeStudents}</p>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-card border border-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                <Coins className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Coins en Circulación</p>
                <p className="font-display text-2xl font-bold text-gold">{stats.totalCoins}</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="students" className="space-y-6">
            <TabsList>
              <TabsTrigger value="students">
                <Users className="w-4 h-4 mr-2" />
                Estudiantes
              </TabsTrigger>
              <TabsTrigger value="remedial">
                <BookOpen className="w-4 h-4 mr-2" />
                Programas
              </TabsTrigger>
              <TabsTrigger value="rewards">
                <Gift className="w-4 h-4 mr-2" />
                Tienda y Premios
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Configuración
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students">
              <div className="rounded-2xl bg-gradient-card border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 justify-between">
                  <h2 className="font-display text-xl font-semibold">Estudiantes</h2>
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm"
                      />
                    </div>
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="px-4 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm"
                    >
                      <option value="all">Todos</option>
                      <option value="primary">Primaria</option>
                      <option value="highschool">Secundaria</option>
                    </select>
                    <Button onClick={() => setShowEnrollModal(true)}>
                      <UserPlus className="w-4 h-4 mr-2" /> Inscribir
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                            Estudiante
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                            Nivel
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                            Plan
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                            Coins
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                            Estado
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student) => (
                          <tr key={student.user_id} className="border-b border-border hover:bg-secondary/50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                                  <span className="font-semibold text-sm text-primary-foreground">
                                    {student.full_name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)}
                                  </span>
                                </div>
                                <span className="font-medium">{student.full_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline">
                                {student.grade_level
                                  ? student.grade_level <= 5
                                    ? `${student.grade_level}° Pri`
                                    : `${student.grade_level}° Sec`
                                  : "-"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Badge>{student.plan}</Badge>
                            </td>
                            <td className="px-6 py-4">
                              <span className="flex items-center gap-1 text-gold">
                                <Coins className="w-3 h-3" />
                                {student.coins_balance}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={student.status === "active" ? "default" : "secondary"}>
                                {student.status === "active" ? "Activo" : "Inactivo"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setSelectedStudent(student)}>
                                  <Eye className="w-4 h-4 mr-1" /> Ver
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteStudent(student)}
                                  disabled={deletingId === student.user_id}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                >
                                  {deletingId === student.user_id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="remedial">
              <RemedialTemplatesManager />
            </TabsContent>
            <TabsContent value="rewards">
              <RewardsManager />
            </TabsContent>
            <TabsContent value="settings">
              <CycleResetCard />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <EnrollStudentModal open={showEnrollModal} onOpenChange={setShowEnrollModal} onSuccess={fetchStudents} />
      <StudentDetailModal
        open={selectedStudent !== null}
        onOpenChange={() => setSelectedStudent(null)}
        student={selectedStudent}
        onRefresh={fetchStudents}
      />
    </div>
  );
};

export default Admin;
