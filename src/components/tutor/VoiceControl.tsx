import { Button } from "@/components/ui/button";
import { Mic, MicOff, Square, Loader2 } from "lucide-react";

interface VoiceControlProps {
  variant: "primary" | "highschool";
  isRecording: boolean;
  isProcessing: boolean;
  isTutorSpeaking: boolean;
  onToggleRecording: () => void;
  onStopTutor: () => void;
  disabled?: boolean;
}

export function VoiceControl({ 
  variant,
  isRecording, 
  isProcessing, 
  isTutorSpeaking,
  onToggleRecording, 
  onStopTutor,
  disabled 
}: VoiceControlProps) {
  const isPrimary = variant === "primary";

  if (isTutorSpeaking) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Button
          variant="destructive"
          size="lg"
          onClick={onStopTutor}
          className={`${
            isPrimary 
              ? "w-24 h-24 rounded-full text-2xl shadow-xl" 
              : "w-20 h-20 rounded-full text-xl"
          } animate-pulse`}
        >
          <Square className={isPrimary ? "w-10 h-10" : "w-8 h-8"} />
        </Button>
        <span className={`font-medium ${
          isPrimary 
            ? "text-lg text-amber-600" 
            : "text-sm text-muted-foreground"
        }`}>
          {isPrimary ? "🔊 El tutor está hablando..." : "Tutor hablando..."}
        </span>
        <span className={`text-sm ${isPrimary ? "text-amber-500" : "text-muted-foreground"}`}>
          {isPrimary ? "Toca para interrumpir" : "Pulsa para interrumpir"}
        </span>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className={`flex items-center justify-center ${
          isPrimary 
            ? "w-24 h-24 rounded-full bg-primary/20" 
            : "w-20 h-20 rounded-full bg-primary/10"
        }`}>
          <Loader2 className={`animate-spin ${isPrimary ? "w-10 h-10" : "w-8 h-8"} text-primary`} />
        </div>
        <span className={`font-medium ${
          isPrimary 
            ? "text-lg text-amber-600" 
            : "text-sm text-muted-foreground"
        }`}>
          {isPrimary ? "✨ Procesando tu voz..." : "Transcribiendo..."}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        variant={isRecording ? "destructive" : "default"}
        size="lg"
        onClick={onToggleRecording}
        disabled={disabled}
        className={`${
          isPrimary 
            ? "w-28 h-28 rounded-full text-2xl shadow-xl" 
            : "w-20 h-20 rounded-full text-xl"
        } ${isRecording ? "animate-pulse" : ""} ${
          isPrimary && !isRecording
            ? "bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600" 
            : ""
        }`}
      >
        {isRecording ? (
          <MicOff className={isPrimary ? "w-12 h-12" : "w-8 h-8"} />
        ) : (
          <Mic className={isPrimary ? "w-12 h-12" : "w-8 h-8"} />
        )}
      </Button>
      
      <span className={`font-medium ${
        isPrimary 
          ? "text-xl text-amber-600" 
          : "text-sm text-muted-foreground"
      }`}>
        {isRecording 
          ? (isPrimary ? "🎤 ¡Te escucho! Suelta para enviar" : "Grabando... suelta para enviar")
          : (isPrimary ? "🎙️ Mantén presionado para hablar" : "Pulsa para hablar")
        }
      </span>

      {isRecording && (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full bg-destructive animate-pulse ${
                isPrimary ? "h-6" : "h-4"
              }`}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
