import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAppMode } from "@/contexts/AppModeContext";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Baby, GraduationCap, Coins, User, LogOut, Settings, Shield } from "lucide-react";

export function AppHeader() {
  const navigate = useNavigate();
  const { mode, toggleMode } = useAppMode();
  const { profile, role, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = profile?.full_name?.split(" ")[0] || "Usuario";

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      </div>

      <div className="flex items-center gap-4">
        {/* Admin badge */}
        {role === "admin" && (
          <Badge variant="outline" className="gap-1.5 border-primary/50 bg-primary/10 text-primary">
            <Shield className="w-3.5 h-3.5" />
            Administrador
          </Badge>
        )}

        {/* Coins display - only for students */}
        {role !== "admin" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20">
            <Coins className="w-4 h-4 text-gold" />
            <span className="text-sm font-semibold text-gold">1,250</span>
          </div>
        )}

        {/* Mode toggle - only for students */}
        {role !== "admin" && (
          <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Baby className={`w-4 h-4 transition-colors ${mode === "kids" ? "text-accent" : "text-muted-foreground"}`} />
            <span className={`text-xs font-medium ${mode === "kids" ? "text-accent" : "text-muted-foreground"}`}>
              Kids
            </span>
          </div>
          <Switch
            checked={mode === "teen"}
            onCheckedChange={toggleMode}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-accent"
          />
          <div className="flex items-center gap-2">
            <GraduationCap className={`w-4 h-4 transition-colors ${mode === "teen" ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-xs font-medium ${mode === "teen" ? "text-primary" : "text-muted-foreground"}`}>
              Teen
            </span>
          </div>
        </div>
        )}

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="hidden sm:inline text-sm font-medium">{displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/app/panel-control")}>
              <Settings className="w-4 h-4 mr-2" />
              {role === "admin" ? "Panel Admin" : "Configuración"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
