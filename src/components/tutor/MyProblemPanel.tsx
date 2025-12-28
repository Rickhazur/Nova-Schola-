import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MyProblemPanelProps {
  onSubmitProblem: (problem: string) => void;
  submittedProblem: string | null;
  isProcessing: boolean;
  isPrimary?: boolean;
  className?: string;
}

export function MyProblemPanel({
  onSubmitProblem,
  submittedProblem,
  isProcessing,
  isPrimary = true,
  className,
}: MyProblemPanelProps) {
  const [problemText, setProblemText] = useState("");

  const handleSubmit = () => {
    if (!problemText.trim()) return;
    onSubmitProblem(problemText.trim());
    setProblemText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (submittedProblem) {
    return (
      <div
        className={cn(
          "rounded-xl p-4 border-2 transition-all duration-300",
          isPrimary
            ? "bg-teal-50/80 border-teal-200"
            : "bg-accent/10 border-accent/30",
          className
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className={cn("w-5 h-5", isPrimary ? "text-teal-600" : "text-accent")} />
          <h3 className={cn("font-bold text-lg", isPrimary ? "text-teal-900" : "text-foreground")}>
            Tu problema:
          </h3>
        </div>
        <p className={cn(
          "text-xl leading-relaxed font-medium",
          isPrimary ? "text-teal-900" : "text-foreground"
        )}>
          {submittedProblem}
        </p>
        <p className={cn("text-sm mt-3", isPrimary ? "text-teal-600" : "text-muted-foreground")}>
          💡 Nova está analizando tu problema. Mira las pistas y usa la pizarra para resolverlo.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl p-4 border-2 transition-all duration-300",
        isPrimary
          ? "bg-teal-50/80 border-teal-200"
          : "bg-accent/10 border-accent/30",
        className
      )}
    >
      <h3 className={cn("font-bold text-lg mb-3", isPrimary ? "text-teal-900" : "text-foreground")}>
        ✏️ Escribe tu problema aquí:
      </h3>

      <textarea
        value={problemText}
        onChange={(e) => setProblemText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ejemplo: ¿Cómo resuelvo 3/4 + 1/2?"
        className={cn(
          "w-full min-h-[200px] p-4 rounded-lg border-2 text-lg resize-none transition-all focus:outline-none focus:ring-2",
          isPrimary
            ? "bg-white border-teal-200 text-teal-900 placeholder:text-teal-400 focus:border-teal-400 focus:ring-teal-200"
            : "bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent/30"
        )}
        disabled={isProcessing}
      />

      <div className="flex justify-end mt-4">
        <Button
          onClick={handleSubmit}
          disabled={!problemText.trim() || isProcessing}
          className={cn(
            "w-[200px] h-[60px] text-lg font-bold gap-2 transition-all duration-200",
            isPrimary
              ? "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl"
              : "bg-accent hover:bg-accent/90"
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              📤 Enviar a Nova
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-2">
        Presiona Ctrl+Enter para enviar rápidamente
      </p>
    </div>
  );
}
