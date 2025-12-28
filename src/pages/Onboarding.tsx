import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Loader2, Rocket, GraduationCap, Phone, User, Calendar } from "lucide-react";
import { z } from "zod";

const onboardingSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  gradeLevel: z.number().min(1).max(12),
  age: z.number().min(5).max(25),
  guardianWhatsapp: z.string().regex(/^\+?[0-9]{10,15}$/, "Número de WhatsApp inválido").optional().or(z.literal("")),
});

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading, updateProfile, role } = useAuth();

  const [fullName, setFullName] = useState("");
  const [gradeLevel, setGradeLevel] = useState<number | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [guardianWhatsapp, setGuardianWhatsapp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const preferredLanguage = profile?.preferred_language || "es";

  const t = {
    es: {
      title: "¡Bienvenido a Nova Schola!",
      subtitle: "Cuéntanos un poco sobre ti para personalizar tu experiencia",
      fullName: "Nombre completo",
      gradeLevel: "Grado escolar",
      age: "Edad",
      guardianWhatsapp: "WhatsApp del acudiente (opcional)",
      whatsappHint: "Ej: +57 300 123 4567",
      selectGrade: "Selecciona tu grado",
      continue: "Continuar",
      step1: "Perfil",
      step2: "Preferencias",
      step3: "¡Listo!",
      primary: "Primaria",
      highSchool: "Bachillerato",
      gradePrefix: "Grado",
      success: "¡Perfil completado!",
      successDesc: "Tu experiencia ha sido personalizada",
      error: "Error al guardar",
    },
    en: {
      title: "Welcome to Nova Schola!",
      subtitle: "Tell us a bit about yourself to personalize your experience",
      fullName: "Full name",
      gradeLevel: "Grade level",
      age: "Age",
      guardianWhatsapp: "Guardian's WhatsApp (optional)",
      whatsappHint: "Ex: +1 555 123 4567",
      selectGrade: "Select your grade",
      continue: "Continue",
      step1: "Profile",
      step2: "Preferences",
      step3: "Ready!",
      primary: "Elementary",
      highSchool: "High School",
      gradePrefix: "Grade",
      success: "Profile completed!",
      successDesc: "Your experience has been personalized",
      error: "Error saving",
    },
  };

  const text = t[preferredLanguage as "es" | "en"] || t.es;

  // Redirect if not logged in or not a student
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (role === "admin") {
        navigate("/app/panel-control");
      } else if (profile?.onboarding_completed) {
        navigate("/app/dashboard");
      } else if (profile) {
        // Pre-fill form with existing data
        setFullName(profile.full_name || "");
        setGradeLevel(profile.grade_level);
        setAge(profile.age);
        setGuardianWhatsapp(profile.guardian_whatsapp || "");
      }
    }
  }, [user, role, profile, loading, navigate]);

  const validateForm = () => {
    try {
      onboardingSchema.parse({
        fullName,
        gradeLevel,
        age,
        guardianWhatsapp: guardianWhatsapp || "",
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    const { error } = await updateProfile({
      full_name: fullName,
      grade_level: gradeLevel,
      age: age,
      guardian_whatsapp: guardianWhatsapp || null,
      onboarding_completed: true,
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: text.error,
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: text.success,
        description: text.successDesc,
      });
      navigate("/app/dashboard");
    }
  };

  const isPrimary = gradeLevel !== null && gradeLevel <= 5;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary">
              <BookOpen className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{text.title}</h1>
          <p className="text-muted-foreground">{text.subtitle}</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">1</div>
            <span className="text-sm font-medium">{text.step1}</span>
          </div>
          <div className="w-8 h-0.5 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm">2</div>
            <span className="text-sm text-muted-foreground">{text.step2}</span>
          </div>
          <div className="w-8 h-0.5 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm">3</div>
            <span className="text-sm text-muted-foreground">{text.step3}</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-card rounded-2xl border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {text.fullName}
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={errors.fullName ? "border-destructive" : ""}
                placeholder="Juan Pérez"
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>

            {/* Grade Level */}
            <div className="space-y-2">
              <Label htmlFor="gradeLevel" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                {text.gradeLevel}
              </Label>
              <Select
                value={gradeLevel?.toString() || ""}
                onValueChange={(v) => setGradeLevel(parseInt(v))}
              >
                <SelectTrigger className={errors.gradeLevel ? "border-destructive" : ""}>
                  <SelectValue placeholder={text.selectGrade} />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                    {text.primary}
                  </div>
                  {[1, 2, 3, 4, 5].map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      {text.gradePrefix} {grade}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground mt-2">
                    {text.highSchool}
                  </div>
                  {[6, 7, 8, 9, 10, 11].map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      {text.gradePrefix} {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {gradeLevel && (
                <p className="text-sm text-muted-foreground">
                  {isPrimary ? `🎨 ${text.primary}` : `📚 ${text.highSchool}`}
                </p>
              )}
              {errors.gradeLevel && (
                <p className="text-sm text-destructive">{errors.gradeLevel}</p>
              )}
            </div>

            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {text.age}
              </Label>
              <Input
                id="age"
                type="number"
                min={5}
                max={25}
                value={age || ""}
                onChange={(e) => setAge(parseInt(e.target.value) || null)}
                className={errors.age ? "border-destructive" : ""}
              />
              {errors.age && (
                <p className="text-sm text-destructive">{errors.age}</p>
              )}
            </div>

            {/* Guardian WhatsApp */}
            <div className="space-y-2">
              <Label htmlFor="guardianWhatsapp" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {text.guardianWhatsapp}
              </Label>
              <Input
                id="guardianWhatsapp"
                type="tel"
                value={guardianWhatsapp}
                onChange={(e) => setGuardianWhatsapp(e.target.value)}
                className={errors.guardianWhatsapp ? "border-destructive" : ""}
                placeholder={text.whatsappHint}
              />
              {errors.guardianWhatsapp && (
                <p className="text-sm text-destructive">{errors.guardianWhatsapp}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base gap-2"
              variant="orange"
              disabled={isSubmitting || !gradeLevel || !age}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Rocket className="h-5 w-5" />
                  {text.continue}
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
