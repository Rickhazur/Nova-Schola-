/**
 * Normalizes LaTeX/math notation to readable Unicode text.
 * Used for chat, whiteboard, and TTS in the tutor.
 */
export function normalizeMathText(text: string): string {
  if (!text) return text;
  let t = text;

  // 1. Remove LaTeX/Markdown delimiters
  t = t
    .replace(/\$\$(.+?)\$\$/gs, "$1")  // $$...$$
    .replace(/\$(.+?)\$/gs, "$1")       // $...$
    .replace(/\\\[(.+?)\\\]/gs, "$1")   // \[...\]
    .replace(/\\\((.+?)\\\)/gs, "$1");  // \(...\)

  // 2. Common LaTeX replacements to Unicode

  // Basic operations
  t = t
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±")
    .replace(/\\mp/g, "∓");

  // Relational operators
  t = t
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\approx/g, "≈")
    .replace(/\\equiv/g, "≡")
    .replace(/\\propto/g, "∝")
    .replace(/\\ll/g, "≪")
    .replace(/\\gg/g, "≫");

  // Square roots and fractions
  t = t
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")                    // \sqrt{x} -> √(x)
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)");    // \frac{a}{b} -> (a)/(b)

  // Powers and indices (simple cases)
  t = t
    .replace(/\^2(?![0-9])/g, "²")
    .replace(/\^3(?![0-9])/g, "³")
    .replace(/\^n(?![a-z])/gi, "ⁿ")
    .replace(/\^\{([^}]+)\}/g, "^($1)")  // \^{abc} -> ^(abc)
    .replace(/_\{([^}]+)\}/g, "_$1");    // _{abc} -> _abc

  // Trigonometry
  t = t
    .replace(/\\sin/g, "sin")
    .replace(/\\cos/g, "cos")
    .replace(/\\tan/g, "tan")
    .replace(/\\cot/g, "cot")
    .replace(/\\sec/g, "sec")
    .replace(/\\csc/g, "csc")
    .replace(/\\arcsin/g, "arcsin")
    .replace(/\\arccos/g, "arccos")
    .replace(/\\arctan/g, "arctan");

  // Greek letters (common in math and physics)
  t = t
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\delta/g, "δ")
    .replace(/\\epsilon/g, "ε")
    .replace(/\\theta/g, "θ")
    .replace(/\\lambda/g, "λ")
    .replace(/\\mu/g, "μ")
    .replace(/\\pi/g, "π")
    .replace(/\\sigma/g, "σ")
    .replace(/\\omega/g, "ω")
    .replace(/\\phi/g, "φ")
    .replace(/\\psi/g, "ψ")
    .replace(/\\rho/g, "ρ")
    .replace(/\\tau/g, "τ")
    .replace(/\\nu/g, "ν");

  // Capital Greek letters
  t = t
    .replace(/\\Delta/g, "Δ")
    .replace(/\\Sigma/g, "Σ")
    .replace(/\\Omega/g, "Ω")
    .replace(/\\Pi/g, "Π")
    .replace(/\\Phi/g, "Φ")
    .replace(/\\Psi/g, "Ψ")
    .replace(/\\Gamma/g, "Γ")
    .replace(/\\Lambda/g, "Λ");

  // Physics symbols and arrows
  t = t
    .replace(/\\rightarrow/g, "→")
    .replace(/\\leftarrow/g, "←")
    .replace(/\\leftrightarrow/g, "↔")
    .replace(/\\Rightarrow/g, "⇒")
    .replace(/\\Leftarrow/g, "⇐")
    .replace(/\\Leftrightarrow/g, "⇔")
    .replace(/\\degree/g, "°")
    .replace(/\\circ/g, "°")
    .replace(/\\infty/g, "∞")
    .replace(/\\partial/g, "∂")
    .replace(/\\nabla/g, "∇")
    .replace(/\\int/g, "∫")
    .replace(/\\sum/g, "Σ")
    .replace(/\\prod/g, "Π");

  // Set theory
  t = t
    .replace(/\\in/g, "∈")
    .replace(/\\notin/g, "∉")
    .replace(/\\subset/g, "⊂")
    .replace(/\\subseteq/g, "⊆")
    .replace(/\\cup/g, "∪")
    .replace(/\\cap/g, "∩")
    .replace(/\\emptyset/g, "∅")
    .replace(/\\forall/g, "∀")
    .replace(/\\exists/g, "∃");

  // Formatting commands (remove them)
  t = t
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\textbf\{([^}]+)\}/g, "$1")
    .replace(/\\textit\{([^}]+)\}/g, "$1")
    .replace(/\\mathbf\{([^}]+)\}/g, "$1")
    .replace(/\\mathrm\{([^}]+)\}/g, "$1")
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/\\quad/g, " ")
    .replace(/\\qquad/g, "  ")
    .replace(/\\\\/g, " ")
    .replace(/\\,/g, " ")
    .replace(/\\;/g, " ")
    .replace(/\\!/g, "");

  // 3. Clean up any remaining backslashes before known commands
  t = t.replace(/\\([a-zA-Z]+)/g, "$1");

  // 4. Normalize spaces
  t = t.replace(/\s{2,}/g, " ");

  return t.trim();
}

/**
 * Converts math text for TTS - even simpler, read-aloud friendly.
 * Expands symbols to spoken words in Spanish.
 */
export function mathTextForTTS(text: string): string {
  let t = normalizeMathText(text);

  // Convert symbols to spoken Spanish equivalents
  t = t
    .replace(/×/g, " por ")
    .replace(/÷/g, " dividido entre ")
    .replace(/±/g, " más o menos ")
    .replace(/≤/g, " menor o igual que ")
    .replace(/≥/g, " mayor o igual que ")
    .replace(/≠/g, " diferente de ")
    .replace(/≈/g, " aproximadamente igual a ")
    .replace(/√/g, " raíz cuadrada de ")
    .replace(/²/g, " al cuadrado")
    .replace(/³/g, " al cubo")
    .replace(/π/g, " pi ")
    .replace(/θ/g, " theta ")
    .replace(/α/g, " alfa ")
    .replace(/β/g, " beta ")
    .replace(/γ/g, " gamma ")
    .replace(/Δ/g, " delta ")
    .replace(/°/g, " grados ")
    .replace(/∞/g, " infinito ")
    .replace(/→/g, " tiende a ")
    .replace(/⇒/g, " implica ")
    .replace(/∫/g, " integral de ")
    .replace(/Σ/g, " sumatoria de ")
    .replace(/∂/g, " derivada parcial ")
    .replace(/\^/g, " elevado a ");

  // Clean up spacing
  t = t.replace(/\s{2,}/g, " ").trim();

  return t;
}
