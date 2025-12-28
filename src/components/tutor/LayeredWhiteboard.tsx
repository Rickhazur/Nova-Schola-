import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Trash2, Pencil } from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface BoardAction {
  type: "draw" | "clear" | "text";
  color?: string;
  points?: { x: number; y: number }[];
  text?: string;
  position?: { x: number; y: number };
}

// NUEVO: tipos para whiteboard events del backend
export type WhiteboardEventType = "draw_text" | "clear";

export interface WhiteboardEvent {
  id: string;
  type: WhiteboardEventType;
  text?: string;
  x?: number;
  y?: number;
  color?: string;
}

interface LayeredWhiteboardProps {
  className?: string;
  variant: "primary" | "highschool";
  boardActions?: BoardAction[];
  whiteboardEvents?: WhiteboardEvent[]; // NUEVO
  onStudentDraw?: () => void;
}

export interface WhiteboardRef {
  clearStudentLayer: () => void;
  clearTeacherLayer: () => void;
  executeAction: (action: BoardAction) => void;
  captureStudentDrawing: () => string | null;
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

const TEACHER_COLOR = "hsl(280, 80%, 60%)"; // Purple for teacher

// Helper to render math with KaTeX (handles mixed text + math)
function renderMathText(text: string): string {
  // Replace common patterns with LaTeX
  let processed = text
    // Handle x^2, y^3, etc. (variable followed by ^number)
    .replace(/([a-zA-Z])(\^)(\d+)/g, "$1^{$3}")
    // Handle (expression)^n
    .replace(/\(([^)]+)\)\^(\d+)/g, "($1)^{$2}")
    // Handle fractions like 1/2, a/b
    .replace(/(\d+)\/(\d+)/g, "\\frac{$1}{$2}")
    // Handle sqrt
    .replace(/sqrt\(([^)]+)\)/gi, "\\sqrt{$1}")
    .replace(/√\(([^)]+)\)/g, "\\sqrt{$1}")
    .replace(/√(\d+)/g, "\\sqrt{$1}");

  // Try to render each line, falling back to text if it fails
  const lines = processed.split("\n");
  const renderedLines = lines.map((line) => {
    // Check if line contains math-like content
    const hasMath = /[\^_{}\\]|\\frac|\\sqrt/.test(line);
    
    if (hasMath) {
      try {
        // Wrap the whole line in a math environment
        return katex.renderToString(line, {
          throwOnError: false,
          displayMode: false,
          output: "html",
        });
      } catch {
        // If KaTeX fails, return as plain text
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

export const LayeredWhiteboard = forwardRef<WhiteboardRef, LayeredWhiteboardProps>(function LayeredWhiteboard(
  {
    className = "",
    variant,
    boardActions = [],
    whiteboardEvents = [], // NUEVO
    onStudentDraw,
  },
  ref,
) {
  const isPrimary = variant === "primary";
  const COLORS = isPrimary ? PRIMARY_COLORS : HIGHSCHOOL_COLORS;

  const containerRef = useRef<HTMLDivElement>(null);
  const studentCanvasRef = useRef<HTMLCanvasElement>(null);
  const teacherCanvasRef = useRef<HTMLCanvasElement>(null);
  const mathOverlayRef = useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0].value);
  const [mathElements, setMathElements] = useState<Array<{ id: string; html: string; x: number; y: number; color: string }>>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    clearStudentLayer: () => {
      const canvas = studentCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    },
    clearTeacherLayer: () => {
      const canvas = teacherCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setMathElements([]);
    },
    executeAction: (action: BoardAction) => {
      const canvas = teacherCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) return;

      if (action.type === "clear") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setMathElements([]);
      } else if (action.type === "draw" && action.points && action.points.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = action.color || TEACHER_COLOR;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.moveTo(action.points[0].x, action.points[0].y);
        for (let i = 1; i < action.points.length; i++) {
          ctx.lineTo(action.points[i].x, action.points[i].y);
        }
        ctx.stroke();
      } else if (action.type === "text" && action.text && action.position) {
        // Use KaTeX for text
        const html = renderMathText(action.text);
        setMathElements(prev => [...prev, {
          id: crypto.randomUUID(),
          html,
          x: action.position!.x,
          y: action.position!.y,
          color: action.color || TEACHER_COLOR,
        }]);
      }
    },
    captureStudentDrawing: () => {
      const canvas = studentCanvasRef.current;
      if (!canvas) return null;
      // Check if canvas has any drawing (not completely empty)
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const hasContent = imageData.data.some((pixel, index) => {
        // Check alpha channel (every 4th byte)
        return index % 4 === 3 && pixel > 0;
      });
      if (!hasContent) return null;
      return canvas.toDataURL("image/png");
    },
  }));

  // Execute whiteboard events from backend (JSON format) - using KaTeX overlay
  useEffect(() => {
    if (whiteboardEvents.length === 0) return;

    const { width, height } = dimensionsRef.current;
    if (width === 0 || height === 0) return;

    const newMathElements: typeof mathElements = [];

    whiteboardEvents.forEach((event) => {
      if (event.type === "clear") {
        // Clear canvas too
        const canvas = teacherCanvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx && canvas) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setMathElements([]);
      } else if (event.type === "draw_text" && event.text) {
        // Calculate position - normalize coordinates if needed
        const x = event.x !== undefined ? (event.x <= 100 ? (event.x / 100) * width : event.x) : 20;
        const y = event.y !== undefined ? (event.y <= 100 ? (event.y / 100) * height : event.y) : 20;
        const textColor = event.color || TEACHER_COLOR;

        const html = renderMathText(event.text);
        newMathElements.push({
          id: event.id,
          html,
          x,
          y,
          color: textColor,
        });
      }
    });

    if (newMathElements.length > 0) {
      setMathElements(newMathElements);
    }
  }, [whiteboardEvents]);

  // Execute board actions from backend (legacy format)
  useEffect(() => {
    if (boardActions.length === 0) return;

    const canvas = teacherCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    boardActions.forEach((action) => {
      if (action.type === "clear") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else if (action.type === "draw" && action.points && action.points.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = action.color || TEACHER_COLOR;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const scale = dimensionsRef.current.width / 100; // Assuming backend sends normalized coords
        ctx.moveTo(action.points[0].x * scale, action.points[0].y * scale);
        for (let i = 1; i < action.points.length; i++) {
          ctx.lineTo(action.points[i].x * scale, action.points[i].y * scale);
        }
        ctx.stroke();
      }
    });
  }, [boardActions]);

  // Resize both canvases to fit container
  useEffect(() => {
    const resizeCanvases = () => {
      const container = containerRef.current;
      const studentCanvas = studentCanvasRef.current;
      const teacherCanvas = teacherCanvasRef.current;
      if (!container || !studentCanvas || !teacherCanvas) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Store student canvas content
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = studentCanvas.width;
      tempCanvas.height = studentCanvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx?.drawImage(studentCanvas, 0, 0);

      // Store teacher canvas content
      const tempTeacherCanvas = document.createElement("canvas");
      tempTeacherCanvas.width = teacherCanvas.width;
      tempTeacherCanvas.height = teacherCanvas.height;
      const tempTeacherCtx = tempTeacherCanvas.getContext("2d");
      tempTeacherCtx?.drawImage(teacherCanvas, 0, 0);

      // Resize both canvases
      [studentCanvas, teacherCanvas].forEach((canvas) => {
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

      // Restore drawings
      const studentCtx = studentCanvas.getContext("2d");
      if (studentCtx) {
        studentCtx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
      }

      const teacherCtx = teacherCanvas.getContext("2d");
      if (teacherCtx) {
        teacherCtx.drawImage(tempTeacherCanvas, 0, 0, rect.width, rect.height);
      }
    };

    resizeCanvases();
    window.addEventListener("resize", resizeCanvases);
    return () => window.removeEventListener("resize", resizeCanvases);
  }, []);

const getCoordinates = useCallback((e: React.PointerEvent): { x: number; y: number } | null => {
    const canvas = studentCanvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const canvas = studentCanvasRef.current;
      if (canvas) {
        canvas.setPointerCapture(e.pointerId);
      }
      const coords = getCoordinates(e);
      if (!coords) return;

      setIsDrawing(true);
      lastPointRef.current = coords;
      onStudentDraw?.();
    },
    [getCoordinates, onStudentDraw],
  );

  const draw = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      e.stopPropagation();

      const canvas = studentCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      const coords = getCoordinates(e);
      const lastPoint = lastPointRef.current;

      if (!ctx || !coords || !lastPoint) return;

      const bgColor = isPrimary ? "hsl(45, 80%, 95%)" : "hsl(222, 30%, 12%)";
      // Use highly visible colors for student strokes
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
    },
    [isDrawing, tool, color, getCoordinates, isPrimary],
  );

  const stopDrawing = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = studentCanvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }
    setIsDrawing(false);
    lastPointRef.current = null;
  }, []);

  const clearStudentCanvas = useCallback(() => {
    const canvas = studentCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={tool === "pen" ? "default" : "outline"}
          size={isPrimary ? "default" : "sm"}
          onClick={() => setTool("pen")}
          className={isPrimary ? "text-lg" : ""}
        >
          <Pencil className={isPrimary ? "h-5 w-5 mr-2" : "h-4 w-4 mr-1"} />
          {isPrimary ? "✏️ Lápiz" : "Lápiz"}
        </Button>

        <Button
          variant={tool === "eraser" ? "default" : "outline"}
          size={isPrimary ? "default" : "sm"}
          onClick={() => setTool("eraser")}
          className={isPrimary ? "text-lg" : ""}
        >
          <Eraser className={isPrimary ? "h-5 w-5 mr-2" : "h-4 w-4 mr-1"} />
          {isPrimary ? "🧹 Borrador" : "Borrador"}
        </Button>

        <div className="h-6 w-px bg-border mx-1" />

        {COLORS.map((c) => (
          <button
            key={c.value}
            onClick={() => {
              setColor(c.value);
              setTool("pen");
            }}
            className={`${isPrimary ? "w-10 h-10" : "w-7 h-7"} rounded-full border-2 transition-transform hover:scale-110 ${
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
          className={isPrimary ? "text-lg" : ""}
        >
          <Trash2 className={isPrimary ? "h-5 w-5 mr-2" : "h-4 w-4 mr-1"} />
          {isPrimary ? "🗑️ Borrar todo" : "Limpiar"}
        </Button>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className={`relative flex-1 min-h-[300px] rounded-xl border-2 overflow-hidden ${
          isPrimary ? "bg-[hsl(45,80%,95%)] border-amber-300" : "bg-[hsl(222,30%,12%)] border-border"
        }`}
        style={{ touchAction: "none" }}
      >
        {/* Teacher Layer (bottom) - for drawings */}
        <canvas ref={teacherCanvasRef} className="absolute inset-0 pointer-events-none" />

        {/* Math Overlay - KaTeX rendered text from AI */}
        <div
          ref={mathOverlayRef}
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          {mathElements.map((el) => (
            <div
              key={el.id}
              className={`absolute whitespace-pre-wrap ${
                isPrimary ? "text-lg" : "text-base"
              }`}
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
          className="absolute inset-0 cursor-crosshair"
          style={{ touchAction: "none" }}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          onPointerCancel={stopDrawing}
        />

        {/* Hint text */}
        {!isDrawing && mathElements.length === 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
            <span
              className={`text-sm px-3 py-1 rounded-full ${
                isPrimary ? "bg-amber-200/80 text-amber-800" : "bg-secondary/80 text-muted-foreground"
              }`}
            >
              {isPrimary ? "🎨 ¡Dibuja aquí mientras piensas!" : "Dibuja mientras resuelves"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
