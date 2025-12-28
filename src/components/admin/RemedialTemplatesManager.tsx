import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface RemedialProgram {
  id: string;
  name: string;
  subject: string;
  level: string;
  description: string | null;
  default_duration_weeks: number;
  is_active: boolean;
}

export const RemedialTemplatesManager = () => {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<RemedialProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<RemedialProgram | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "Matemáticas",
    level: "Primaria",
    description: "",
    default_duration_weeks: "4",
    is_active: true
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('remedial_programs')
      .select('*')
      .order('name');
    setPrograms(data || []);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const programData = {
        name: formData.name,
        subject: formData.subject,
        level: formData.level,
        description: formData.description || null,
        default_duration_weeks: parseInt(formData.default_duration_weeks),
        is_active: formData.is_active,
        created_by: user.id
      };

      if (editingProgram) {
        const { error } = await supabase
          .from('remedial_programs')
          .update(programData)
          .eq('id', editingProgram.id);
        if (error) throw error;
        toast.success("Plantilla actualizada");
      } else {
        const { error } = await supabase
          .from('remedial_programs')
          .insert(programData);
        if (error) throw error;
        toast.success("Plantilla creada");
      }

      setShowModal(false);
      setEditingProgram(null);
      resetForm();
      fetchPrograms();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al guardar";
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta plantilla?")) return;

    const { error } = await supabase.from('remedial_programs').delete().eq('id', id);
    if (error) {
      toast.error("Error al eliminar");
    } else {
      toast.success("Plantilla eliminada");
      fetchPrograms();
    }
  };

  const openEditModal = (program: RemedialProgram) => {
    setEditingProgram(program);
    setFormData({
      name: program.name,
      subject: program.subject,
      level: program.level,
      description: program.description || "",
      default_duration_weeks: program.default_duration_weeks.toString(),
      is_active: program.is_active
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      subject: "Matemáticas",
      level: "Primaria",
      description: "",
      default_duration_weeks: "4",
      is_active: true
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Plantillas de Programas de Refuerzo
            </CardTitle>
            <Button onClick={() => {
              setEditingProgram(null);
              resetForm();
              setShowModal(true);
            }}>
              <Plus className="w-4 h-4 mr-2" /> Nueva Plantilla
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : programs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay plantillas creadas</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Materia</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map(program => (
                  <TableRow key={program.id}>
                    <TableCell className="font-medium">{program.name}</TableCell>
                    <TableCell>{program.subject}</TableCell>
                    <TableCell>{program.level}</TableCell>
                    <TableCell>{program.default_duration_weeks} semanas</TableCell>
                    <TableCell>
                      <Badge variant={program.is_active ? "default" : "secondary"}>
                        {program.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditModal(program)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(program.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProgram ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Refuerzo Matemáticas Básico"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Materia</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Matemáticas">Matemáticas</SelectItem>
                    <SelectItem value="Física">Física</SelectItem>
                    <SelectItem value="Química">Química</SelectItem>
                    <SelectItem value="Lenguaje">Lenguaje</SelectItem>
                    <SelectItem value="Inglés">Inglés</SelectItem>
                    <SelectItem value="Ciencias">Ciencias</SelectItem>
                    <SelectItem value="Historia">Historia</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nivel</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primaria">Primaria</SelectItem>
                    <SelectItem value="Secundaria">Secundaria</SelectItem>
                    <SelectItem value="Todos">Todos los niveles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe el programa..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="duration">Duración por defecto (semanas)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                max={52}
                value={formData.default_duration_weeks}
                onChange={(e) => setFormData(prev => ({ ...prev, default_duration_weeks: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Activo</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {editingProgram ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};