// src/config/voices.ts

export type AgeGroup = "PRIMARY" | "HIGHSCHOOL";
export type LanguageMode = "es" | "en" | "bridge";

export interface VoiceConfig {
  voiceId: string;
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
}

/**
 * Configuración de voces ElevenLabs para Nova Schola
 * 
 * Voces seleccionadas:
 * - Primaria ES: Lina (VmejBeYhbrcTPwDniox7) - Voz cálida y cercana para niños
 * - Primaria EN: Lina EN (oWjuL7HSoaEJRMDMP3HD) - Voz infantil en inglés
 * - Bachillerato ES: (4vbMkg7ssABMdO4dMh9i) - Voz seria y educativa
 * - Bachillerato EN: (twAMWTText0eNf1AicWu) - Voz neutra para adolescentes
 */
const VOICE_IDS = {
  PRIMARY_ES: "VmejBeYhbrcTPwDniox7",
  PRIMARY_EN: "oWjuL7HSoaEJRMDMP3HD",
  HIGHSCHOOL_ES: "4vbMkg7ssABMdO4dMh9i",
  HIGHSCHOOL_EN: "twAMWTText0eNf1AicWu",
};

/**
 * Obtiene la configuración de voz según edad y modo de idioma
 */
export function getVoiceConfig(
  ageGroup: AgeGroup,
  languageMode: LanguageMode
): VoiceConfig {
  // Determinar el idioma efectivo
  // Si es "bridge", usamos español por defecto (el tutor decide cuándo cambiar)
  const effectiveLanguage = languageMode === "en" ? "en" : "es";

  // Seleccionar voice ID
  let voiceId: string;

  if (ageGroup === "PRIMARY") {
    voiceId = effectiveLanguage === "en" ? VOICE_IDS.PRIMARY_EN : VOICE_IDS.PRIMARY_ES;
  } else {
    voiceId = effectiveLanguage === "en" ? VOICE_IDS.HIGHSCHOOL_EN : VOICE_IDS.HIGHSCHOOL_ES;
  }

  // Configuración de calidad de voz
  // Para niños: más estabilidad y expresividad
  // Para bachillerato: más neutralidad
  const isPrimary = ageGroup === "PRIMARY";

  return {
    voiceId,
    stability: isPrimary ? 0.4 : 0.5,
    similarityBoost: isPrimary ? 0.85 : 0.75,
    style: isPrimary ? 0.6 : 0.4,
    useSpeakerBoost: true,
  };
}

/**
 * Modelo de ElevenLabs a usar
 * eleven_multilingual_v2 soporta 29 idiomas incluyendo español e inglés
 */
export const ELEVENLABS_MODEL = "eleven_multilingual_v2";

/**
 * Límite de caracteres por solicitud (para evitar costos excesivos)
 */
export const MAX_TTS_CHARACTERS = 4000;
