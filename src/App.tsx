import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppModeProvider } from "@/contexts/AppModeContext";
import { RoleGuard } from "@/components/auth/RoleGuard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import StudentSettings from "./pages/StudentSettings";
import TutorPrimary from "./pages/TutorPrimary";
import TutorHighschool from "./pages/TutorHighschool";
import TutoriaInteligente from "./pages/TutoriaInteligente";
import Repositorio from "./pages/Repositorio";
import CareerPathfinder from "./pages/CareerPathfinder";
import Flashcards from "./pages/Flashcards";
import Arena from "./pages/Arena";
import TiendaNova from "./pages/TiendaNova";
import IcfesDashboard from "./pages/IcfesDashboard";
import IcfesEntrenador from "./pages/IcfesEntrenador";
import PanelControl from "./pages/PanelControl";
import Admin from "./pages/Admin";
import AdminTutorSessions from "./pages/AdminTutorSessions";
import Pricing from "./pages/Pricing";
import SubscriptionPricing from "./pages/SubscriptionPricing";
import SelectPlan from "./pages/SelectPlan";
import TrialEnded from "./pages/TrialEnded";
import NotFound from "./pages/NotFound";
// Research Feature
import ResearchCenter from "./pages/tool-research/ResearchCenter";
// Guardian pages
import MyStudents from "./pages/guardian/MyStudents";
import AddStudent from "./pages/guardian/AddStudent";
import StudentProgress from "./pages/guardian/StudentProgress";
// Admin guardian management
import GuardianManagement from "./pages/admin/GuardianManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppModeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Marketing */}
            <Route path="/" element={<Index />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/plans" element={<SubscriptionPricing />} />

            {/* Auth routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/app/onboarding" element={<Onboarding />} />
            <Route path="/app/select-plan" element={<SelectPlan />} />
            <Route path="/app/trial-ended" element={<TrialEnded />} />

            {/* Student-only routes */}
            <Route path="/app/dashboard" element={
              <RoleGuard allowedRoles={["student"]}>
                <Dashboard />
              </RoleGuard>
            } />
            <Route path="/app/settings" element={
              <RoleGuard allowedRoles={["student"]}>
                <StudentSettings />
              </RoleGuard>
            } />
            <Route path="/app/tutor-ia/primary" element={
              <RoleGuard allowedRoles={["student"]}>
                <TutorPrimary />
              </RoleGuard>
            } />
            <Route path="/app/tutor-ia/highschool" element={
              <RoleGuard allowedRoles={["student"]}>
                <TutorHighschool />
              </RoleGuard>
            } />
            <Route path="/app/tutoria-inteligente" element={
              <RoleGuard allowedRoles={["student"]}>
                <TutoriaInteligente />
              </RoleGuard>
            } />
            <Route path="/app/repositorio" element={
              <RoleGuard allowedRoles={["student"]}>
                <Repositorio />
              </RoleGuard>
            } />
            <Route path="/app/career-pathfinder" element={
              <RoleGuard allowedRoles={["student"]}>
                <CareerPathfinder />
              </RoleGuard>
            } />
            <Route path="/app/flashcards" element={
              <RoleGuard allowedRoles={["student"]}>
                <Flashcards />
              </RoleGuard>
            } />
            <Route path="/app/arena" element={
              <RoleGuard allowedRoles={["student"]}>
                <Arena />
              </RoleGuard>
            } />
            <Route path="/app/tienda-nova" element={
              <RoleGuard allowedRoles={["student"]}>
                <TiendaNova />
              </RoleGuard>
            } />
            <Route path="/app/icfes" element={
              <RoleGuard allowedRoles={["student"]}>
                <IcfesDashboard />
              </RoleGuard>
            } />
            <Route path="/app/icfes/entrenador" element={
              <RoleGuard allowedRoles={["student"]}>
                <IcfesEntrenador />
              </RoleGuard>
            } />
            {/* Research Center */}
            <Route path="/app/research" element={
              <RoleGuard allowedRoles={["student"]}>
                <ResearchCenter />
              </RoleGuard>
            } />

            {/* Admin & shared routes */}
            <Route path="/app/panel-control" element={
              <RoleGuard allowedRoles={["admin", "student"]}>
                <PanelControl />
              </RoleGuard>
            } />
            <Route path="/app/admin" element={
              <RoleGuard allowedRoles={["admin"]}>
                <Admin />
              </RoleGuard>
            } />
            <Route path="/app/admin/tutor-sessions" element={
              <RoleGuard allowedRoles={["admin"]}>
                <AdminTutorSessions />
              </RoleGuard>
            } />

            {/* Legacy admin routes */}
            <Route path="/admin" element={
              <RoleGuard allowedRoles={["admin"]}>
                <Admin />
              </RoleGuard>
            } />
            <Route path="/admin/tutor-sessions" element={
              <RoleGuard allowedRoles={["admin"]}>
                <AdminTutorSessions />
              </RoleGuard>
            } />

            {/* Guardian routes */}
            <Route path="/guardian/my-students" element={
              <RoleGuard allowedRoles={["guardian"]}>
                <MyStudents />
              </RoleGuard>
            } />
            <Route path="/guardian/add-student" element={
              <RoleGuard allowedRoles={["guardian"]}>
                <AddStudent />
              </RoleGuard>
            } />
            <Route path="/guardian/student/:id/progress" element={
              <RoleGuard allowedRoles={["guardian"]}>
                <StudentProgress />
              </RoleGuard>
            } />

            {/* Admin guardian management */}
            <Route path="/app/admin/guardian-management" element={
              <RoleGuard allowedRoles={["admin"]}>
                <GuardianManagement />
              </RoleGuard>
            } />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppModeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
