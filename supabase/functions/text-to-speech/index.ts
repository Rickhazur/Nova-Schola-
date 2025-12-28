import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Tipos
type AgeGroup = "PRIMARY" | "HIGHSCHOOL";
type LanguageMode = "es" | "en" | "bridge";

interface RequestBody {
  text: string;
  profile?: AgeGroup;
  languageMode?: LanguageMode;
}

interface VoiceConfig {
  voiceId: string;
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
}

// Configuración de voces ElevenLabs
const VOICE_IDS = {
  PRIMARY_ES: "VmejBeYhbrcTPwDniox7",
  PRIMARY_EN: "oWjuL7HSoaEJRMDMP3HD",
  HIGHSCHOOL_ES: "4vbMkg7ssABMdO4dMh9i",
  HIGHSCHOOL_EN: "twAMWTText0eNf1AicWu",
};

const ELEVENLABS_MODEL = "eleven_multilingual_v2";
const MAX_TTS_CHARACTERS = 4000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getVoiceConfig(ageGroup: AgeGroup, languageMode: LanguageMode): VoiceConfig {
  const effectiveLanguage = languageMode === "en" ? "en" : "es";
  
  let voiceId: string;
  if (ageGroup === "PRIMARY") {
    voiceId = effectiveLanguage === "en" ? VOICE_IDS.PRIMARY_EN : VOICE_IDS.PRIMARY_ES;
  } else {
    voiceId = effectiveLanguage === "en" ? VOICE_IDS.HIGHSCHOOL_EN : VOICE_IDS.HIGHSCHOOL_ES;
  }

  const isPrimary = ageGroup === "PRIMARY";

  return {
    voiceId,
    stability: isPrimary ? 0.4 : 0.5,
    similarityBoost: isPrimary ? 0.85 : 0.75,
    style: isPrimary ? 0.6 : 0.4,
    useSpeakerBoost: true,
  };
}

// Normalización de texto matemático para TTS en español
function normalizeMathForTTS(text: string): string {
  if (!text) return text;
  let t = text;

  // 1. Quitar delimitadores LaTeX/Markdown
  t = t
    .replace(/\$\$(.+?)\$\$/gs, "$1")
    .replace(/\$(.+?)\$/gs, "$1")
    .replace(/\\\[(.+?)\\\]/gs, "$1")
    .replace(/\\\((.+?)\\\)/gs, "$1");

  // 2. LaTeX común a Unicode
  t = t
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\approx/g, "≈")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)");

  // Letras griegas
  t = t
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\delta/g, "δ")
    .replace(/\\theta/g, "θ")
    .replace(/\\pi/g, "π")
    .replace(/\\Delta/g, "Δ");

  // Funciones trigonométricas
  t = t.replace(/\\sin/g, "sin").replace(/\\cos/g, "cos").replace(/\\tan/g, "tan");

  // Símbolos de física
  t = t
    .replace(/\\rightarrow/g, "→")
    .replace(/\\degree/g, "°")
    .replace(/\\circ/g, "°")
    .replace(/\\infty/g, "∞");

  // Potencias
  t = t
    .replace(/\^2(?![0-9])/g, "²")
    .replace(/\^3(?![0-9])/g, "³")
    .replace(/\^\{([^}]+)\}/g, "^($1)");

  // Formateo
  t = t
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/\\\\/g, " ")
    .replace(/\\([a-zA-Z]+)/g, "$1");

  // 3. Símbolos a español hablado
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
    .replace(/\^/g, " elevado a ");

  // Limpiar espacios
  t = t.replace(/\s{2,}/g, " ").trim();

  return t;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      console.error("❌ ELEVENLABS_API_KEY no configurada");
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key no configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { text, profile = "HIGHSCHOOL", languageMode = "es" } = await req.json() as RequestBody;

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Texto vacío" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🎙️ TTS Request: profile=${profile}, lang=${languageMode}, chars=${text.length}`);

    // Normalizar y limitar texto
    const normalizedText = normalizeMathForTTS(text).substring(0, MAX_TTS_CHARACTERS);

    // Obtener configuración de voz
    const voiceConfig = getVoiceConfig(profile, languageMode);
    console.log(`🔊 Using voice: ${voiceConfig.voiceId}`);

    // Llamar a ElevenLabs
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}`;
    
    const response = await fetch(elevenLabsUrl, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: normalizedText,
        model_id: ELEVENLABS_MODEL,
        voice_settings: {
          stability: voiceConfig.stability,
          similarity_boost: voiceConfig.similarityBoost,
          style: voiceConfig.style,
          use_speaker_boost: voiceConfig.useSpeakerBoost,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ElevenLabs error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `ElevenLabs API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convertir audio a base64
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = btoa(
      new Uint8Array(audioBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    console.log(`✅ TTS generado: ${audioBase64.length} bytes en base64`);

    return new Response(
      JSON.stringify({ audioContent: audioBase64 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("❌ Error en text-to-speech:", error);
    const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
