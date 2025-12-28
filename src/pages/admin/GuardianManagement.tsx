import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAllStudentsWithGuardians, useGuardiansList, useAssignGuardian } from '@/hooks/useAssignGuardian';
import { useToast } from '@/hooks/use-toast';
import { gradeToLevel, levelLabels } from '@/types/guardian';
import { Search, UserCog, Users, X, Loader2 } from 'lucide-react';

type FilterType = 'all' | 'with' | 'without';

export default function GuardianManagement() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedGuardianId, setSelectedGuardianId] = useState<string>('');

  const { data: students, isLoading: loadingStudents } = useAllStudentsWithGuardians(filter, search);
  const { data: guardians, isLoading: loadingGuardians } = useGuardiansList();
  const assignGuardian = useAssignGuardian();

  const handleOpenModal = (student: any) => {
    setSelectedStudent(student);
    setSelectedGuardianId(student.guardian_id || '');
  };

  const handleCloseModal = () => {
    setSelectedStudent(null);
    setSelectedGuardianId('');
  };

  const handleSave = async () => {
    if (!selectedStudent) return;

    try {
      await assignGuardian.mutateAsync({
        studentId: selectedStudent.user_id,
        guardianId: selectedGuardianId || null
      });

      toast({
        title: 'Acudiente actualizado',
        description: selectedGuardianId 
          ? 'El acudiente ha sido asignado exitosamente.'
          : 'El acudiente ha sido removido exitosamente.'
      });

      handleCloseModal();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el acudiente.',
        variant: 'destructive'
      });
    }
  };

  const handleRemove = async () => {
    if (!selectedStudent) return;

    try {
      await assignGuardian.mutateAsync({
        studentId: selectedStudent.user_id,
        guardianId: null
      });

      toast({
        title: 'Acudiente removido',
        description: 'El estudiante ya no tiene acudiente asignado.'
      });

      handleCloseModal();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo remover el acudiente.',
        variant: 'destructive'
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <UserCog className="w-8 h-8 text-primary" />
                Gestión de Acudientes
              </h1>
              <p className="text-muted-foreground mt-1">
                Asigna o cambia acudientes a los estudiantes
              </p>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="with">Con acudiente</SelectItem>
                      <SelectItem value="without">Sin acudiente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Estudiantes
                </CardTitle>
                <CardDescription>
                  {students?.length || 0} estudiantes encontrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStudents ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : students?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron estudiantes
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Nivel</TableHead>
                          <TableHead>Acudiente</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students?.map((student) => {
                          const level = gradeToLevel(student.grade_level);
                          return (
                            <TableRow key={student.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{student.full_name}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {levelLabels[level]}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {student.guardian ? (
                                  <span className="text-foreground">
                                    {student.guardian.full_name}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground italic">
                                    Sin asignar
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenModal(student)}
                                >
                                  {student.guardian ? 'Cambiar' : 'Asignar'}
                                </Button>
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

            {/* Assignment Modal */}
            <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && handleCloseModal()}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Asignar acudiente a {selectedStudent?.full_name}
                  </DialogTitle>
                  <DialogDescription>
                    Selecciona el acudiente responsable de este estudiante.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                  {selectedStudent?.guardian && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Acudiente actual:</p>
                      <p className="font-medium">{selectedStudent.guardian.full_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedStudent.guardian.email}</p>
                    </div>
                  )}

                  <Select value={selectedGuardianId} onValueChange={setSelectedGuardianId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar acudiente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingGuardians ? (
                        <div className="p-2">
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        </div>
                      ) : guardians?.length === 0 ? (
                        <div className="p-2 text-center text-muted-foreground text-sm">
                          No hay acudientes registrados
                        </div>
                      ) : (
                        guardians?.map((guardian) => (
                          <SelectItem key={guardian.user_id} value={guardian.user_id}>
                            {guardian.full_name} ({guardian.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  {selectedStudent?.guardian && (
                    <Button
                      variant="destructive"
                      onClick={handleRemove}
                      disabled={assignGuardian.isPending}
                      className="w-full sm:w-auto"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remover Acudiente
                    </Button>
                  )}
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleCloseModal} className="flex-1">
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={assignGuardian.isPending || !selectedGuardianId}
                      className="flex-1"
                    >
                      {assignGuardian.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Guardar'
                      )}
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
