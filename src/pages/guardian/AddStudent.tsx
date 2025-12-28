import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { GuardianSidebar } from '@/components/layout/GuardianSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCreateStudent } from '@/hooks/useCreateStudent';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { ArrowLeft, CheckCircle2, Loader2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { EducationLevel } from '@/types/guardian';

const studentSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre es muy largo'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  level: z.enum(['PRIMARY', 'HIGHSCHOOL'], { required_error: 'Selecciona el nivel educativo' })
});

type FormData = z.infer<typeof studentSchema>;

export default function AddStudent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createStudent = useCreateStudent();
  
  const [formData, setFormData] = useState<Partial<FormData>>({
    full_name: '',
    email: '',
    password: '',
    level: undefined
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [successData, setSuccessData] = useState<{ email: string; password: string } | null>(null);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const result = studentSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof FormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      const response = await createStudent.mutateAsync({
        full_name: result.data.full_name,
        email: result.data.email,
        password: result.data.password,
        level: result.data.level as EducationLevel
      });

      setSuccessData({
        email: response.email,
        password: response.password
      });

      toast({
        title: 'Estudiante creado',
        description: `${result.data.full_name} ha sido registrado exitosamente.`
      });

      // Redirect after showing success for a moment
      setTimeout(() => {
        navigate('/guardian/my-students');
      }, 5000);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear el estudiante';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    }
  };

  // Success state
  if (successData) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <GuardianSidebar />
          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-xl mx-auto">
              <Card className="border-green-500/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <CardTitle className="text-green-600">¡Estudiante Creado!</CardTitle>
                      <CardDescription>Guarda estas credenciales de acceso</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertTitle>Credenciales de acceso</AlertTitle>
                    <AlertDescription className="mt-2 space-y-2">
                      <p><strong>Correo:</strong> {successData.email}</p>
                      <p><strong>Contraseña:</strong> {successData.password}</p>
                    </AlertDescription>
                  </Alert>
                  <p className="text-sm text-muted-foreground">
                    Comparte estas credenciales con el estudiante para que pueda iniciar sesión. 
                    Serás redirigido automáticamente en unos segundos.
                  </p>
                  <Button asChild className="w-full">
                    <Link to="/guardian/my-students">
                      Ver mis estudiantes
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <GuardianSidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-xl mx-auto">
            {/* Back link */}
            <Link 
              to="/guardian/my-students" 
              className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a mis estudiantes
            </Link>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Agregar Estudiante</CardTitle>
                    <CardDescription>
                      Crea una cuenta para un estudiante bajo tu cuidado
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nombre completo</Label>
                    <Input
                      id="full_name"
                      placeholder="Juan Pérez"
                      value={formData.full_name || ''}
                      onChange={(e) => handleChange('full_name', e.target.value)}
                      className={errors.full_name ? 'border-destructive' : ''}
                    />
                    {errors.full_name && (
                      <p className="text-sm text-destructive">{errors.full_name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="estudiante@email.com"
                      value={formData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña temporal</Label>
                    <Input
                      id="password"
                      type="text"
                      placeholder="Mínimo 8 caracteres"
                      value={formData.password || ''}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className={errors.password ? 'border-destructive' : ''}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      El estudiante podrá cambiar esta contraseña después de iniciar sesión.
                    </p>
                  </div>

                  {/* Level */}
                  <div className="space-y-2">
                    <Label htmlFor="level">Nivel educativo</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) => handleChange('level', value)}
                    >
                      <SelectTrigger className={errors.level ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Selecciona el nivel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRIMARY">Primaria (1° - 5°)</SelectItem>
                        <SelectItem value="HIGHSCHOOL">Bachillerato (6° - 11°)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.level && (
                      <p className="text-sm text-destructive">{errors.level}</p>
                    )}
                  </div>

                  {/* Submit */}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createStudent.isPending}
                  >
                    {createStudent.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Crear Estudiante
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
