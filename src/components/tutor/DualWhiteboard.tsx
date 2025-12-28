import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Trash2, Pencil, Volume2, Lightbulb, Check } from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";

// Types for step-based tutoring
export interface TutorStep {
  stepId: string;
  stepIndex: number;
  tutorText: string;
  tutorDrawingCommands: DrawingCommand[];
  validationSpec: ValidationSpec;
  hintSequence: string[];
  timeLimitSec?: number;
}

export interface DrawingCommand {
  type: "circle" | "rect" | "line" | "arrow" | "text" | "freehand" | "clear";
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  radius?: number;
  width?: number;
  height?: number;
  text?: string;
  label?: string;
  color?: string;
  points?: Array<{ x: number; y: number }>;
}

export interface ValidationSpec {
  type: "shape_and_label_match" | "math_expression_match" | "structure_match" | "freeform_with_checks" | "hand_written_number_match";
  expectedShapes?: Array<{
    type: string;
    approxX: number;
    approxY: number;
    tolerancePx?: number;
    labelRegex?: string;
    relative?: boolean;
  }>;
  minMatches?: number;
  expectedExpression?: string;
  toleranceNumeric?: number;
  expectedNumbers?: Array<{ value: number; tolerance: number }>;
  checks?: Array<{ checkType: string; regex?: string }>;
  acceptanceThreshold?: number;
}

export interface StudentCommand extends DrawingCommand {
  timestamp?: number;
}

export interface DualWhiteboardRef {
  clearStudentLayer: () => void;
  playTutorDrawing: (commands: DrawingCommand[], animate?: boolean) => void;
  exportStudentCommands: () => StudentCommand[];
  takeSnapshot: () => string | null;
  getCanvasDimensions: () => { width: number; height: number };
}

interface DualWhiteboardProps {
  variant: "primary" | "highschool";
  className?: string;
  onStudentDraw?: () => void;
  disabled?: boolean;
}

type Tool = "pen" | "eraser";

const PRIMARY_COLORS = [
  { name: "Rojo", value: "hsl(0, 90%, 60%)" },
  { name: "Amarillo", value: "hsl(45, 100%, 55%)" },
  { name: "Verde", value: "hsl(140, 70%, 50%)" },
  { name: "Azul", value: "hsl(200, 100%, 55%)" },
];

const HIGHSCHOOL_COLORS = [
  { name: "Blanco", value: "hsl(0, 0%, 100%)" },
  { name: "Azul", value: "hsl(210, 100%, 65%)" },
  { name: "Verde", value: "hsl(160, 70%, 50%)" },
];

const TUTOR_COLOR = "hsl(280, 80%, 60%)";

