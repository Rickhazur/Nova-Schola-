import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Copy, CheckCircle } from "lucide-react";

interface EnrollStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EnrollStudentModal = ({ open, onOpenChange, onSuccess }: EnrollStudentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    grade_level: "",
    guardian_name: "",
    guardian_whatsapp: "",
    plan: "BASIC"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-enroll-student', {
        body: formData
      });

      if (error) throw error;

      if (data.success) {
        setTempPassword(data.temp_password);
        toast.success("Estudiante inscrito correctamente");
        onSuccess();
      } else {
        throw new Error(data.error || "Error al inscribir estudiante");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setTempPassword(null);
    setFormData({
      full_name: "",
      email: "",
      grade_level: "",
      guardian_name: "",
      guardian_whatsapp: "",
      plan: "BASIC"
    });
    onOpenChange(false);
  };

  if (tempPassword) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-500">
              <CheckCircle className="w-5 h-5" />
              Estudiante Inscrito
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              El estudiante ha sido creado. Comparte la contraseña temporal con la familia:
            </p>
            <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
              <code className="flex-1 font-mono text-lg">{tempPassword}</code>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              El estudiante deberá cambiar esta contraseña en su primer inicio de sesión.
            </p>
            <Button className="w-full" onClick={handleClose}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Inscribir Nuevo Estudiante</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="full_name">Nombre completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="email">Correo electrónico *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="grade_level">Grado / Nivel</Label>
              <Select
                value={formData.grade_level}
                onValueChange={(value) => setFormData(prev => ({ ...prev, grade_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(grade => (
                    <SelectItem key={grade} value={grade.toString()}>
                      {grade <= 5 ? `${grade}° Primaria` : `${grade}° Secundaria`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="plan">Plan inicial</Label>
              <Select
                value={formData.plan}
                onValueChange={(value) => setFormData(prev => ({ ...prev, plan: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASIC">Básico</SelectItem>
                  <SelectItem value="PRO">Pro</SelectItem>
                  <SelectItem value="ELITE">Elite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="guardian_name">Nombre del acudiente</Label>
              <Input
                id="guardian_name"
                value={formData.guardian_name}
                onChange={(e) => setFormData(prev => ({ ...prev, guardian_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="guardian_whatsapp">WhatsApp del acudiente</Label>
              <Input
                id="guardian_whatsapp"
                value={formData.guardian_whatsapp}
                onChange={(e) => setFormData(prev => ({ ...prev, guardian_whatsapp: e.target.value }))}
                placeholder="+57 300 123 4567"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Inscribir
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};