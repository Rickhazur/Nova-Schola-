import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Trash2, Pencil } from "lucide-react";

interface WhiteboardProps {
  className?: string;
}

type Tool = "pen" | "eraser";

const COLORS = [
  { name: "Azul", value: "hsl(200, 100%, 50%)" },
  { name: "Rojo", value: "hsl(0, 100%, 50%)" },
  { name: "Verde", value: "hsl(140, 70%, 45%)" },
];

export function Whiteboard({ className = "" }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0].value);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Resize canvas to fit container
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Store current drawing
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx?.drawImage(canvas, 0, 0);

      // Resize
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        // Restore drawing
        ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const getCoordinates = useCallback(
    (e: React.TouchEvent | React.MouseEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      
      if ("touches" in e) {
        const touch = e.touches[0];
        if (!touch) return null;
        return {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
      }
      
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const startDrawing = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      const coords = getCoordinates(e);
      if (!coords) return;

      setIsDrawing(true);
      lastPointRef.current = coords;
    },
    [getCoordinates]
  );

  const draw = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDrawing) return;
      e.preventDefault();

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const coords = getCoordinates(e);
      const lastPoint = lastPointRef.current;

      if (!ctx || !coords || !lastPoint) return;

      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.strokeStyle = tool === "eraser" ? "hsl(222, 30%, 12%)" : color;
      ctx.lineWidth = tool === "eraser" ? 30 : 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      lastPointRef.current = coords;
    },
    [isDrawing, tool, color, getCoordinates]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPointRef.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
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
          size="sm"
          onClick={() => setTool("pen")}
        >
          <Pencil className="h-4 w-4 mr-1" />
          Lápiz
        </Button>

        <Button
          variant={tool === "eraser" ? "default" : "outline"}
          size="sm"
          onClick={() => setTool("eraser")}
        >
          <Eraser className="h-4 w-4 mr-1" />
          Borrador
        </Button>

        <div className="h-6 w-px bg-border mx-1" />

        {COLORS.map((c) => (
          <button
            key={c.value}
            onClick={() => {
              setColor(c.value);
              setTool("pen");
            }}
            className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
              color === c.value && tool === "pen"
                ? "border-foreground scale-110"
                : "border-transparent"
            }`}
            style={{ backgroundColor: c.value }}
            title={c.name}
          />
        ))}

        <div className="h-6 w-px bg-border mx-1" />

        <Button variant="outline" size="sm" onClick={clearCanvas}>
          <Trash2 className="h-4 w-4 mr-1" />
          Limpiar
        </Button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[200px] rounded-xl border border-border bg-[hsl(222,30%,12%)] overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
      </div>
    </div>
  );
}
