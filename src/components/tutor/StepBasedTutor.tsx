import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Volume2,
  VolumeX,
  Lightbulb,
  Check,
  RotateCcw,
  ChevronLeft,
  HelpCircle,
  Loader2,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { DualWhiteboard, DualWhiteboardRef, TutorStep, DrawingCommand, StudentCommand, ValidationSpec } from "./DualWhiteboard";
import { Link } from "react-router-dom";

interface StepBasedTutorProps {
  variant: "primary" | "highschool";
  problemText: string;
  steps: TutorStep[];
  sessionId: string;
  userId?: string;
  onStepComplete?: (stepId: string, passed: boolean, attempts: number) => void;
  onAllStepsComplete?: () => void;
  ttsEnabled?: boolean;
  onTtsToggle?: () => void;
}

type StepStatus = "locked" | "active" | "awaiting" | "correct" | "incorrect";

interface StepState {
  status: StepStatus;
  attempts: number;
  hintIndex: number;
  feedback?: string;
}

export function StepBasedTutor({
  variant,
  problemText,
  steps,
  sessionId,
  userId,
  onStepComplete,
  onAllStepsComplete,
  ttsEnabled = true,
  onTtsToggle,
}: StepBasedTutorProps) {
  const isPrimary = variant === "primary";
  const whiteboardRef = useRef<DualWhiteboardRef>(null);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepStates, setStepStates] = useState<Record<string, StepState>>(() => {
    const initial: Record<string, StepState> = {};
    steps.forEach((step, index) => {
      initial[step.stepId] = {
        status: index === 0 ? "active" : "locked",
        attempts: 0,
        hintIndex: -1,
      };
    });
    return initial;
  });
  const [isValidating, setIsValidating] = useState(false);
  const [isTutorSpeaking, setIsTutorSpeaking] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const currentStep = steps[currentStepIndex];
  const currentState = currentStep ? stepStates[currentStep.stepId] : null;
  const progress = (currentStepIndex / steps.length) * 100;

  // Play TTS for current step
  const playTTS = useCallback(async (text: string) => {
    if (!ttsEnabled) return;
    
    try {
      setIsTutorSpeaking(true);
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/text-to-speech`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.substring(0, 4000),
          profile: variant === "primary" ? "PRIMARY" : "HIGHSCHOOL",
          languageMode: "es",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioContent) {
          const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
          audio.onended = () => setIsTutorSpeaking(false);
          audio.onerror = () => setIsTutorSpeaking(false);
          await audio.play();
        }
      }
    } catch (error) {
      console.error("TTS error:", error);
      setIsTutorSpeaking(false);
    }
  }, [ttsEnabled, variant]);

  // Show current step on tutor board
  useEffect(() => {
    if (!currentStep || !whiteboardRef.current) return;

    // Clear and play tutor drawing
    whiteboardRef.current.playTutorDrawing(currentStep.tutorDrawingCommands, true);
    
    // Reset start time
    setStartTime(Date.now());

    // Update state to awaiting
    setStepStates(prev => ({
      ...prev,
      [currentStep.stepId]: { ...prev[currentStep.stepId], status: "awaiting" }
    }));
  }, [currentStepIndex, currentStep]);

  // Validate student attempt
  const handleSubmit = useCallback(async () => {
    if (!currentStep || !whiteboardRef.current) return;

    setIsValidating(true);
    const studentCommands = whiteboardRef.current.exportStudentCommands();
    const { width, height } = whiteboardRef.current.getCanvasDimensions();
    const elapsedMs = startTime ? Date.now() - startTime : 0;
    const attemptNumber = (stepStates[currentStep.stepId]?.attempts || 0) + 1;

    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/validate-step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          stepId: currentStep.stepId,
          userId,
          attemptNumber,
          studentCommands,
          elapsedMs,
          validationSpec: currentStep.validationSpec,
          canvasWidth: width,
          canvasHeight: height,
        }),
      });

      const result = await response.json();
      console.log("Validation result:", result);

      // Update step state
      setStepStates(prev => ({
        ...prev,
        [currentStep.stepId]: {
          ...prev[currentStep.stepId],
          status: result.ok ? "correct" : "incorrect",
          attempts: attemptNumber,
          feedback: result.feedbackMessage,
          hintIndex: result.ok ? prev[currentStep.stepId].hintIndex : Math.min(
            result.suggestedHintIndex,
            currentStep.hintSequence.length - 1
          ),
        }
      }));

      // Show feedback
      if (result.ok) {
        toast.success(isPrimary ? "¡Muy bien! 🎉" : "Correcto");
        playTTS(result.feedbackMessage);
        onStepComplete?.(currentStep.stepId, true, attemptNumber);

        // Advance to next step after delay
        setTimeout(() => {
          if (currentStepIndex < steps.length - 1) {
            const nextStepId = steps[currentStepIndex + 1].stepId;
            setStepStates(prev => ({
              ...prev,
              [nextStepId]: { ...prev[nextStepId], status: "active" }
            }));
            setCurrentStepIndex(currentStepIndex + 1);
            whiteboardRef.current?.clearStudentLayer();
          } else {
            // All steps complete
            onAllStepsComplete?.();
            toast.success(isPrimary ? "¡Terminaste todo! 🌟" : "Has completado todos los pasos");
          }
        }, 1500);
      } else {
        toast.error(isPrimary ? "Intenta de nuevo 💪" : "Revisa tu respuesta");
        playTTS(result.feedbackMessage);
        onStepComplete?.(currentStep.stepId, false, attemptNumber);
      }

    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Error al validar. Intenta de nuevo.");
    } finally {
      setIsValidating(false);
    }
  }, [currentStep, sessionId, userId, startTime, stepStates, currentStepIndex, steps, isPrimary, playTTS, onStepComplete, onAllStepsComplete]);

  // Show hint
  const handleShowHint = useCallback(() => {
    if (!currentStep) return;
    const currentHintIndex = stepStates[currentStep.stepId]?.hintIndex ?? -1;
    const nextHintIndex = Math.min(currentHintIndex + 1, currentStep.hintSequence.length - 1);
    
    setStepStates(prev => ({
      ...prev,
      [currentStep.stepId]: { ...prev[currentStep.stepId], hintIndex: nextHintIndex }
    }));

    if (currentStep.hintSequence[nextHintIndex]) {
      playTTS(currentStep.hintSequence[nextHintIndex]);
    }
  }, [currentStep, stepStates, playTTS]);

  // Retry current step
  const handleRetry = useCallback(() => {
    if (!currentStep) return;
    whiteboardRef.current?.clearStudentLayer();
    setStartTime(Date.now());
    setStepStates(prev => ({
      ...prev,
      [currentStep.stepId]: { ...prev[currentStep.stepId], status: "awaiting", feedback: undefined }
    }));
  }, [currentStep]);

  // Replay tutor explanation
  const handleReplay = useCallback(() => {
    if (!currentStep || !whiteboardRef.current) return;
    whiteboardRef.current.playTutorDrawing(currentStep.tutorDrawingCommands, true);
    playTTS(currentStep.tutorText);
  }, [currentStep, playTTS]);

  if (!currentStep) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No hay pasos disponibles</p>
      </div>
    );
  }

  const currentHintIndex = currentState?.hintIndex ?? -1;
  const visibleHints = currentStep.hintSequence.slice(0, currentHintIndex + 1);
  const hasMoreHints = currentHintIndex < currentStep.hintSequence.length - 1;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-3 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/app/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <p className="font-semibold text-sm">{isPrimary ? "Nova 🌟" : "Tutor Nova"}</p>
            <p className="text-xs text-muted-foreground">Paso {currentStepIndex + 1} de {steps.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Progress value={progress} className="w-24 h-2" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onTtsToggle}
            title={ttsEnabled ? "Desactivar voz" : "Activar voz"}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3 gap-3">
        {/* Problem & Tutor Explanation */}
        <div className="lg:w-[35%] flex flex-col gap-3 overflow-y-auto">
          {/* Problem Card */}
          <Card className={`${isPrimary ? "bg-amber-50 border-amber-200" : "bg-card"}`}>
            <CardContent className="p-4">
              <h3 className={`font-bold mb-2 ${isPrimary ? "text-lg" : "text-base"}`}>
                {isPrimary ? "📝 Problema:" : "Problema:"}
              </h3>
              <p className={isPrimary ? "text-base" : "text-sm"}>{problemText}</p>
            </CardContent>
          </Card>

          {/* Current Step Instruction */}
          <Card className={`${isPrimary ? "bg-blue-50 border-blue-200" : "bg-primary/5 border-primary/20"}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">
                  Paso {currentStepIndex + 1}
                </Badge>
                <div className="flex-1">
                  <p className={isPrimary ? "text-base" : "text-sm"}>{currentStep.tutorText}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={handleReplay}
                    disabled={isTutorSpeaking}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    {isPrimary ? "🔊 Escuchar" : "Escuchar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hints */}
          {visibleHints.length > 0 && (
            <Card className={`${isPrimary ? "bg-yellow-50 border-yellow-200" : "bg-muted"}`}>
              <CardContent className="p-4">
                <h4 className={`font-semibold mb-2 flex items-center gap-2 ${isPrimary ? "text-base" : "text-sm"}`}>
                  <Lightbulb className="w-4 h-4" />
                  {isPrimary ? "💡 Pistas:" : "Pistas:"}
                </h4>
                <ul className="space-y-1">
                  {visibleHints.map((hint, i) => (
                    <li key={i} className={`${isPrimary ? "text-sm" : "text-xs"} text-muted-foreground`}>
                      • {hint}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Feedback */}
          {currentState?.feedback && (
            <Card className={`${
              currentState.status === "correct" 
                ? "bg-green-50 border-green-200" 
                : "bg-orange-50 border-orange-200"
            }`}>
              <CardContent className="p-4">
                <p className={isPrimary ? "text-base" : "text-sm"}>{currentState.feedback}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Whiteboard Area */}
        <div className="flex-1 flex flex-col gap-3">
          <DualWhiteboard
            ref={whiteboardRef}
            variant={variant}
            className="flex-1"
            disabled={currentState?.status === "correct"}
            onStudentDraw={() => {
              if (currentState?.status === "incorrect") {
                setStepStates(prev => ({
                  ...prev,
                  [currentStep.stepId]: { ...prev[currentStep.stepId], status: "awaiting" }
                }));
              }
            }}
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size={isPrimary ? "default" : "sm"}
                onClick={handleShowHint}
                disabled={!hasMoreHints || currentState?.status === "correct"}
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                {isPrimary ? "💡 Pista" : "Pista"}
              </Button>

              {currentState?.status === "incorrect" && (
                <Button
                  variant="outline"
                  size={isPrimary ? "default" : "sm"}
                  onClick={handleRetry}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  {isPrimary ? "🔄 Reintentar" : "Reintentar"}
                </Button>
              )}
            </div>

            <Button
              size={isPrimary ? "lg" : "default"}
              onClick={handleSubmit}
              disabled={isValidating || currentState?.status === "correct"}
              className={isPrimary ? "text-lg px-8" : ""}
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {isPrimary ? "✅ ¡Listo!" : "Entregar"}
                </>
              )}
            </Button>
          </div>

          {/* Attempt Counter */}
          {(currentState?.attempts ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Intentos: {currentState?.attempts}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
