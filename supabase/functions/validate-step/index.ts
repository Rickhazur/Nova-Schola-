import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidationSpec {
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
  allowPartialDetection?: boolean;
  checks?: Array<{ checkType: string; regex?: string }>;
  acceptanceThreshold?: number;
}

interface StudentCommand {
  type: string;
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  radius?: number;
  width?: number;
  height?: number;
  label?: string;
  text?: string;
  color?: string;
  points?: Array<{ x: number; y: number }>;
}

interface RequestBody {
  sessionId: string;
  stepId: string;
  userId?: string;
  attemptNumber?: number;
  studentCommands?: StudentCommand[];
  snapshotBase64?: string;
  elapsedMs?: number;
  validationSpec: ValidationSpec;
  canvasWidth?: number;
  canvasHeight?: number;
}

interface ValidationResult {
  ok: boolean;
  score: number;
  failedChecks: string[];
  suggestedHintIndex: number;
  feedbackMessage: string;
}

// Normalize math expressions for comparison
function normalizeMathExpression(expr: string): string {
  return expr
    .replace(/\s+/g, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .toLowerCase();
}

// Check if two numbers are equal within tolerance
function numbersMatch(a: number, b: number, tolerance: number): boolean {
  return Math.abs(a - b) <= tolerance;
}

// Calculate distance between two points
function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Get centroid of a shape command
function getShapeCentroid(cmd: StudentCommand, canvasWidth = 800, canvasHeight = 600): { x: number; y: number } | null {
  if (cmd.type === "circle" && cmd.x !== undefined && cmd.y !== undefined) {
    return { x: cmd.x, y: cmd.y };
  }
  if (cmd.type === "rect" && cmd.x !== undefined && cmd.y !== undefined && cmd.width !== undefined && cmd.height !== undefined) {
    return { x: cmd.x + cmd.width / 2, y: cmd.y + cmd.height / 2 };
  }
  if (cmd.type === "line" && cmd.x1 !== undefined && cmd.y1 !== undefined && cmd.x2 !== undefined && cmd.y2 !== undefined) {
    return { x: (cmd.x1 + cmd.x2) / 2, y: (cmd.y1 + cmd.y2) / 2 };
  }
  if (cmd.type === "text" && cmd.x !== undefined && cmd.y !== undefined) {
    return { x: cmd.x, y: cmd.y };
  }
  if (cmd.type === "arrow" && cmd.x1 !== undefined && cmd.y1 !== undefined && cmd.x2 !== undefined && cmd.y2 !== undefined) {
    return { x: (cmd.x1 + cmd.x2) / 2, y: (cmd.y1 + cmd.y2) / 2 };
  }
  // For freehand drawing, estimate centroid from points
  if (cmd.points && cmd.points.length > 0) {
    const avgX = cmd.points.reduce((sum, p) => sum + p.x, 0) / cmd.points.length;
    const avgY = cmd.points.reduce((sum, p) => sum + p.y, 0) / cmd.points.length;
    return { x: avgX, y: avgY };
  }
  return null;
}

// Validate shape and label matching
function validateShapeAndLabel(
  studentCommands: StudentCommand[],
  spec: ValidationSpec,
  canvasWidth: number,
  canvasHeight: number
): { score: number; failedChecks: string[] } {
  const expectedShapes = spec.expectedShapes || [];
  const minMatches = spec.minMatches || expectedShapes.length;
  const failedChecks: string[] = [];
  let matchCount = 0;

  for (const expected of expectedShapes) {
    const tolerancePx = expected.tolerancePx || 50;
    
    // Convert expected coordinates if relative (0-100 scale)
    const expectedX = expected.relative ? (expected.approxX / 100) * canvasWidth : expected.approxX;
    const expectedY = expected.relative ? (expected.approxY / 100) * canvasHeight : expected.approxY;

    // Find matching student command
    let found = false;
    for (const cmd of studentCommands) {
      // Check type match (flexible - circles can be detected from freehand too)
      const typeMatches = cmd.type === expected.type || 
        (expected.type === "circle" && cmd.type === "freehand") ||
        (expected.type === "shape" && ["circle", "rect", "freehand"].includes(cmd.type));

      if (!typeMatches && expected.type !== "any") continue;

      const centroid = getShapeCentroid(cmd, canvasWidth, canvasHeight);
      if (!centroid) continue;

      const dist = distance(centroid.x, centroid.y, expectedX, expectedY);
      if (dist <= tolerancePx) {
        // Position matches, check label if required
        if (expected.labelRegex) {
          const label = cmd.label || cmd.text || "";
          const regex = new RegExp(expected.labelRegex, "i");
          if (regex.test(label)) {
            found = true;
            matchCount++;
            break;
          } else {
            failedChecks.push(`missing_label_${expected.labelRegex}`);
          }
        } else {
          found = true;
          matchCount++;
          break;
        }
      }
    }

    if (!found && !failedChecks.some(c => c.includes("missing_label"))) {
      failedChecks.push(`missing_shape_${expected.type}_at_${Math.round(expectedX)}_${Math.round(expectedY)}`);
    }
  }

  const score = expectedShapes.length > 0 ? matchCount / expectedShapes.length : (studentCommands.length > 0 ? 0.5 : 0);
  return { score: Math.min(score, 1), failedChecks };
}

// Validate math expression matching
function validateMathExpression(
  studentCommands: StudentCommand[],
  spec: ValidationSpec
): { score: number; failedChecks: string[] } {
  const failedChecks: string[] = [];
  const expectedNormalized = normalizeMathExpression(spec.expectedExpression || "");

  // Collect all text from student commands
  const studentText = studentCommands
    .filter(cmd => cmd.type === "text" || cmd.text)
    .map(cmd => cmd.text || cmd.label || "")
    .join(" ");

  const studentNormalized = normalizeMathExpression(studentText);

  if (studentNormalized.includes(expectedNormalized) || expectedNormalized.includes(studentNormalized)) {
    return { score: 1, failedChecks: [] };
  }

  // Partial match - check if key parts are present
  const expectedParts = expectedNormalized.split(/[=+\-*/]/);
  let matchedParts = 0;
  for (const part of expectedParts) {
    if (part && studentNormalized.includes(part)) {
      matchedParts++;
    }
  }

  const score = expectedParts.length > 0 ? matchedParts / expectedParts.length : 0;
  if (score < 1) {
    failedChecks.push("expression_mismatch");
  }

  return { score, failedChecks };
}

// Validate freeform with checks
function validateFreeformWithChecks(
  studentCommands: StudentCommand[],
  spec: ValidationSpec
): { score: number; failedChecks: string[] } {
  const failedChecks: string[] = [];
  const checks = spec.checks || [];
  let passedChecks = 0;

  // Collect all text
  const allText = studentCommands
    .map(cmd => cmd.text || cmd.label || "")
    .join(" ");

  for (const check of checks) {
    if (check.checkType === "contains_text" && check.regex) {
      const regex = new RegExp(check.regex, "i");
      if (regex.test(allText)) {
        passedChecks++;
      } else {
        failedChecks.push(`missing_text_${check.regex}`);
      }
    } else if (check.checkType === "has_drawing") {
      if (studentCommands.length > 0) {
        passedChecks++;
      } else {
        failedChecks.push("no_drawing");
      }
    }
  }

  const score = checks.length > 0 ? passedChecks / checks.length : (studentCommands.length > 0 ? 0.5 : 0);
  return { score, failedChecks };
}

// Validate hand written numbers
function validateHandWrittenNumbers(
  studentCommands: StudentCommand[],
  spec: ValidationSpec
): { score: number; failedChecks: string[] } {
  const failedChecks: string[] = [];
  const expectedNumbers = spec.expectedNumbers || [];
  let matchedNumbers = 0;

  // Extract numbers from text commands
  const studentNumbers: number[] = [];
  for (const cmd of studentCommands) {
    const text = cmd.text || cmd.label || "";
    const nums = text.match(/-?\d+\.?\d*/g);
    if (nums) {
      studentNumbers.push(...nums.map(n => parseFloat(n)));
    }
  }

  for (const expected of expectedNumbers) {
    const tolerance = expected.tolerance || 0;
    const found = studentNumbers.some(n => numbersMatch(n, expected.value, tolerance));
    if (found) {
      matchedNumbers++;
    } else {
      failedChecks.push(`missing_number_${expected.value}`);
    }
  }

  const score = expectedNumbers.length > 0 ? matchedNumbers / expectedNumbers.length : 0;
  return { score, failedChecks };
}

// Main validation function
function validateStudentAttempt(
  studentCommands: StudentCommand[],
  spec: ValidationSpec,
  canvasWidth = 800,
  canvasHeight = 600
): ValidationResult {
  const acceptanceThreshold = spec.acceptanceThreshold || 0.75;
  let result: { score: number; failedChecks: string[] };

  switch (spec.type) {
    case "shape_and_label_match":
      result = validateShapeAndLabel(studentCommands, spec, canvasWidth, canvasHeight);
      break;
    case "math_expression_match":
      result = validateMathExpression(studentCommands, spec);
      break;
    case "freeform_with_checks":
      result = validateFreeformWithChecks(studentCommands, spec);
      break;
    case "hand_written_number_match":
      result = validateHandWrittenNumbers(studentCommands, spec);
      break;
    default:
      // Structure match or unknown - basic validation
      result = {
        score: studentCommands.length > 0 ? 0.5 : 0,
        failedChecks: studentCommands.length === 0 ? ["no_content"] : []
      };
  }

  const ok = result.score >= acceptanceThreshold;
  
  // Generate feedback message
  let feedbackMessage = "";
  let suggestedHintIndex = 0;

  if (ok) {
    feedbackMessage = "¡Muy bien! Has completado este paso correctamente.";
  } else if (result.score >= 0.5) {
    feedbackMessage = "Vas por buen camino. Revisa los detalles que faltan.";
    suggestedHintIndex = 0;
  } else if (result.score >= 0.25) {
    feedbackMessage = "Intenta de nuevo. Mira la pista para ayudarte.";
    suggestedHintIndex = 1;
  } else {
    feedbackMessage = "Necesitas más práctica. Usa la pista o pide ayuda.";
    suggestedHintIndex = 2;
  }

  // Add specific feedback based on failed checks
  if (result.failedChecks.some(c => c.includes("missing_label"))) {
    feedbackMessage += " Recuerda escribir las etiquetas o números.";
  }
  if (result.failedChecks.some(c => c.includes("missing_shape"))) {
    feedbackMessage += " Falta dibujar algún elemento.";
  }
  if (result.failedChecks.includes("expression_mismatch")) {
    feedbackMessage += " Revisa tu expresión matemática.";
  }

  return {
    ok,
    score: result.score,
    failedChecks: result.failedChecks,
    suggestedHintIndex,
    feedbackMessage
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const {
      sessionId,
      stepId,
      userId,
      attemptNumber = 1,
      studentCommands = [],
      snapshotBase64,
      elapsedMs,
      validationSpec,
      canvasWidth = 800,
      canvasHeight = 600
    } = body;

    console.log(`Validating step ${stepId} for session ${sessionId}, attempt ${attemptNumber}`);
    console.log(`Student commands count: ${studentCommands.length}`);
    console.log(`Validation spec type: ${validationSpec?.type}`);

    if (!sessionId || !stepId || !validationSpec) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: sessionId, stepId, validationSpec" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the attempt
    const result = validateStudentAttempt(studentCommands, validationSpec, canvasWidth, canvasHeight);

    console.log(`Validation result: ok=${result.ok}, score=${result.score}`);

    // Store attempt in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: insertError } = await supabase.from("student_attempts").insert({
      user_id: userId || null,
      session_id: sessionId,
      step_id: stepId,
      attempt_number: attemptNumber,
      student_commands: studentCommands,
      snapshot_url: null, // Would store in storage if snapshot provided
      score: result.score,
      passed: result.ok,
      feedback: result.feedbackMessage,
      failed_checks: result.failedChecks,
      elapsed_ms: elapsedMs
    });

    if (insertError) {
      console.error("Error storing attempt:", insertError);
      // Don't fail the request, just log the error
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
