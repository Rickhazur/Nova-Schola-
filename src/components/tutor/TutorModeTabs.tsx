import { useCallback } from "react";
import { cn } from "@/lib/utils";

export type TutorMode = "nova-problem" | "my-problem";

interface TutorModeTabsProps {
  activeMode: TutorMode;
  onModeChange: (mode: TutorMode) => void;
  hasUnsavedProgress?: boolean;
  onConfirmChange?: () => Promise<boolean>;
  className?: string;
}

export function TutorModeTabs({
  activeMode,
  onModeChange,
  hasUnsavedProgress = false,
  onConfirmChange,
  className,
}: TutorModeTabsProps) {
  const handleTabClick = useCallback(
    async (mode: TutorMode) => {
      if (mode === activeMode) return;

      if (hasUnsavedProgress && onConfirmChange) {
        const confirmed = await onConfirmChange();
        if (!confirmed) return;
      }

      onModeChange(mode);
    },
    [activeMode, hasUnsavedProgress, onConfirmChange, onModeChange]
  );

  return (
    <div
      className={cn("flex w-full bg-muted/30 rounded-lg p-1 gap-1", className)}
      role="tablist"
      aria-label="Modos de tutoría"
    >
      <button
        role="tab"
        aria-selected={activeMode === "nova-problem"}
        tabIndex={activeMode === "nova-problem" ? 0 : -1}
        onClick={() => handleTabClick("nova-problem")}
        className={cn(
          "flex-1 min-w-[150px] h-[50px] px-4 py-2 rounded-md font-bold text-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50",
          activeMode === "nova-problem"
            ? "bg-primary text-primary-foreground shadow-md border-b-4 border-primary/80"
            : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        📚 Problema de Nova
      </button>
      <button
        role="tab"
        aria-selected={activeMode === "my-problem"}
        tabIndex={activeMode === "my-problem" ? 0 : -1}
        onClick={() => handleTabClick("my-problem")}
        className={cn(
          "flex-1 min-w-[150px] h-[50px] px-4 py-2 rounded-md font-bold text-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50",
          activeMode === "my-problem"
            ? "bg-primary text-primary-foreground shadow-md border-b-4 border-primary/80"
            : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        ✏️ Mi Problema
      </button>
    </div>
  );
}
