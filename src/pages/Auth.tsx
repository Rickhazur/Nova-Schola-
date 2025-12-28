import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Shield, Globe, Loader2, BookOpen, Eye, EyeOff, Gift, Sparkles, ArrowRight } from "lucide-react";
import { z } from "zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AccountType = "student" | "guardian";
type EducationLevel = "PRIMARY" | "HIGHSCHOOL";

const authSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  accountType: z.enum(["student", "guardian"]).optional(),
  educationLevel: z.enum(["PRIMARY", "HIGHSCHOOL"]).optional(),
});

interface SelectedPlan {
  id: 'BASIC' | 'PRO' | 'ELITE';
  tokenAllowance: number;
  trialTokens: number;
}

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, role, profile, signIn, signUp, loading } = useAuth();

  const [selectedRole, setSelectedRole] = useState<AppRole>("student");
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [isSignUp, setIsSignUp] = useState(searchParams.get('signup') === 'true');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [accountType, setAccountType] = useState<AccountType | "">("");
  const [educationLevel, setEducationLevel] = useState<EducationLevel | "">("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    fullName?: string;
    accountType?: string;
    educationLevel?: string;
  }>({});

  const t = {
    es: {
      title: "Nova Schola",
      subtitle: "Academia IA",
      tagline: "El futuro de la educación personalizada",
      student: "Estudiante",
      admin: "Administrativo",
      login: "Iniciar Sesión",
      signup: "Crear Cuenta",
      email: "Correo electrónico",
      password: "Contraseña",
      fullName: "Nombre completo",
      noAccount: "¿No tienes cuenta?",
      hasAccount: "¿Ya tienes cuenta?",
      createAccount: "Crear cuenta gratis",
      loginHere: "Inicia sesión aquí",
      welcome: "Bienvenido de vuelta",
      createNew: "Comienza tu viaje",
      studentDesc: "Tu tutor personal de IA está esperando",
      adminDesc: "Gestión institucional simplificada",
      guardianDesc: "Monitorea el progreso de tus hijos",
      loginSuccess: "¡Bienvenido de nuevo!",
      signupSuccess: "Cuenta creada exitosamente",
      error: "Error",
      accountType: "Tipo de cuenta",
      studentAccount: "Estudiante",
      guardianAccount: "Acudiente",
      educationLevel: "Nivel educativo",
      primary: "Primaria",
      highschool: "Bachillerato",
      selectAccountType: "Selecciona el tipo de cuenta",
      selectEducationLevel: "Selecciona el nivel educativo",
      accountTypeRequired: "Debes seleccionar un tipo de cuenta",
      educationLevelRequired: "Debes seleccionar el nivel educativo",
    },
    en: {
      title: "Nova Schola",
      subtitle: "AI Academy",
      tagline: "The future of personalized education",
      student: "Student",
      admin: "Administrative",
      login: "Log In",
      signup: "Sign Up",
      email: "Email address",
      password: "Password",
      fullName: "Full name",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      createAccount: "Create free account",
      loginHere: "Log in here",
      welcome: "Welcome back",
      createNew: "Start your journey",
      studentDesc: "Your personal AI tutor is waiting",
      adminDesc: "Simplified institutional management",
      guardianDesc: "Monitor your children's progress",
      loginSuccess: "Welcome back!",
      signupSuccess: "Account created successfully",
      error: "Error",
      accountType: "Account type",
      studentAccount: "Student",
      guardianAccount: "Guardian",
      educationLevel: "Education level",
      primary: "Primary",
      highschool: "High School",
      selectAccountType: "Select account type",
      selectEducationLevel: "Select education level",
      accountTypeRequired: "You must select an account type",
      educationLevelRequired: "You must select an education level",
    },
  };

  const text = t[language];

  // Load selected plan from localStorage (if coming from select-plan page)
  useEffect(() => {
    const storedPlan = localStorage.getItem('selectedPlan');
    if (storedPlan) {
      try {
        setSelectedPlan(JSON.parse(storedPlan));
      } catch (e) {
        console.error('Error parsing stored plan:', e);
      }
    }
  }, []);

  // Apply selected plan after successful signup with trial fields
  const applySelectedPlan = async (userId: string) => {
    if (!selectedPlan) return;

    try {
      // Wait a moment for the profile to be created by the trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 3);

      const { error } = await supabase
        .from('student_profiles')
        .update({
          plan: selectedPlan.id,
          token_allowance: selectedPlan.trialTokens, // Use trial limit (10/day)
          tokens_used_this_month: 0,
          token_reset_date: new Date().toISOString().split('T')[0],
          is_trial_active: true,
          trial_ends_at: trialEndsAt.toISOString(),
          is_paid: false,
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error applying plan:', error);
      } else {
        // Clear stored plan
        localStorage.removeItem('selectedPlan');
      }
    } catch (err) {
      console.error('Error applying selected plan:', err);
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user && role) {
      if (role === "admin") {
        navigate("/app/panel-control");
      } else if (role === "guardian") {
        navigate("/guardian/my-students");
      } else if (role === "student") {
        // If we have a selected plan, apply it first
        if (selectedPlan) {
          applySelectedPlan(user.id).then(() => {
            navigate("/app/onboarding");
          });
        } else if (profile?.onboarding_completed) {
          navigate("/app/dashboard");
        } else {
          navigate("/app/onboarding");
        }
      }
    }
  }, [user, role, profile, loading, navigate, selectedPlan]);

  // Reset education level when account type changes
  useEffect(() => {
    if (accountType !== "student") {
      setEducationLevel("");
    }
  }, [accountType]);

  const validateForm = () => {
    const fieldErrors: typeof errors = {};

    try {
      authSchema.parse({
        email,
        password,
        fullName: isSignUp ? fullName : undefined,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof typeof fieldErrors] = err.message;
          }
        });
      }
    }

    // Custom validation for signup
    if (isSignUp && selectedRole === "student") {
      if (!accountType) {
        fieldErrors.accountType = text.accountTypeRequired;
      }
      if (accountType === "student" && !educationLevel) {
        fieldErrors.educationLevel = text.educationLevelRequired;
      }
    }

    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        // Determine the role based on account type selection
        const roleToUse: AppRole = selectedRole === "student"
          ? (accountType === "guardian" ? "guardian" : "student")
          : "admin";

        // Convert education level to grade level for database
        const gradeLevel = educationLevel === "PRIMARY" ? 5 : educationLevel === "HIGHSCHOOL" ? 9 : undefined;

        const { error } = await signUp(email, password, roleToUse, fullName, language, gradeLevel);
        if (error) {
          toast({
            title: text.error,
            description: error.message,
            variant: "destructive",
          });
        } else {
          const description = roleToUse === "guardian"
            ? text.guardianDesc
            : roleToUse === "student"
              ? text.studentDesc
              : text.adminDesc;
          toast({
            title: text.signupSuccess,
            description,
          });
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: text.error,
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: text.loginSuccess,
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Left panel - Decorative & Brand */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-black items-center justify-center">
        {/* Complex Animated Background */}
        <div className="absolute inset-0 bg-[#0f172a]">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 animate-pulse delay-1000" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 px-12 text-center max-w-2xl">
          <div className="mb-8 flex justify-center">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-primary via-indigo-500 to-purple-600 shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)]">
              <BookOpen className="h-16 w-16 text-white" />
            </div>
          </div>

          <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-primary/50 to-white mb-6">
            {text.title}
          </h1>

          <p className="text-2xl text-slate-300 font-light tracking-wide mb-8">
            {text.tagline}
          </p>

          <div className="flex gap-4 justify-center">
            <div className="px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm text-slate-300">
              AI Powered
            </div>
            <div className="px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm text-slate-300">
              Personalized Learning
            </div>
            <div className="px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm text-slate-300">
              24/7 Access
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-16 bg-background relative">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-primary/10">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground">{text.title}</h1>
          </div>

          {/* Language Switcher */}
          <div className="absolute top-8 right-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "es" ? "en" : "es")}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Globe className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">{language}</span>
            </Button>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              {isSignUp ? text.createNew : text.welcome}
            </h2>
            <p className="text-muted-foreground">
              {selectedRole === "student"
                ? (accountType === "guardian" ? text.guardianDesc : text.studentDesc)
                : text.adminDesc}
            </p>
          </div>

          {/* Role Tabs */}
          <Tabs value={selectedRole} onValueChange={(v) => {
            setSelectedRole(v as AppRole);
            if (v === "admin") {
              setAccountType("");
              setEducationLevel("");
            }
          }} className="mb-8">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="student" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <GraduationCap className="h-4 w-4 mr-2" />
                {text.student}
              </TabsTrigger>
              <TabsTrigger value="admin" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Shield className="h-4 w-4 mr-2" />
                {text.admin}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">{text.fullName}</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`h-11 rounded-xl bg-muted/30 border-muted-foreground/20 focus:border-primary transition-all duration-300 ${errors.fullName ? "border-destructive bg-destructive/5" : ""}`}
                  placeholder="John Doe"
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive flex items-center mt-1"><Sparkles className="h-3 w-3 mr-1" /> {errors.fullName}</p>
                )}
              </div>
            )}

            {isSignUp && selectedRole === "student" && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`cursor-pointer relative overflow-hidden rounded-xl border-2 p-4 transition-all hover:border-primary/50 ${accountType === "student" ? "border-primary bg-primary/5" : "border-muted bg-muted/30"}`}
                    onClick={() => setAccountType("student")}
                  >
                    <div className="mb-2 text-2xl">👤</div>
                    <div className="font-semibold">{text.studentAccount}</div>
                    <div className="text-xs text-muted-foreground mt-1 leading-tight">{text.studentDesc}</div>
                  </div>

                  <div
                    className={`cursor-pointer relative overflow-hidden rounded-xl border-2 p-4 transition-all hover:border-primary/50 ${accountType === "guardian" ? "border-primary bg-primary/5" : "border-muted bg-muted/30"}`}
                    onClick={() => setAccountType("guardian")}
                  >
                    <div className="mb-2 text-2xl">👨‍👩‍👧</div>
                    <div className="font-semibold">{text.guardianAccount}</div>
                    <div className="text-xs text-muted-foreground mt-1 leading-tight">{text.guardianDesc}</div>
                  </div>
                </div>
                {errors.accountType && <p className="text-xs text-destructive">{errors.accountType}</p>}
              </div>
            )}

            {isSignUp && selectedRole === "student" && accountType === "student" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
                <Label htmlFor="educationLevel">{text.educationLevel}</Label>
                <Select value={educationLevel} onValueChange={(value) => setEducationLevel(value as EducationLevel)}>
                  <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-muted-foreground/20">
                    <SelectValue placeholder={text.selectEducationLevel} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIMARY">
                      <div className="flex items-center gap-2"><span>📚</span>{text.primary}</div>
                    </SelectItem>
                    <SelectItem value="HIGHSCHOOL">
                      <div className="flex items-center gap-2"><span>🎓</span>{text.highschool}</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.educationLevel && <p className="text-xs text-destructive">{errors.educationLevel}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{text.email}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-11 rounded-xl bg-muted/30 border-muted-foreground/20 focus:border-primary transition-all duration-300 ${errors.email ? "border-destructive bg-destructive/5" : ""}`}
                placeholder="name@example.com"
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{text.password}</Label>
                {!isSignUp && (
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                    ¿Olvidaste tu contraseña?
                  </Link>
                )}
              </div>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`h-11 pr-10 rounded-xl bg-muted/30 border-muted-foreground/20 focus:border-primary transition-all duration-300 ${errors.password ? "border-destructive bg-destructive/5" : ""}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
              size="lg"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {isSignUp ? text.signup : text.login}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {isSignUp ? text.hasAccount : text.noAccount}{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary hover:text-primary/80 font-semibold hover:underline transition-all"
              >
                {isSignUp ? text.loginHere : text.createAccount}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
