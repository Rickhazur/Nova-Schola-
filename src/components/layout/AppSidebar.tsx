import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Brain,
  FolderOpen,
  Compass,
  Layers,
  Trophy,
  Store,
  Settings,
  MessageCircle,
  GraduationCap,
  Home,
  Shield,
  Users,
  CreditCard,
  BarChart3,
  Target,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

// Student menu items
const studentMenuItems = [
  { title: "Dashboard", url: "/app/dashboard", icon: Home },
  { title: "Tutoría Inteligente", url: "/app/tutoria-inteligente", icon: Brain },
  { title: "Mi Repositorio", url: "/app/repositorio", icon: FolderOpen },
  { title: "Career Pathfinder", url: "/app/career-pathfinder", icon: Compass },
  { title: "AI Flashcards", url: "/app/flashcards", icon: Layers },
  { title: "Arena & Ranking", url: "/app/arena", icon: Trophy },
  { title: "Preparación ICFES", url: "/app/icfes", icon: Target },
  { title: "Centro de Investigación", url: "/app/research", icon: Library },
  { title: "Tienda Nova", url: "/app/tienda-nova", icon: Store },
];

// Admin menu items
const adminMenuItems = [
  { title: "Panel de Control", url: "/app/panel-control", icon: Settings },
  { title: "Gestión Acudientes", url: "/app/admin/guardian-management", icon: Users },
  { title: "Gestión de Pagos", url: "/app/panel-control?tab=payments", icon: CreditCard },
  { title: "Sesiones de Tutoría", url: "/app/admin/tutor-sessions", icon: MessageCircle },
  { title: "Analíticas", url: "/app/admin", icon: BarChart3 },
];

const studentAssistantItem = { title: "Asistente 24/7", url: "/app/tutor-ia/highschool", icon: MessageCircle };

export function AppSidebar() {
  const location = useLocation();
  const { role, profile, user } = useAuth();

  const isAdmin = role === "admin";
  const menuItems = isAdmin ? adminMenuItems : studentMenuItems;

  const planLabels = {
    BASIC: "Básico",
    PRO: "Pro",
    ELITE: "Elite",
  };

  return (
    <Sidebar className="border-r border-border bg-sidebar">
      <SidebarHeader className="p-4 border-b border-border">
        <Link to={isAdmin ? "/app/panel-control" : "/app/dashboard"} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">Nova Schola</h1>
            <p className="text-xs text-muted-foreground">AI Academy</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
            {isAdmin ? "Administración" : "Módulos"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive =
                  location.pathname === item.url ||
                  (item.url.includes("?") && location.pathname + location.search === item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.url}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted",
                        )}
                      >
                        <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Only show support section for students */}
        {!isAdmin && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
              Soporte
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to={studentAssistantItem.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        location.pathname.includes("/tutor-ia")
                          ? "bg-accent/10 text-accent border border-accent/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      <studentAssistantItem.icon className="w-5 h-5" />
                      <span className="font-medium">{studentAssistantItem.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              isAdmin ? "bg-primary/20" : "bg-gradient-primary",
            )}
          >
            {isAdmin ? (
              <Shield className="w-4 h-4 text-primary" />
            ) : (
              <span className="text-xs font-bold text-primary-foreground">NS</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.full_name || user?.email?.split("@")[0] || (isAdmin ? "Administrador" : "Estudiante")}
            </p>
            {isAdmin ? (
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                Administrador
              </Badge>
            ) : (
              <p className="text-xs text-muted-foreground truncate">Plan {planLabels[profile?.plan || "BASIC"]}</p>
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
