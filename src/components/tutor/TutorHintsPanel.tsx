import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb, ChevronRight, BookOpen, HelpCircle, CheckCircle2 } from "lucide-react";

export interface Hint {
  id: string;
  step: number;
  text: string;
  type: "text" | "image" | "example";
  imageUrl?: string;
}

export interface TutorHintsPanelProps {
  variant: "primary" | "highschool";
  currentTopic?: string;
  hints: Hint[];
  onRequestExplanation?: () => void;
  isAwaitingExplanation?: boolean;
  className?: string;
}

const PLACEHOLDER_IMAGES: Record<string, string> = {
  fracciones: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100'%3E%3Crect width='200' height='100' fill='%23f0f4ff'/%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%234f46e5' stroke-width='3'/%3E%3Cpath d='M50 10 L50 90' stroke='%234f46e5' stroke-width='2'/%3E%3Cpath d='M50 10 A40 40 0 0 1 90 50' fill='%23818cf8' opacity='0.5'/%3E%3Ccircle cx='150' cy='50' r='40' fill='none' stroke='%234f46e5' stroke-width='3'/%3E%3Cpath d='M150 10 L150 90' stroke='%234f46e5' stroke-width='2'/%3E%3Cpath d='M110 50 L190 50' stroke='%234f46e5' stroke-width='2'/%3E%3Cpath d='M150 10 A40 40 0 0 1 190 50 L150 50 Z' fill='%23818cf8' opacity='0.5'/%3E%3Cpath d='M150 50 A40 40 0 0 1 110 50 L150 50 Z' fill='%2334d399' opacity='0.5'/%3E%3C/svg%3E",
  geometria: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100'%3E%3Crect width='200' height='100' fill='%23f0f4ff'/%3E%3Crect x='20' y='20' width='60' height='60' fill='none' stroke='%234f46e5' stroke-width='3'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%234f46e5' font-size='12'%3E4cm%3C/text%3E%3Cpolygon points='120,80 150,20 180,80' fill='none' stroke='%2334d399' stroke-width='3'/%3E%3Ctext x='150' y='60' text-anchor='middle' fill='%2334d399' font-size='10'%3Eh=6cm%3C/text%3E%3C/svg%3E",
  algebra: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100'%3E%3Crect width='200' height='100' fill='%23f0f4ff'/%3E%3Cline x1='20' y1='80' x2='180' y2='80' stroke='%234f46e5' stroke-width='2'/%3E%3Cline x1='30' y1='20' x2='30' y2='90' stroke='%234f46e5' stroke-width='2'/%3E%3Cpath d='M40 70 Q80 20 120 50 T170 30' fill='none' stroke='%23f59e0b' stroke-width='3'/%3E%3Ctext x='100' y='95' text-anchor='middle' fill='%234f46e5' font-size='10'%3Ey = x²%3C/text%3E%3C/svg%3E",
  default: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100'%3E%3Crect width='200' height='100' fill='%23f0f4ff'/%3E%3Ccircle cx='100' cy='50' r='30' fill='%23e0e7ff' stroke='%234f46e5' stroke-width='2'/%3E%3Ctext x='100' y='55' text-anchor='middle' fill='%234f46e5' font-size='20'%3E💡%3C/text%3E%3C/svg%3E"
};

function getPlaceholderImage(topic?: string): string {
  if (!topic) return PLACEHOLDER_IMAGES.default;
  const lowerTopic = topic.toLowerCase();
  if (lowerTopic.includes("fraccion") || lowerTopic.includes("fraction")) return PLACEHOLDER_IMAGES.fracciones;
  if (lowerTopic.includes("geometr") || lowerTopic.includes("area") || lowerTopic.includes("perimeter")) return PLACEHOLDER_IMAGES.geometria;
  if (lowerTopic.includes("algebra") || lowerTopic.includes("ecuacion") || lowerTopic.includes("equation")) return PLACEHOLDER_IMAGES.algebra;
  return PLACEHOLDER_IMAGES.default;
}

