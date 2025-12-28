import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, RotateCcw, Loader2 } from "lucide-react";

export const CycleResetCard = () => {
  const [showModal, setShowModal] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (confirmation !== "REINICIAR") {
      toast.error("Debes escribir REINICIAR para confirmar");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-cycle', {
        body: { confirmation: "REINICIAR" }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Ciclo reiniciado. ${data.reset_count} estudiantes actualizados.`);
        setShowModal(false);
        setConfirmation("");
      } else {
        throw new Error(data.error || "Error al reiniciar ciclo");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <RotateCcw className="w-5 h-5" />
            Reiniciar Ciclo Académico
          </CardTitle>
          <CardDescription>
            Esto pondrá en cero los Nova Coins de todos los estudiantes y archivará los programas de refuerzo activos. 
            Úsalo solo al inicio de un nuevo periodo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={() => setShowModal(true)}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Reiniciar desde cero
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Reinicio
            </DialogTitle>
            <DialogDescription>
              Esta acción es irreversible. Se resetearán los balances de Nova Coins de todos los estudiantes 
              y se archivarán todos los programas de refuerzo activos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
              <p className="text-sm font-medium text-destructive mb-2">
                Para confirmar, escribe REINICIAR:
              </p>
              <Input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
                placeholder="REINICIAR"
                className="font-mono"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => {
                  setShowModal(false);
                  setConfirmation("");
                }}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1" 
                onClick={handleReset}
                disabled={confirmation !== "REINICIAR" || loading}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar Reinicio
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};