// Render math text with KaTeX
function renderMathText(text: string): string {
  let processed = text
    .replace(/([a-zA-Z])(\^)(\d+)/g, "$1^{$3}")
    .replace(/\(([^)]+)\)\^(\d+)/g, "($1)^{$2}")
    .replace(/(\d+)\/(\d+)/g, "\\frac{$1}{$2}")
    .replace(/sqrt\(([^)]+)\)/gi, "\\sqrt{$1}")
    .replace(/√\(([^)]+)\)/g, "\\sqrt{$1}")
    .replace(/√(\d+)/g, "\\sqrt{$1}");

  const lines = processed.split("\n");
  const renderedLines = lines.map((line) => {
    const hasMath = /[\^_{}\\]|\\frac|\\sqrt/.test(line);
    if (hasMath) {
      try {
        return katex.renderToString(line, {
          throwOnError: false,
          displayMode: false,
          output: "html",
        });
      } catch {
        return `<span>${escapeHtml(line)}</span>`;
      }
    }
    return `<span>${escapeHtml(line)}</span>`;
  });

  return renderedLines.join("<br/>");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const DualWhiteboard = forwardRef<DualWhiteboardRef, DualWhiteboardProps>(
  function DualWhiteboard({ variant, className = "", onStudentDraw, disabled = false }, ref) {
    const isPrimary = variant === "primary";
    const COLORS = isPrimary ? PRIMARY_COLORS : HIGHSCHOOL_COLORS;

    const containerRef = useRef<HTMLDivElement>(null);
    const studentCanvasRef = useRef<HTMLCanvasElement>(null);
    const tutorCanvasRef = useRef<HTMLCanvasElement>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<Tool>("pen");
    const [color, setColor] = useState(COLORS[0].value);
    const [tutorMathElements, setTutorMathElements] = useState<Array<{ id: string; html: string; x: number; y: number; color: string }>>([]);
    const [studentCommands, setStudentCommands] = useState<StudentCommand[]>([]);
    
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const currentStrokeRef = useRef<Array<{ x: number; y: number }>>([]);
    const dimensionsRef = useRef({ width: 800, height: 400 });

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      clearStudentLayer: () => {
        const canvas = studentCanvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx && canvas) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setStudentCommands([]);
      },
      playTutorDrawing: (commands: DrawingCommand[], animate = true) => {
        const canvas = tutorCanvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx || !canvas) return;

        // Clear tutor canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setTutorMathElements([]);

        const { width, height } = dimensionsRef.current;

        // Execute commands (with optional animation delay)
        commands.forEach((cmd, index) => {
          const delay = animate ? index * 200 : 0;
          setTimeout(() => {
            executeDrawingCommand(ctx, cmd, width, height);
          }, delay);
        });
      },
      exportStudentCommands: () => studentCommands,
      takeSnapshot: () => {
        const canvas = studentCanvasRef.current;
        if (!canvas) return null;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasContent = imageData.data.some((pixel, index) => index % 4 === 3 && pixel > 0);
        if (!hasContent) return null;
        return canvas.toDataURL("image/png");
      },
      getCanvasDimensions: () => dimensionsRef.current,
    }));

    // Execute a single drawing command on a canvas context
    const executeDrawingCommand = useCallback((ctx: CanvasRenderingContext2D, cmd: DrawingCommand, canvasWidth: number, canvasHeight: number) => {
      const cmdColor = cmd.color || TUTOR_COLOR;

      switch (cmd.type) {
        case "clear":
          ctx.clearRect(0, 0, canvasWidth, canvasHeight);
          setTutorMathElements([]);
          break;

        case "circle":
          if (cmd.x !== undefined && cmd.y !== undefined && cmd.radius !== undefined) {
            const x = cmd.x <= 100 ? (cmd.x / 100) * canvasWidth : cmd.x;
            const y = cmd.y <= 100 ? (cmd.y / 100) * canvasHeight : cmd.y;
            const r = cmd.radius <= 100 ? (cmd.radius / 100) * Math.min(canvasWidth, canvasHeight) : cmd.radius;
            
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.strokeStyle = cmdColor;
            ctx.lineWidth = 3;
            ctx.stroke();
          }
          break;

        case "rect":
          if (cmd.x !== undefined && cmd.y !== undefined && cmd.width !== undefined && cmd.height !== undefined) {
            const x = cmd.x <= 100 ? (cmd.x / 100) * canvasWidth : cmd.x;
            const y = cmd.y <= 100 ? (cmd.y / 100) * canvasHeight : cmd.y;
            const w = cmd.width <= 100 ? (cmd.width / 100) * canvasWidth : cmd.width;
            const h = cmd.height <= 100 ? (cmd.height / 100) * canvasHeight : cmd.height;
            
            ctx.strokeStyle = cmdColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);
          }
          break;

        case "line":
          if (cmd.x1 !== undefined && cmd.y1 !== undefined && cmd.x2 !== undefined && cmd.y2 !== undefined) {
            const x1 = cmd.x1 <= 100 ? (cmd.x1 / 100) * canvasWidth : cmd.x1;
            const y1 = cmd.y1 <= 100 ? (cmd.y1 / 100) * canvasHeight : cmd.y1;
            const x2 = cmd.x2 <= 100 ? (cmd.x2 / 100) * canvasWidth : cmd.x2;
            const y2 = cmd.y2 <= 100 ? (cmd.y2 / 100) * canvasHeight : cmd.y2;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = cmdColor;
            ctx.lineWidth = 3;
            ctx.stroke();
          }
          break;

        case "arrow":
          if (cmd.x1 !== undefined && cmd.y1 !== undefined && cmd.x2 !== undefined && cmd.y2 !== undefined) {
            const x1 = cmd.x1 <= 100 ? (cmd.x1 / 100) * canvasWidth : cmd.x1;
            const y1 = cmd.y1 <= 100 ? (cmd.y1 / 100) * canvasHeight : cmd.y1;
            const x2 = cmd.x2 <= 100 ? (cmd.x2 / 100) * canvasWidth : cmd.x2;
            const y2 = cmd.y2 <= 100 ? (cmd.y2 / 100) * canvasHeight : cmd.y2;
            
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const headLength = 15;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
            ctx.strokeStyle = cmdColor;
            ctx.lineWidth = 3;
            ctx.stroke();
          }
          break;

        case "text":
          if (cmd.text && cmd.x !== undefined && cmd.y !== undefined) {
            const x = cmd.x <= 100 ? (cmd.x / 100) * canvasWidth : cmd.x;
            const y = cmd.y <= 100 ? (cmd.y / 100) * canvasHeight : cmd.y;
            
            const html = renderMathText(cmd.text);
            setTutorMathElements(prev => [...prev, {
              id: crypto.randomUUID(),
              html,
              x,
              y,
              color: cmdColor,
            }]);
          }
          break;

        case "freehand":
          if (cmd.points && cmd.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(cmd.points[0].x, cmd.points[0].y);
            for (let i = 1; i < cmd.points.length; i++) {
              ctx.lineTo(cmd.points[i].x, cmd.points[i].y);
            }
            ctx.strokeStyle = cmdColor;
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
          }
          break;
      }
    }, []);

    // Resize canvases
    useEffect(() => {
      const resizeCanvases = () => {
        const container = containerRef.current;
        const studentCanvas = studentCanvasRef.current;
        const tutorCanvas = tutorCanvasRef.current;
        if (!container || !studentCanvas || !tutorCanvas) return;

        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        [studentCanvas, tutorCanvas].forEach((canvas) => {
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          canvas.style.width = `${rect.width}px`;
          canvas.style.height = `${rect.height}px`;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.scale(dpr, dpr);
          }
        });

        dimensionsRef.current = { width: rect.width, height: rect.height };
      };

      resizeCanvases();
      window.addEventListener("resize", resizeCanvases);
      return () => window.removeEventListener("resize", resizeCanvases);
    }, []);

    // Drawing handlers
    const getCoordinates = useCallback((e: React.PointerEvent): { x: number; y: number } | null => {
      const canvas = studentCanvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }, []);

    const startDrawing = useCallback((e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      const canvas = studentCanvasRef.current;
      if (canvas) canvas.setPointerCapture(e.pointerId);
      const coords = getCoordinates(e);
      if (!coords) return;

      setIsDrawing(true);
      lastPointRef.current = coords;
      currentStrokeRef.current = [coords];
      onStudentDraw?.();
    }, [getCoordinates, onStudentDraw, disabled]);

    const draw = useCallback((e: React.PointerEvent) => {
      if (!isDrawing || disabled) return;
      e.preventDefault();
      e.stopPropagation();

      const canvas = studentCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      const coords = getCoordinates(e);
      const lastPoint = lastPointRef.current;

      if (!ctx || !coords || !lastPoint) return;

      const bgColor = isPrimary ? "hsl(45, 80%, 95%)" : "hsl(222, 30%, 12%)";
      const strokeColor = tool === "eraser" ? bgColor : (isPrimary ? color : "#FACC15");
      const strokeWidth = tool === "eraser" ? 30 : 4;

      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      lastPointRef.current = coords;
      currentStrokeRef.current.push(coords);
    }, [isDrawing, tool, color, getCoordinates, isPrimary, disabled]);

    const stopDrawing = useCallback((e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      const canvas = studentCanvasRef.current;
      if (canvas) canvas.releasePointerCapture(e.pointerId);
      
      // Save the stroke as a command
      if (currentStrokeRef.current.length > 1 && tool === "pen") {
        const newCommand: StudentCommand = {
          type: "freehand",
          points: [...currentStrokeRef.current],
          color,
          timestamp: Date.now(),
        };
        setStudentCommands(prev => [...prev, newCommand]);
      }

      setIsDrawing(false);
      lastPointRef.current = null;
      currentStrokeRef.current = [];
    }, [color, tool, disabled]);

    const clearStudentCanvas = useCallback(() => {
      const canvas = studentCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setStudentCommands([]);
    }, []);

    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={tool === "pen" ? "default" : "outline"}
            size={isPrimary ? "default" : "sm"}
            onClick={() => setTool("pen")}
            disabled={disabled}
          >
            <Pencil className={isPrimary ? "h-5 w-5 mr-2" : "h-4 w-4 mr-1"} />
            {isPrimary ? "✏️ Lápiz" : "Lápiz"}
          </Button>

          <Button
            variant={tool === "eraser" ? "default" : "outline"}
            size={isPrimary ? "default" : "sm"}
            onClick={() => setTool("eraser")}
            disabled={disabled}
          >
            <Eraser className={isPrimary ? "h-5 w-5 mr-2" : "h-4 w-4 mr-1"} />
            {isPrimary ? "🧹 Borrador" : "Borrador"}
          </Button>

          <div className="h-6 w-px bg-border mx-1" />

          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => { setColor(c.value); setTool("pen"); }}
              disabled={disabled}
              className={`${isPrimary ? "w-10 h-10" : "w-7 h-7"} rounded-full border-2 transition-transform hover:scale-110 disabled:opacity-50 ${
                color === c.value && tool === "pen"
                  ? "border-foreground scale-110 ring-2 ring-offset-2 ring-primary"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}

          <div className="h-6 w-px bg-border mx-1" />

          <Button
            variant="outline"
            size={isPrimary ? "default" : "sm"}
            onClick={clearStudentCanvas}
            disabled={disabled}
          >
            <Trash2 className={isPrimary ? "h-5 w-5 mr-2" : "h-4 w-4 mr-1"} />
            {isPrimary ? "🗑️ Limpiar" : "Limpiar"}
          </Button>
        </div>

        {/* Canvas Container */}
        <div
          ref={containerRef}
          className={`relative flex-1 min-h-[300px] rounded-xl border-2 overflow-hidden ${
            isPrimary ? "bg-[hsl(45,80%,95%)] border-amber-300" : "bg-[hsl(222,30%,12%)] border-border"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          style={{ touchAction: "none" }}
        >
          {/* Tutor Layer (bottom) - read-only */}
          <canvas ref={tutorCanvasRef} className="absolute inset-0 pointer-events-none" />

          {/* Tutor Math Overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {tutorMathElements.map((el) => (
              <div
                key={el.id}
                className={`absolute whitespace-pre-wrap ${isPrimary ? "text-lg" : "text-base"}`}
                style={{
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  color: el.color,
                  maxWidth: "calc(100% - 40px)",
                  fontFamily: isPrimary ? "inherit" : "monospace",
                }}
                dangerouslySetInnerHTML={{ __html: el.html }}
              />
            ))}
          </div>

          {/* Student Layer (top - interactive) */}
          <canvas
            ref={studentCanvasRef}
            className={`absolute inset-0 ${disabled ? "pointer-events-none" : "cursor-crosshair"}`}
            style={{ touchAction: "none" }}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            onPointerCancel={stopDrawing}
          />

          {/* Disabled overlay */}
          {disabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <p className={`text-center ${isPrimary ? "text-lg" : "text-base"} text-muted-foreground`}>
                {isPrimary ? "👀 Mira lo que Nova te muestra" : "Observa la explicación del tutor"}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
);
