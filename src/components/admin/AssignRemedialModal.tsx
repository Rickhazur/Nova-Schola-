import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface RemedialTemplate {
  id: string;
  name: string;
  subject: string;
  level: string;
  default_duration_weeks: number;
}

interface AssignRemedialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  onSuccess: () => void;
}

export const AssignRemedialModal = ({ open, onOpenChange, studentId, onSuccess }: AssignRemedialModalProps) => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<RemedialTemplate[]>([]);
  const [formData, setFormData] = useState({
    program_id: "",
    custom_title: "",
    goals: "",
    start_date: new Date().toISOString().split('T')[0],
    duration_weeks: 4
  });

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from('remedial_programs')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    setTemplates(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (formData.duration_weeks * 7));

      const selectedTemplate = templates.find(t => t.id === formData.program_id);

      const { error } = await supabase
        .from('student_remedial_programs')
        .insert({
          student_id: studentId,
          program_id: formData.program_id || null,
          custom_title: formData.custom_title || (selectedTemplate?.name || null),
          goals: formData.goals,
          start_date: formData.start_date,
          end_date: endDate.toISOString().split('T')[0],
          status: 'active'
        });

      if (error) throw error;

      toast.success("Programa asignado correctamente");
      onSuccess();
      onOpenChange(false);
      setFormData({
        program_id: "",
        custom_title: "",
        goals: "",
        start_date: new Date().toISOString().split('T')[0],
        duration_weeks: 4
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al asignar programa";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === formData.program_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Asignar Programa de Refuerzo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Plantilla de programa (opcional)</Label>
            <Select
              value={formData.program_id}
              onValueChange={(value) => {
                const template = templates.find(t => t.id === value);
                setFormData(prev => ({
                  ...prev,
                  program_id: value,
                  duration_weeks: template?.default_duration_weeks || prev.duration_weeks
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar plantilla o crear personalizado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Programa personalizado</SelectItem>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({template.subject})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!formData.program_id && (
            <div>
              <Label htmlFor="custom_title">Título del programa *</Label>
              <Input
                id="custom_title"
                value={formData.custom_title}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_title: e.target.value }))}
                placeholder="Ej: Refuerzo Matemáticas 4 semanas"
                required={!formData.program_id}
              />
            </div>
          )}

          <div>
            <Label htmlFor="goals">Objetivos de aprendizaje</Label>
            <Textarea
              id="goals"
              value={formData.goals}
              onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
              placeholder="Describe los objetivos diagnósticos y metas de aprendizaje..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Fecha de inicio</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="duration">Duración (semanas)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                max={52}
                value={formData.duration_weeks}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_weeks: parseInt(e.target.value) || 4 }))}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Asignar Programa
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};