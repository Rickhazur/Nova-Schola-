import { useState, useRef, useEffect } from "react";
import { Sparkles, User, Camera, PenTool, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceButton } from "./VoiceButton";
import { AudioPlayer } from "./AudioPlayer";
import { normalizeMathText } from "@/lib/mathText";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

interface TutorChatProps {
  messages: Message[];
  isLoading: boolean;
  isPrimary?: boolean;
  onSendMessage: (content: string, imageBase64?: string) => void;
  isRecording?: boolean;
  isProcessing?: boolean;
  onToggleRecording?: () => void;
  showWhiteboard?: boolean;
  onToggleWhiteboard?: () => void;
}

export function TutorChat({
  messages,
  isLoading,
  isPrimary = false,
  onSendMessage,
  isRecording = false,
  isProcessing = false,
  onToggleRecording,
  showWhiteboard = false,
  onToggleWhiteboard,
}: TutorChatProps) {
  const [input, setInput] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() && !uploadedImage) return;
    onSendMessage(input.trim(), uploadedImage || undefined);
    setInput("");
    setUploadedImage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen es muy grande. Máximo 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Info Note */}
      <div className="px-4 pt-4">
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            isPrimary
              ? "bg-amber-500/10 border border-amber-500/20 text-amber-200"
              : "bg-primary/10 border border-primary/20 text-primary"
          }`}
        >
          💡 Puedes hablar o escribir. El tutor te hará preguntas para ver si entendiste.
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isPrimary
                    ? "bg-gradient-to-br from-amber-400 to-orange-500"
                    : "bg-gradient-to-br from-primary to-primary/80"
                }`}
              >
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div className="flex flex-col gap-2 max-w-xl">
              <div
                className={`px-4 py-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-secondary text-foreground rounded-tl-none"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{normalizeMathText(message.content)}</p>
              </div>
              {message.role === "assistant" && message.audioUrl && (
                <AudioPlayer audioUrl={message.audioUrl} onEnded={() => setCurrentAudioUrl(null)} />
              )}
            </div>
            {message.role === "user" && (
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-accent-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                isPrimary
                  ? "bg-gradient-to-br from-amber-400 to-orange-500"
                  : "bg-gradient-to-br from-primary to-primary/80"
              }`}
            >
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="bg-secondary text-foreground rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                <span
                  className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Audio Player for current response */}
      {currentAudioUrl && (
        <div className="px-4 pb-2">
          <AudioPlayer audioUrl={currentAudioUrl} onEnded={() => setCurrentAudioUrl(null)} />
        </div>
      )}

      {/* Uploaded Image Preview */}
      {uploadedImage && (
        <div className="px-4 pb-2">
          <div className="relative inline-block">
            <img
              src={uploadedImage}
              alt="Uploaded"
              className="max-h-32 rounded-lg border border-border"
            />
            <button
              onClick={() => setUploadedImage(null)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Recording state indicator */}
      {isRecording && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
            </span>
            <span className="text-sm font-medium">Escuchando...</span>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <span className="text-sm font-medium">Transcribiendo audio...</span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            title="Subir foto de tarea"
          >
            <Camera className="w-5 h-5" />
          </Button>

          {onToggleRecording && (
            <VoiceButton
              isRecording={isRecording}
              isProcessing={isProcessing}
              onClick={onToggleRecording}
            />
          )}

          {onToggleWhiteboard && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleWhiteboard}
              className="sm:hidden"
              title="Abrir pizarra"
            >
              <PenTool className="w-5 h-5" />
            </Button>
          )}

          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Escribe tu pregunta o sube una foto..."
              className="w-full px-4 py-3 pr-12 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={1}
            />
          </div>

          <Button
            variant="default"
            size="icon"
            onClick={handleSend}
            disabled={(!input.trim() && !uploadedImage) || isLoading}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">
          El tutor usa el método socrático: te guía con preguntas para que descubras las respuestas.
        </p>
      </div>
    </div>
  );
}
