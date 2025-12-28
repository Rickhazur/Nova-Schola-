import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Minus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AdjustCoinsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  mode: 'add' | 'subtract';
  onSuccess: () => void;
}

export const AdjustCoinsModal = ({ open, onOpenChange, studentId, mode, onSuccess }: AdjustCoinsModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    try {
      const coinAmount = mode === 'add' ? Math.abs(parseInt(amount)) : -Math.abs(parseInt(amount));

      // Create transaction
      const { error: txError } = await supabase
        .from('coin_transactions')
        .insert({
          student_id: studentId,
          amount: coinAmount,
          type: mode === 'add' ? 'earn' : 'adjust',
          reason: reason || (mode === 'add' ? 'Ajuste positivo por admin' : 'Ajuste negativo por admin'),
          created_by_admin_id: user.id
        });

      if (txError) throw txError;

      // Update balance
      const { data: currentCoins } = await supabase
        .from('student_coins')
        .select('balance, total_earned, total_spent')
        .eq('student_id', studentId)
        .maybeSingle();

      const currentBalance = currentCoins?.balance || 0;
      const currentEarned = currentCoins?.total_earned || 0;
      const currentSpent = currentCoins?.total_spent || 0;

      const newBalance = Math.max(0, currentBalance + coinAmount);
      const newEarned = mode === 'add' ? currentEarned + Math.abs(coinAmount) : currentEarned;
      const newSpent = mode === 'subtract' ? currentSpent + Math.abs(coinAmount) : currentSpent;

      const { error: updateError } = await supabase
        .from('student_coins')
        .upsert({
          student_id: studentId,
          balance: newBalance,
          total_earned: newEarned,
          total_spent: newSpent
        }, { onConflict: 'student_id' });

      if (updateError) throw updateError;

      toast.success(mode === 'add' ? "Coins agregados" : "Coins ajustados");
      onSuccess();
      onOpenChange(false);
      setAmount("");
      setReason("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al ajustar coins";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'add' ? (
              <>
                <Plus className="w-5 h-5 text-green-500" />
                Dar Nova Coins
              </>
            ) : (
              <>
                <Minus className="w-5 h-5 text-red-500" />
                Quitar/Ajustar Coins
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Cantidad *</Label>
            <Input
              id="amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              required
            />
          </div>
          <div>
            <Label htmlFor="reason">Razón</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={mode === 'add' 
                ? "Ej: Completó 3 sesiones esta semana" 
                : "Ej: Ajuste por error anterior"
              }
              rows={2}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={loading}
              variant={mode === 'add' ? 'default' : 'destructive'}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === 'add' ? 'Dar Coins' : 'Quitar Coins'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};