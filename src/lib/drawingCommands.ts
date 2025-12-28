// Drawing command types for the whiteboard system
// Canvas base: 800 x 600 (normalized coordinates)

export interface DrawingCommand {
  type: "circle" | "line" | "arrow" | "text" | "rect" | "image" | "group";
  // Common properties
  color?: string; // #RRGGBB format
  label?: string;
}

export interface CircleCommand extends DrawingCommand {
  type: "circle";
  x: number;
  y: number;
  radius: number;
}

export interface LineCommand extends DrawingCommand {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ArrowCommand extends DrawingCommand {
  type: "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TextCommand extends DrawingCommand {
  type: "text";
  x: number;
  y: number;
  text: string;
  size?: number;
}

export interface RectCommand extends DrawingCommand {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageCommand extends DrawingCommand {
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  url: string;
}

export interface GroupCommand extends DrawingCommand {
  type: "group";
  commands: AnyDrawingCommand[];
}

export type AnyDrawingCommand =
  | CircleCommand
  | LineCommand
  | ArrowCommand
  | TextCommand
  | RectCommand
  | ImageCommand
  | GroupCommand;

// Validation constants
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const MAX_COMMANDS = 200;
export const MAX_JSON_SIZE = 50 * 1024; // 50KB

// Image URL allowlist
const ALLOWED_IMAGE_DOMAINS = [
  "images.unsplash.com",
  "cdn.pixabay.com",
  "upload.wikimedia.org",
];

// Validate and sanitize drawing commands
export function sanitizeDrawingCommands(rawCommands: unknown): AnyDrawingCommand[] {
  if (!Array.isArray(rawCommands)) return [];
  const commandsArray = rawCommands.length > MAX_COMMANDS ? rawCommands.slice(0, MAX_COMMANDS) : rawCommands;

  const sanitized: AnyDrawingCommand[] = [];

  for (const cmd of commandsArray) {
    if (!cmd || typeof cmd !== "object" || !("type" in cmd)) continue;

    const validated = validateCommand(cmd as AnyDrawingCommand);
    if (validated) {
      sanitized.push(validated);
    }
  }

  return sanitized;
}

function validateCommand(cmd: AnyDrawingCommand): AnyDrawingCommand | null {
  const color = validateColor(cmd.color) || "#FFFFFF";

  switch (cmd.type) {
    case "circle": {
      const c = cmd as CircleCommand;
      if (!isValidCoord(c.x, CANVAS_WIDTH) || !isValidCoord(c.y, CANVAS_HEIGHT)) return null;
      if (typeof c.radius !== "number" || c.radius <= 0 || c.radius > 300) return null;
      return { ...c, color, x: clamp(c.x, 0, CANVAS_WIDTH), y: clamp(c.y, 0, CANVAS_HEIGHT) };
    }
    case "line":
    case "arrow": {
      const l = cmd as LineCommand | ArrowCommand;
      if (!isValidCoord(l.x1, CANVAS_WIDTH) || !isValidCoord(l.y1, CANVAS_HEIGHT)) return null;
      if (!isValidCoord(l.x2, CANVAS_WIDTH) || !isValidCoord(l.y2, CANVAS_HEIGHT)) return null;
      return {
        ...l,
        color,
        x1: clamp(l.x1, 0, CANVAS_WIDTH),
        y1: clamp(l.y1, 0, CANVAS_HEIGHT),
        x2: clamp(l.x2, 0, CANVAS_WIDTH),
        y2: clamp(l.y2, 0, CANVAS_HEIGHT),
      };
    }
    case "text": {
      const t = cmd as TextCommand;
      if (!isValidCoord(t.x, CANVAS_WIDTH) || !isValidCoord(t.y, CANVAS_HEIGHT)) return null;
      if (typeof t.text !== "string" || t.text.length > 500) return null;
      const size = typeof t.size === "number" ? clamp(t.size, 8, 72) : 20;
      return { ...t, color, size, x: clamp(t.x, 0, CANVAS_WIDTH), y: clamp(t.y, 0, CANVAS_HEIGHT) };
    }
    case "rect": {
      const r = cmd as RectCommand;
      if (!isValidCoord(r.x, CANVAS_WIDTH) || !isValidCoord(r.y, CANVAS_HEIGHT)) return null;
      if (typeof r.width !== "number" || r.width <= 0 || r.width > CANVAS_WIDTH) return null;
      if (typeof r.height !== "number" || r.height <= 0 || r.height > CANVAS_HEIGHT) return null;
      return { ...r, color, x: clamp(r.x, 0, CANVAS_WIDTH), y: clamp(r.y, 0, CANVAS_HEIGHT) };
    }
    case "image": {
      const i = cmd as ImageCommand;
      if (!isValidCoord(i.x, CANVAS_WIDTH) || !isValidCoord(i.y, CANVAS_HEIGHT)) return null;
      if (!isValidImageUrl(i.url)) return null;
      return { ...i, x: clamp(i.x, 0, CANVAS_WIDTH), y: clamp(i.y, 0, CANVAS_HEIGHT) };
    }
    case "group": {
      const g = cmd as GroupCommand;
      if (!Array.isArray(g.commands)) return null;
      const nestedCommands = g.commands
        .map(validateCommand)
        .filter((c): c is AnyDrawingCommand => c !== null);
      if (nestedCommands.length === 0) return null;
      return { type: "group", commands: nestedCommands };
    }
    default:
      return null;
  }
}

function isValidCoord(val: unknown, max: number): boolean {
  return typeof val === "number" && val >= 0 && val <= max;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function validateColor(color: unknown): string | null {
  if (typeof color !== "string") return null;
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color;
  return null;
}

function isValidImageUrl(url: unknown): boolean {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return ALLOWED_IMAGE_DOMAINS.some((domain) => parsed.hostname === domain);
  } catch {
    return false;
  }
}

// Generate drawing prompt for AI
export const DRAWING_COMMANDS_PROMPT = `Basándote en esta explicación: "<<COMPLETION_TEXT>>", genera únicamente UN JSON que contenga un array de comandos de dibujo para un canvas de 800x600. No incluyas texto adicional ni explicaciones. Usa el siguiente esquema de ejemplo:

[
  { "type":"circle", "x":200, "y":200, "radius":50, "color":"#FF6B6B", "label":"5" },
  { "type":"arrow", "x1":250, "y1":200, "x2":350, "y2":200, "color":"#95E1D3" },
  { "type":"text", "x":300, "y":150, "text":"?", "size":40, "color":"#FFE66D" }
]

Reglas estrictas:
- Solo devolver JSON válido (array de comandos).
- Máximo 200 comandos.
- Coordenadas X en [0,800], Y en [0,600].
- Colors en formato hex #RRGGBB.
- Tipos permitidos: circle, line, arrow, text, rect, image, group.
- Para imágenes solo devolver url si está en una lista de dominios permitidos.`;

// Regex to detect when drawing is needed
export const DRAWING_TRIGGER_REGEX = /dibuj|diagrama|círculo|flecha|gráfico|representa|dibuja|figura|ilustr|esquema|traza|pinta/i;
