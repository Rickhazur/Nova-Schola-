import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Coins, BookOpen, Plus, Phone, User, Mail, GraduationCap } from "lucide-react";
import { AssignRemedialModal } from "./AssignRemedialModal";
import { AdjustCoinsModal } from "./AdjustCoinsModal";

interface StudentProfile {
  user_id: string;
  full_name: string;
  grade_level: number | null;
  guardian_name: string | null;
  guardian_whatsapp: string | null;
  plan: string;
  status: string;
}

interface StudentCoins {
  balance: number;
  total_earned: number;
  total_spent: number;
}

interface RemedialProgram {
  id: string;
  custom_title: string | null;
  goals: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  program_id: string | null;
  remedial_programs: { name: string; subject: string } | null;
}

interface CoinTransaction {
  id: string;
  amount: number;
  type: string;
  reason: string;
  created_at: string;
}

interface StudentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentProfile | null;
  onRefresh: () => void;
}

export const StudentDetailModal = ({ open, onOpenChange, student, onRefresh }: StudentDetailModalProps) => {
  const [coins, setCoins] = useState<StudentCoins | null>(null);
  const [programs, setPrograms] = useState<RemedialProgram[]>([]);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [showRemedialModal, setShowRemedialModal] = useState(false);
  const [showCoinsModal, setShowCoinsModal] = useState<'add' | 'subtract' | null>(null);

  useEffect(() => {
    if (student && open) {
      fetchStudentData();
    }
  }, [student, open]);

  const fetchStudentData = async () => {
    if (!student) return;

    // Fetch coins
    const { data: coinsData } = await supabase
      .from('student_coins')
      .select('*')
      .eq('student_id', student.user_id)
      .maybeSingle();
    
    setCoins(coinsData || { balance: 0, total_earned: 0, total_spent: 0 });

    // Fetch remedial programs
    const { data: programsData } = await supabase
      .from('student_remedial_programs')
      .select(`
        id, custom_title, goals, start_date, end_date, status, program_id,
        remedial_programs (name, subject)
      `)
      .eq('student_id', student.user_id)
      .eq('status', 'active');
    
    setPrograms((programsData as unknown as RemedialProgram[]) || []);

    // Fetch recent transactions
    const { data: txData } = await supabase
      .from('coin_transactions')
      .select('*')
      .eq('student_id', student.user_id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    setTransactions(txData || []);
  };

  if (!student) return null;

  const gradeLabel = student.grade_level 
    ? student.grade_level <= 5 
      ? `${student.grade_level}° Primaria` 
      : `${student.grade_level}° Secundaria`
    : 'No especificado';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-semibold">
                  {student.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              {student.full_name}
              <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                {student.status === 'active' ? 'Activo' : 'Inactivo'}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  <span>{gradeLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{student.plan}</Badge>
                </div>
                {student.guardian_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{student.guardian_name}</span>
                  </div>
                )}
                {student.guardian_whatsapp && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{student.guardian_whatsapp}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Coins */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Coins className="w-4 h-4 text-gold" />
                    Nova Coins
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowCoinsModal('add')}>
                      <Plus className="w-3 h-3 mr-1" /> Dar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowCoinsModal('subtract')}>
                      Ajustar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8 mb-4">
                  <div>
                    <p className="text-3xl font-bold text-gold">{coins?.balance || 0}</p>
                    <p className="text-xs text-muted-foreground">Balance actual</p>
                  </div>
                  <div>
                    <p className="text-lg text-green-500">+{coins?.total_earned || 0}</p>
                    <p className="text-xs text-muted-foreground">Total ganado</p>
                  </div>
                  <div>
                    <p className="text-lg text-red-500">-{coins?.total_spent || 0}</p>
                    <p className="text-xs text-muted-foreground">Total gastado</p>
                  </div>
                </div>
                {transactions.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium mb-2">Últimas transacciones</p>
                    <div className="space-y-2">
                      {transactions.map(tx => (
                        <div key={tx.id} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{tx.reason}</span>
                          <span className={tx.amount > 0 ? 'text-green-500' : 'text-red-500'}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Remedial Programs */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Programas de Refuerzo
                  </CardTitle>
                  <Button size="sm" onClick={() => setShowRemedialModal(true)}>
                    <Plus className="w-3 h-3 mr-1" /> Asignar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {programs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay programas activos</p>
                ) : (
                  <div className="space-y-3">
                    {programs.map(program => (
                      <div key={program.id} className="p-3 bg-secondary rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">
                            {program.custom_title || program.remedial_programs?.name || 'Programa personalizado'}
                          </span>
                          <Badge variant="outline">{program.remedial_programs?.subject || 'General'}</Badge>
                        </div>
                        {program.goals && (
                          <p className="text-xs text-muted-foreground">{program.goals}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(program.start_date).toLocaleDateString()} - {program.end_date ? new Date(program.end_date).toLocaleDateString() : 'Sin fecha fin'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <AssignRemedialModal
        open={showRemedialModal}
        onOpenChange={setShowRemedialModal}
        studentId={student.user_id}
        onSuccess={() => {
          fetchStudentData();
          onRefresh();
        }}
      />

      <AdjustCoinsModal
        open={showCoinsModal !== null}
        onOpenChange={() => setShowCoinsModal(null)}
        studentId={student.user_id}
        mode={showCoinsModal || 'add'}
        onSuccess={() => {
          fetchStudentData();
          onRefresh();
        }}
      />
    </>
  );
};