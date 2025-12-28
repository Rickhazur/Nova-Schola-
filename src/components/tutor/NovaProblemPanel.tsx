import { useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface NovaProblemPanelProps {
  problem: string | null;
  isGenerating: boolean;
  onGenerateProblem: () => void;
  isPrimary?: boolean;
  className?: string;
}

export function NovaProblemPanel({
  problem,
  isGenerating,
  onGenerateProblem,
  isPrimary = true,
  className,
}: NovaProblemPanelProps) {
  // Auto-generate problem when panel mounts and no problem exists
  useEffect(() => {
    if (!problem && !isGenerating) {
      onGenerateProblem();
    }
  }, [problem, isGenerating, onGenerateProblem]);

  return (
    <div
      className={cn(
        "rounded-xl p-4 border-2 transition-all duration-300",
        isPrimary
          ? "bg-amber-50/80 border-amber-200"
          : "bg-gold/10 border-gold/30",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className={cn("w-5 h-5", isPrimary ? "text-amber-600" : "text-gold")} />
        <h3 className={cn("font-bold text-lg", isPrimary ? "text-amber-900" : "text-foreground")}>
          📝 Resuelve este problema:
        </h3>
      </div>

      {isGenerating ? (
        <div className="flex items-center justify-center py-8 gap-3">
          <Loader2 className={cn("w-6 h-6 animate-spin", isPrimary ? "text-amber-500" : "text-primary")} />
          <span className={cn("text-lg", isPrimary ? "text-amber-700" : "text-muted-foreground")}>
            Nova está pensando un problema para ti...
          </span>
        </div>
      ) : problem ? (
        <div className="space-y-3">
          <p className={cn(
            "text-xl leading-relaxed font-medium",
            isPrimary ? "text-amber-900" : "text-foreground"
          )}>
            {problem}
          </p>
          <p className={cn("text-sm", isPrimary ? "text-amber-600" : "text-muted-foreground")}>
            💡 Usa la pizarra para mostrar tu procedimiento
          </p>
        </div>
      ) : (
        <p className={cn("text-center py-4", isPrimary ? "text-amber-600" : "text-muted-foreground")}>
          Preparando problema...
        </p>
      )}
    </div>
  );
}
