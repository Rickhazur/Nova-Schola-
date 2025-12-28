import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, PencilLine, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { TutorMode } from "./TutorModeTabs";

const WELCOME_STORAGE_KEY = "hasSeenTutorWelcome";

interface TutorWelcomeModalProps {
  onSelectMode: (mode: TutorMode) => void;
  isPrimary?: boolean;
}

export function TutorWelcomeModal({ onSelectMode, isPrimary = true }: TutorWelcomeModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(WELCOME_STORAGE_KEY);
    if (!hasSeenWelcome) {
      setOpen(true);
    }
  }, []);

  const handleSelect = (mode: TutorMode) => {
    localStorage.setItem(WELCOME_STORAGE_KEY, "true");
    setOpen(false);
    onSelectMode(mode);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className={cn("sm:max-w-lg", isPrimary && "bg-gradient-to-b from-amber-50 to-orange-50")}>
        <DialogHeader>
          <DialogTitle className={cn("text-2xl text-center flex items-center justify-center gap-2", isPrimary && "text-amber-900")}>
            <Sparkles className="w-6 h-6 text-amber-500" />
            ¡Bienvenido a Nova! 🎉
          </DialogTitle>
          <DialogDescription className={cn("text-center text-lg", isPrimary && "text-amber-700")}>
            ¿Cómo quieres empezar hoy?
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {/* Nova Problem Card */}
          <button
            onClick={() => handleSelect("nova-problem")}
            className={cn(
              "group relative p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-primary/30",
              isPrimary
                ? "bg-gradient-to-br from-amber-100 to-amber-200 border-amber-300 hover:border-amber-400 hover:shadow-lg"
                : "bg-gradient-to-br from-primary/10 to-primary/20 border-primary/30 hover:border-primary/50"
            )}
          >
            <div className={cn(
              "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
              isPrimary
                ? "bg-gradient-to-br from-amber-400 to-orange-500"
                : "bg-gradient-primary"
            )}>
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h3 className={cn("text-xl font-bold mb-2", isPrimary ? "text-amber-900" : "text-foreground")}>
              📚 Problema de Nova
            </h3>
            <p className={cn("text-sm", isPrimary ? "text-amber-700" : "text-muted-foreground")}>
              Nova te dará un problema para resolver y te guiará paso a paso
            </p>
          </button>

          {/* My Problem Card */}
          <button
            onClick={() => handleSelect("my-problem")}
            className={cn(
              "group relative p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-accent/30",
              isPrimary
                ? "bg-gradient-to-br from-teal-100 to-teal-200 border-teal-300 hover:border-teal-400 hover:shadow-lg"
                : "bg-gradient-to-br from-accent/10 to-accent/20 border-accent/30 hover:border-accent/50"
            )}
          >
            <div className={cn(
              "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
              isPrimary
                ? "bg-gradient-to-br from-teal-400 to-emerald-500"
                : "bg-accent"
            )}>
              <PencilLine className="w-8 h-8 text-white" />
            </div>
            <h3 className={cn("text-xl font-bold mb-2", isPrimary ? "text-teal-900" : "text-foreground")}>
              ✏️ Mi Problema
            </h3>
            <p className={cn("text-sm", isPrimary ? "text-teal-700" : "text-muted-foreground")}>
              Escribe tu propia pregunta y Nova te ayudará a resolverla
            </p>
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Puedes cambiar de modo en cualquier momento usando las pestañas
        </p>
      </DialogContent>
    </Dialog>
  );
}