export function TutorHintsPanel({
  variant,
  currentTopic,
  hints,
  onRequestExplanation,
  isAwaitingExplanation = false,
  className = "",
}: TutorHintsPanelProps) {
  const isPrimary = variant === "primary";
  const [visibleHintCount, setVisibleHintCount] = useState(0);
  const [lastHintCount, setLastHintCount] = useState(0);

  // Reset visible hints when hints array changes (new problem)
  useEffect(() => {
    if (hints.length !== lastHintCount) {
      setVisibleHintCount(hints.length > 0 ? 1 : 0);
      setLastHintCount(hints.length);
    }
  }, [hints.length, lastHintCount]);

  const visibleHints = hints.slice(0, visibleHintCount);
  const hasMoreHints = visibleHintCount < hints.length;

  const showNextHint = () => {
    if (hasMoreHints) {
      setVisibleHintCount((prev) => prev + 1);
    }
  };

  return (
    <div
      className={`flex flex-col h-full rounded-xl border-2 overflow-hidden ${
        isPrimary 
          ? "bg-gradient-to-b from-blue-50 to-indigo-50 border-indigo-200" 
          : "bg-gradient-to-b from-slate-800 to-slate-900 border-slate-700"
      } ${className}`}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-2 px-3 py-2 border-b ${
          isPrimary
            ? "bg-indigo-100/80 border-indigo-200"
            : "bg-slate-700/50 border-slate-600"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isPrimary ? "bg-amber-400" : "bg-primary"
          }`}
        >
          <Lightbulb className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3
            className={`font-semibold text-sm ${
              isPrimary ? "text-indigo-900" : "text-slate-100"
            }`}
          >
            {isPrimary ? "💡 Pistas de Nova" : "Pistas del Tutor"}
          </h3>
          {currentTopic && (
            <p
              className={`text-xs ${
                isPrimary ? "text-indigo-600" : "text-slate-400"
              }`}
            >
              {currentTopic}
            </p>
          )}
        </div>
      </div>

      {/* Hints Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {visibleHints.length === 0 ? (
          <div
            className={`text-center py-6 ${
              isPrimary ? "text-indigo-400" : "text-slate-500"
            }`}
          >
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {isPrimary
                ? "¡Las pistas aparecerán aquí cuando empieces un problema!"
                : "Las pistas aparecerán mientras resuelves problemas."}
            </p>
          </div>
        ) : (
          visibleHints.map((hint, index) => (
            <div
              key={hint.id}
              className={`rounded-lg p-3 animate-in fade-in slide-in-from-right-2 duration-300 ${
                isPrimary
                  ? "bg-white/80 border border-indigo-200 shadow-sm"
                  : "bg-slate-700/50 border border-slate-600"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isPrimary
                      ? "bg-amber-400 text-amber-900"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {hint.step}
                </span>
                <span
                  className={`text-xs font-medium ${
                    isPrimary ? "text-indigo-600" : "text-slate-400"
                  }`}
                >
                  Paso {hint.step}
                </span>
              </div>

              {/* Hint content */}
              <p
                className={`text-sm leading-relaxed ${
                  isPrimary ? "text-indigo-900" : "text-slate-200"
                }`}
              >
                {hint.text}
              </p>

              {/* Image if available */}
              {hint.type === "image" && (
                <div className="mt-2 rounded-lg overflow-hidden border border-opacity-20">
                  <img
                    src={hint.imageUrl || getPlaceholderImage(currentTopic)}
                    alt={`Ilustración paso ${hint.step}`}
                    className="w-full h-auto max-h-32 object-contain bg-white"
                  />
                </div>
              )}

              {/* Example box */}
              {hint.type === "example" && (
                <div
                  className={`mt-2 p-2 rounded border-l-4 ${
                    isPrimary
                      ? "bg-green-50 border-green-400 text-green-800"
                      : "bg-emerald-900/30 border-emerald-500 text-emerald-300"
                  }`}
                >
                  <p className="text-xs font-medium mb-1">
                    {isPrimary ? "📝 Ejemplo:" : "Ejemplo:"}
                  </p>
                  <p className="text-sm font-mono">{hint.text}</p>
                </div>
              )}
            </div>
          ))
        )}

        {/* Awaiting explanation indicator */}
        {isAwaitingExplanation && (
          <div
            className={`rounded-lg p-3 border-2 border-dashed animate-pulse ${
              isPrimary
                ? "bg-amber-50 border-amber-300"
                : "bg-amber-900/20 border-amber-600"
            }`}
          >
            <div className="flex items-center gap-2">
              <HelpCircle
                className={`w-5 h-5 ${
                  isPrimary ? "text-amber-600" : "text-amber-400"
                }`}
              />
              <p
                className={`text-sm font-medium ${
                  isPrimary ? "text-amber-800" : "text-amber-300"
                }`}
              >
                {isPrimary
                  ? "¿Puedes explicarme cómo llegaste a tu respuesta? 🤔"
                  : "Explica tu proceso de resolución"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div
        className={`p-3 border-t ${
          isPrimary ? "border-indigo-200 bg-white/50" : "border-slate-700 bg-slate-800/50"
        }`}
      >
        <div className="flex flex-col gap-2">
          {/* Show next hint button */}
          {hasMoreHints && (
            <Button
              variant={isPrimary ? "default" : "secondary"}
              size="sm"
              onClick={showNextHint}
              className={`w-full ${
                isPrimary
                  ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                  : ""
              }`}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              {isPrimary ? "💡 Mostrar siguiente pista" : "Siguiente pista"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}

          {/* Request explanation button */}
          {onRequestExplanation && visibleHints.length > 0 && !isAwaitingExplanation && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRequestExplanation}
              className={`w-full ${
                isPrimary
                  ? "border-green-400 text-green-700 hover:bg-green-50"
                  : "border-emerald-600 text-emerald-400 hover:bg-emerald-900/30"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {isPrimary ? "✅ Ya terminé, revisar" : "Verificar mi respuesta"}
            </Button>
          )}

          {/* Hint progress */}
          {hints.length > 0 && (
            <div className="flex items-center justify-center gap-1 mt-1">
              {hints.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index < visibleHintCount
                      ? isPrimary
                        ? "bg-amber-400"
                        : "bg-primary"
                      : isPrimary
                      ? "bg-indigo-200"
                      : "bg-slate-600"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
