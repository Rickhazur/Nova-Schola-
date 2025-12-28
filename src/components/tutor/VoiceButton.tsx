import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";

interface VoiceButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function VoiceButton({ 
  isRecording, 
  isProcessing, 
  onClick, 
  disabled 
}: VoiceButtonProps) {
  return (
    <Button
      variant={isRecording ? "destructive" : "ghost"}
      size="icon"
      onClick={onClick}
      disabled={disabled || isProcessing}
      className={`relative ${isRecording ? "animate-pulse" : ""}`}
      title={isRecording ? "Detener grabación" : "Hablar con el tutor"}
    >
      {isProcessing ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isRecording ? (
        <MicOff className="w-5 h-5" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
      
      {isRecording && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
        </span>
      )}
    </Button>
  );
}
