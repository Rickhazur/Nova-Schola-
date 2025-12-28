import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

type PlanType = 'BASIC' | 'PRO' | 'ELITE';

interface StudentPayment {
  id: string;
  user_id: string;
  full_name: string;
  plan: PlanType;
  is_trial_active: boolean;
  trial_ends_at: string | null;
  is_paid: boolean;
  token_allowance: number;
  tokens_used_this_month: number;
  updated_at: string;
}

const PLAN_TOKEN_ALLOWANCES: Record<PlanType, number> = {
  BASIC: 50,
  PRO: 200,
  ELITE: 1000,
};

const PLAN_NAMES: Record<PlanType, string> = {
  BASIC: "Básico",
  PRO: "Pro",
  ELITE: "Elite",
};

export function PaymentManagement() {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('id, user_id, full_name, plan, is_trial_active, trial_ends_at, is_paid, token_allowance, tokens_used_this_month, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents((data || []) as StudentPayment[]);
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

  useEffect(() => {
    fetchStudents();
  }, []);

  const activateSubscription = async (student: StudentPayment) => {
    setUpdating(student.user_id);
    try {
      const newAllowance = PLAN_TOKEN_ALLOWANCES[student.plan];
      
      const { error } = await supabase
        .from('student_profiles')
        .update({
          is_paid: true,
          is_trial_active: false,
          token_allowance: newAllowance,
          tokens_used_this_month: 0,
          billing_cycle_start: new Date().toISOString().split('T')[0],
          token_reset_date: new Date().toISOString().split('T')[0],
        })
        .eq('user_id', student.user_id);

      if (error) throw error;

      toast({
        title: "¡Suscripción activada!",
        description: `${student.full_name} ahora tiene acceso completo al plan ${PLAN_NAMES[student.plan]}.`,
      });

      fetchStudents();
    } catch (err) {
      console.error('Error activating subscription:', err);
      toast({
        title: "Error",
        description: "No se pudo activar la suscripción",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const updatePlan = async (student: StudentPayment, newPlan: PlanType) => {
    setUpdating(student.user_id);
    try {
      const updates: any = { plan: newPlan };
      
      // If paid, update token allowance to match new plan
      if (student.is_paid) {
        updates.token_allowance = PLAN_TOKEN_ALLOWANCES[newPlan];
      }

      const { error } = await supabase
        .from('student_profiles')
        .update(updates)
        .eq('user_id', student.user_id);

      if (error) throw error;

      toast({
        title: "Plan actualizado",
        description: `${student.full_name} ahora tiene el plan ${PLAN_NAMES[newPlan]}.`,
      });

      fetchStudents();
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

  const togglePaidStatus = async (student: StudentPayment) => {
    setUpdating(student.user_id);
    try {
      const newPaidStatus = !student.is_paid;
      const updates: any = {
        is_paid: newPaidStatus,
        is_trial_active: newPaidStatus ? false : student.is_trial_active,
      };

      if (newPaidStatus) {
        updates.token_allowance = PLAN_TOKEN_ALLOWANCES[student.plan];
        updates.tokens_used_this_month = 0;
        updates.billing_cycle_start = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('student_profiles')
        .update(updates)
        .eq('user_id', student.user_id);

      if (error) throw error;

      toast({
        title: newPaidStatus ? "Pago activado" : "Pago desactivado",
        description: `${student.full_name} ${newPaidStatus ? "ahora tiene acceso completo" : "requiere pago"}.`,
      });

      fetchStudents();
    } catch (err) {
      console.error('Error toggling payment status:', err);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de pago",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const getTrialStatus = (student: StudentPayment) => {
    if (student.is_paid) {
      return { label: "Pagado", variant: "default" as const, icon: CheckCircle };
    }
    if (!student.trial_ends_at) {
      return { label: "Sin prueba", variant: "secondary" as const, icon: Clock };
    }
    
    const now = new Date();
    const trialEnd = new Date(student.trial_ends_at);
    const daysLeft = differenceInDays(trialEnd, now);
    
    if (daysLeft < 0) {
      return { label: "Prueba vencida", variant: "destructive" as const, icon: AlertTriangle };
    }
    if (daysLeft === 0) {
      return { label: "Vence hoy", variant: "destructive" as const, icon: AlertTriangle };
    }
    return { label: `${daysLeft} días`, variant: "secondary" as const, icon: Clock };
  };

  // Students with expired trials that need follow-up
  const expiredTrials = students.filter(s => {
    if (s.is_paid) return false;
    if (!s.trial_ends_at) return false;
    const daysAgo = differenceInDays(new Date(), new Date(s.trial_ends_at));
    return daysAgo >= 0 && daysAgo <= 3;
  });

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertas de Cobro */}
      {expiredTrials.length > 0 && (
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-foreground">Alertas de Cobro</CardTitle>
                <CardDescription>
                  Estudiantes con prueba vencida en los últimos 3 días
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiredTrials.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
                >
                  <div>
                    <p className="font-medium text-foreground">{student.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Plan {PLAN_NAMES[student.plan]} • Venció{" "}
                      {student.trial_ends_at
                        ? format(new Date(student.trial_ends_at), "d MMM", { locale: es })
                        : "N/A"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => activateSubscription(student)}
                    disabled={updating === student.user_id}
                  >
                    {updating === student.user_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Activar"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main payment management table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-foreground">Gestión de Pagos</CardTitle>
                <CardDescription>
                  Administra suscripciones y estados de pago
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchStudents}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay estudiantes registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Estado Prueba</TableHead>
                    <TableHead>Pagado</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const trialStatus = getTrialStatus(student);
                    const StatusIcon = trialStatus.icon;
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Actualizado: {format(new Date(student.updated_at), "d MMM HH:mm", { locale: es })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={student.plan}
                            onValueChange={(value) => updatePlan(student, value as PlanType)}
                            disabled={updating === student.user_id}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BASIC">Básico</SelectItem>
                              <SelectItem value="PRO">Pro</SelectItem>
                              <SelectItem value="ELITE">Elite</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={trialStatus.variant} className="gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {trialStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={student.is_paid}
                            onCheckedChange={() => togglePaidStatus(student)}
                            disabled={updating === student.user_id}
                          />
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {student.tokens_used_this_month}/{student.token_allowance}
                          </span>
                        </TableCell>
                        <TableCell>
                          {!student.is_paid && (
                            <Button
                              size="sm"
                              onClick={() => activateSubscription(student)}
                              disabled={updating === student.user_id}
                            >
                              {updating === student.user_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Activar Suscripción"
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
