import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  ChevronLeft,
  Volume2,
  VolumeX,
  Lightbulb,
  RotateCcw,
  Loader2,
  Sparkles,
  Pencil,
  Eraser,
  Trash2,
  Send,
  MessageSquare,
  Mic
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTutorSession } from "@/hooks/useTutorSession";

interface TutorSessionProps {
  variant: "primary" | "highschool";
}

export function TutorSession({ variant }: TutorSessionProps) {
  const isPrimary = variant === "primary";
  const { user } = useAuth();

  // Canvas refs
  const tutorCanvasRef = useRef<HTMLCanvasElement>(null);
  const studentCanvasRef = useRef<HTMLCanvasElement>(null);
  const tutorContainerRef = useRef<HTMLDivElement>(null);
  const studentContainerRef = useRef<HTMLDivElement>(null);

  // Interaction State
  const [input, setInput] = useState("");

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState(isPrimary ? "hsl(0, 90%, 60%)" : "hsl(210, 100%, 65%)");
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Colors for palette
  const COLORS = isPrimary
    ? [
      { name: "Rojo", value: "hsl(0, 90%, 60%)" },
      { name: "Amarillo", value: "hsl(45, 100%, 55%)" },
      { name: "Verde", value: "hsl(140, 70%, 50%)" },
      { name: "Azul", value: "hsl(200, 100%, 55%)" },
    ]
    : [
      { name: "Blanco", value: "hsl(0, 0%, 100%)" },
      { name: "Azul", value: "hsl(210, 100%, 65%)" },
      { name: "Verde", value: "hsl(160, 70%, 50%)" },
    ];

  // Socratic Tutor Hook
  const {
    messages,
    isLoading,
    isTutorSpeaking,
    sendMessage,
    stopTutorAudio,
  } = useTutorSession({
    ageGroup: isPrimary ? "PRIMARY" : "HIGHSCHOOL",
    studentName: user?.user_metadata?.full_name || "Estudiante",
    studentId: user?.id,
    ttsEnabled: true, // Always start enabled
  });

  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Get the latest message to display on the board
  const latestAssistantMessage = messages
    .slice()
    .reverse()
    .find((m) => m.role === "assistant");

  // Default fallback welcome message
  const displayTutorText = latestAssistantMessage?.content || "¡Hola! Soy Nova. Escribe en el chat o en el tablero.";

  // Draw Tutor Text on Canvas (Auto-Refreshes)
  const drawOnTutorCanvas = useCallback(() => {
    const canvas = tutorCanvasRef.current;
    const container = tutorContainerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    } else {
      ctx.clearRect(0, 0, rect.width, rect.height);
    }

    ctx.clearRect(0, 0, rect.width, rect.height);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Draw Text
    ctx.font = `bold ${isPrimary ? "20px" : "16px"} sans-serif`;
    ctx.fillStyle = isPrimary ? "#7C3AED" : "#A78BFA";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const maxWidth = rect.width - 60;
    const words = displayTutorText.split(" ");
    let line = "";
    const lines = [];

    for (const word of words) {
      const testLine = line + word + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        lines.push(line);
        line = word + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    const lineHeight = isPrimary ? 30 : 26;
    let y = centerY - ((lines.length - 1) * lineHeight) / 2;

    for (const l of lines) {
      ctx.fillText(l.trim(), centerX, y);
      y += lineHeight;
    }
  }, [displayTutorText, isPrimary]);

  // Init Student Canvas
  const initStudentCanvas = useCallback(() => {
    const canvas = studentCanvasRef.current;
    const container = studentContainerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width === rect.width * dpr && canvas.height === rect.height * dpr) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  // Effects
  useEffect(() => {
    drawOnTutorCanvas();
  }, [drawOnTutorCanvas, latestAssistantMessage]);

  useEffect(() => {
    initStudentCanvas();
    const handleResize = () => {
      drawOnTutorCanvas();
      initStudentCanvas();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initStudentCanvas, drawOnTutorCanvas]);

  // Drawing Logic
  const getCoordinates = useCallback((e: React.PointerEvent) => {
    const canvas = studentCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const startDrawing = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const canvas = studentCanvasRef.current;
    if (canvas) canvas.setPointerCapture(e.pointerId);
    const coords = getCoordinates(e);
    if (!coords) return;
    setIsDrawing(true);
    lastPointRef.current = coords;
  }, [getCoordinates]);

  const draw = useCallback((e: React.PointerEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = studentCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    const coords = getCoordinates(e);
    const lastPoint = lastPointRef.current;

    if (!ctx || !coords || !lastPoint) return;

    const bgColor = isPrimary ? "hsl(45, 80%, 95%)" : "hsl(222, 30%, 12%)";
    const strokeColor = tool === "eraser" ? bgColor : color;
    const strokeWidth = tool === "eraser" ? 30 : 4;

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = strokeColor;
    }

    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastPointRef.current = coords;
  }, [isDrawing, tool, color, getCoordinates, isPrimary]);

  const stopDrawing = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const canvas = studentCanvasRef.current;
    if (canvas) canvas.releasePointerCapture(e.pointerId);
    setIsDrawing(false);
    lastPointRef.current = null;
  }, []);

  const clearStudentCanvas = useCallback(() => {
    const canvas = studentCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Interaction Handlers
  const handleSendText = async () => {
    if (!input.trim()) return;
    await sendMessage(input);
    setInput("");
  };

  const handleSendBoard = async () => {
    const canvas = studentCanvasRef.current;
    if (!canvas) return;

    const imageBase64 = canvas.toDataURL("image/png");
    const textMessage = input.trim() || "Revisa mi trabajo en el tablero.";

    await sendMessage(textMessage, imageBase64);
    setInput("");
  };

  const handleHint = () => {
    sendMessage("Dame una pista, por favor.");
  };

  const handleRetry = () => {
    sendMessage("Quiero reiniciar o intentar otro problema.");
    clearStudentCanvas();
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-3 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0 z-10 w-full top-0">
        <div className="flex items-center gap-3">
          <Link to="/app/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${isPrimary
                  ? "bg-gradient-to-br from-amber-400 to-orange-500"
                  : "bg-gradient-to-br from-primary to-primary/80"
                }`}
            >
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">{isPrimary ? "Nova 🌟" : "Tutor Nova"}</p>
              <p className="text-xs text-muted-foreground">Sesión Socrática</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              if (ttsEnabled) stopTutorAudio();
              setTtsEnabled(!ttsEnabled);
            }}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      {/* Main Content: Two Whiteboards */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3 gap-3 pb-0">
        {/* Student Whiteboard */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Pencil className={`w-5 h-5 ${isPrimary ? "text-green-500" : "text-accent"}`} />
              <span className={`font-semibold ${isPrimary ? "text-lg" : "text-base"}`}>
                {isPrimary ? "✏️ Tu Pizarra" : "Tu Tablero"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant={tool === "pen" ? "default" : "outline"}
                size="sm"
                onClick={() => setTool("pen")}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant={tool === "eraser" ? "default" : "outline"}
                size="sm"
                onClick={() => setTool("eraser")}
              >
                <Eraser className="w-4 h-4" />
              </Button>
              <div className="h-6 w-px bg-border mx-1" />
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { setColor(c.value); setTool("pen"); }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c.value && tool === "pen"
                      ? "border-foreground ring-2 ring-offset-1 ring-primary"
                      : "border-transparent"
                    }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
              <div className="h-6 w-px bg-border mx-1" />
              <Button variant="outline" size="sm" onClick={clearStudentCanvas}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div
            ref={studentContainerRef}
            className={`flex-1 rounded-xl border-2 overflow-hidden cursor-crosshair ${isPrimary
                ? "bg-[hsl(45,80%,95%)] border-amber-300"
                : "bg-[hsl(222,30%,12%)] border-border"
              }`}
            style={{ touchAction: "none" }}
          >
            <canvas
              ref={studentCanvasRef}
              className="w-full h-full"
              style={{ touchAction: "none" }}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              onPointerCancel={stopDrawing}
            />
          </div>
        </div>

        {/* Tutor Whiteboard */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className={`w-5 h-5 ${isPrimary ? "text-amber-500" : "text-primary"}`} />
              <span className={`font-semibold ${isPrimary ? "text-lg" : "text-base"}`}>
                {isPrimary ? "📖 Tablero de Nova" : "Tablero del Tutor"}
              </span>
              {isTutorSpeaking && (
                <Badge variant="secondary" className="animate-pulse">
                  <Volume2 className="w-3 h-3 mr-1" /> Hablando...
                </Badge>
              )}
            </div>
          </div>
          <div
            ref={tutorContainerRef}
            className={`flex-1 rounded-xl border-2 overflow-hidden ${isPrimary
                ? "bg-gradient-to-br from-purple-50 to-amber-50 border-purple-200"
                : "bg-gradient-to-br from-slate-900 to-slate-800 border-primary/30"
              }`}
          >
            <canvas ref={tutorCanvasRef} className="w-full h-full" />
          </div>
        </div>
      </div>

      {/* NEW Chat Input Bar (Glassmorphism & Fixed Bottom) */}
      <div className="p-3 border-t border-border bg-card/90 backdrop-blur-md z-20">
        <div className="flex items-end gap-2 max-w-5xl mx-auto">
          {/* Aux Actions (Mini) */}
          <div className="flex flex-col gap-1 pb-1">
            <Button variant="ghost" size="icon" onClick={handleHint} title="Pedir Pista" className="hover:bg-amber-100 dark:hover:bg-amber-900/20">
              <Lightbulb className="w-5 h-5 text-amber-500" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRetry} title="Reiniciar" className="hover:bg-destructive/10">
              <RotateCcw className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>

          {/* Main Chat Input Area */}
          <div className="flex-1 relative rounded-2xl border-2 border-primary/20 bg-background/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isPrimary ? "Escribe aquí tu pregunta para Nova... ✏️" : "Escribe tu pregunta o duda aquí..."}
              className="w-full min-h-[56px] max-h-[120px] p-3 pr-2 bg-transparent resize-none focus:outline-none text-base leading-relaxed scrollbar-thin scrollbar-thumb-rounded"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendText();
                }
              }}
            />
          </div>

          {/* Smart Send Buttons */}
          <div className="flex flex-col gap-2 pb-1">
            <Button
              size="sm"
              onClick={handleSendText}
              disabled={!input.trim() || isLoading}
              className={`${isPrimary ? "bg-blue-600 hover:bg-blue-700" : "bg-primary"} text-white font-medium`}
              title="Enviar solo texto"
            >
              <Send className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">Enviar Texto</span>
              <span className="md:hidden">Texto</span>
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={handleSendBoard}
              disabled={isLoading}
              title="Enviar texto + dibujo del tablero"
              className="border border-primary/20"
            >
              <Sparkles className="w-4 h-4 mr-1 md:mr-2 text-purple-600" />
              <span className="hidden md:inline">Enviar Tablero</span>
              <span className="md:hidden">Tablero</span>
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 px-4 py-1 rounded-full bg-primary/10 backdrop-blur text-xs font-medium text-primary flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Nova está pensando...
          </div>
        )}
      </div>
    </div>
  );
}
