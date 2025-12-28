import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Crown, RefreshCw, Users, Loader2 } from 'lucide-react';
import type { PlanType } from '@/hooks/useSubscription';

interface StudentPlan {
  id: string;
  user_id: string;
  full_name: string;
  plan: PlanType;
  token_allowance: number;
  tokens_used_this_month: number;
}

const DEFAULT_ALLOWANCES: Record<PlanType, number> = {
  BASIC: 50,
  PRO: 200,
  ELITE: 1000,
};

export function AdminPlanManager() {
  const [students, setStudents] = useState<StudentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('id, user_id, full_name, plan, token_allowance, tokens_used_this_month')
        .order('full_name');

      if (error) throw error;
      setStudents((data || []) as StudentPlan[]);
    } catch (err) {
      console.error('Error fetching students:', err);
      toast({
        title: "Error",
        description: "No se pudieron cargar los estudiantes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStudentPlan = async (studentId: string, newPlan: PlanType) => {
    setUpdating(studentId);
    try {
      const { error } = await supabase
        .from('student_profiles')
        .update({
          plan: newPlan,
          token_allowance: DEFAULT_ALLOWANCES[newPlan],
        })
        .eq('id', studentId);

      if (error) throw error;

      setStudents(prev =>
        prev.map(s =>
          s.id === studentId
            ? { ...s, plan: newPlan, token_allowance: DEFAULT_ALLOWANCES[newPlan] }
            : s
        )
      );

      toast({
        title: "Plan actualizado",
        description: `El plan se ha cambiado a ${newPlan}`,
      });
    } catch (err) {
      console.error('Error updating plan:', err);
      toast({
        title: "Error",
        description: "No se pudo actualizar el plan",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const resetStudentTokens = async (studentId: string) => {
    setUpdating(studentId);
    try {
      const { error } = await supabase
        .from('student_profiles')
        .update({
          tokens_used_this_month: 0,
          token_reset_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', studentId);

      if (error) throw error;

      setStudents(prev =>
        prev.map(s =>
          s.id === studentId ? { ...s, tokens_used_this_month: 0 } : s
        )
      );

      toast({
        title: "Tokens reiniciados",
        description: "Los tokens del estudiante se han reiniciado",
      });
    } catch (err) {
      console.error('Error resetting tokens:', err);
      toast({
        title: "Error",
        description: "No se pudieron reiniciar los tokens",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const getPlanColor = (plan: PlanType) => {
    switch (plan) {
      case 'ELITE': return 'bg-gradient-gold text-primary-foreground';
      case 'PRO': return 'bg-gradient-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
            <Crown className="w-5 h-5 text-gold" />
          </div>
          <div>
            <CardTitle className="text-foreground">Gestión de Planes</CardTitle>
            <CardDescription>Administra los planes y tokens de los estudiantes</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No hay estudiantes registrados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-foreground">
                      {student.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{student.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Tokens: {student.tokens_used_this_month} / {student.token_allowance}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge className={getPlanColor(student.plan)}>
                    {student.plan}
                  </Badge>
                  
                  <Select
                    value={student.plan}
                    onValueChange={(value) => updateStudentPlan(student.id, value as PlanType)}
                    disabled={updating === student.id}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BASIC">BASIC</SelectItem>
                      <SelectItem value="PRO">PRO</SelectItem>
                      <SelectItem value="ELITE">ELITE</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resetStudentTokens(student.id)}
                    disabled={updating === student.id}
                    className="h-8"
                  >
                    {updating === student.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
