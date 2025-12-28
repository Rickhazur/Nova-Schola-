import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { normalizeMathText, mathTextForTTS } from "@/lib/mathText";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status?: "UNDERSTOOD" | "PARTIAL" | "CONFUSED";
  skill?: string;
}

// NUEVO: tipos para whiteboard events
export type WhiteboardEventType = "draw_text" | "clear";

export interface WhiteboardEvent {
  id: string;
  type: WhiteboardEventType;
  text?: string;
  x?: number;
  y?: number;
  color?: string;
}

interface TutorResponse {
  reply: string;
  status: "UNDERSTOOD" | "PARTIAL" | "CONFUSED";
  skill: string;
  sessionId?: string;
  boardActions?: any[];
  whiteboardEvents?: WhiteboardEvent[];
  error?: string;
}

interface UseTutorSessionOptions {
  ageGroup: "PRIMARY" | "HIGHSCHOOL";
  studentName: string;
  studentId?: string;
  languageMode?: "es" | "en" | "bridge";
  sessionMode?: "default" | "ingles_integrador" | "mate_tableros";
  onBoardActions?: (actions: any[]) => void;
  onWhiteboardEvents?: (events: WhiteboardEvent[]) => void;
  ttsEnabled?: boolean;
}

// Call the Socratic Tutor backend
async function callSocraticTutor(
  ageGroup: "PRIMARY" | "HIGHSCHOOL",
  userMessage: string,
  chatHistory: { role: "user" | "assistant"; content: string }[],
  studentId: string,
  studentName?: string,
  sessionId?: string,
  imageBase64?: string,
  languageMode: "es" | "en" | "bridge" = "es",
  mode?: string, // NUEVO: modo de sesión
): Promise<TutorResponse> {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/socratic-tutor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ageGroup,
      userMessage,
      chatHistory,
      studentId,
      studentName,
      sessionId,
      imageBase64,
      languageMode,
      mode, // NUEVO: enviar modo al backend
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 429) {
      throw new Error("Demasiadas solicitudes. Por favor, espera un momento.");
    }
    throw new Error(errorData.error || "Error al comunicarse con el tutor");
  }

  return response.json();
}

// Generate TTS audio using ElevenLabs via edge function
async function generateTTS(
  text: string,
  ageGroup: "PRIMARY" | "HIGHSCHOOL",
  languageMode: "es" | "en" | "bridge" = "es"
): Promise<string | null> {
  try {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

    // Adaptar texto para TTS (sin LaTeX feo, con símbolos hablados)
    const ttsText = mathTextForTTS(text).substring(0, 4000);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/text-to-speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: ttsText,
        profile: ageGroup,
        languageMode, // Pasar idioma para selección de voz
      }),
    });

    if (!response.ok) {
      console.error("TTS API error:", response.status);
      return null;
    }

    const data = await response.json();
    if (data.audioContent) {
      return `data:audio/mpeg;base64,${data.audioContent}`;
    }
    return null;
  } catch (error) {
    console.error("TTS generation failed:", error);
    return null;
  }
}

export function useTutorSession({
  ageGroup,
  studentName,
  studentId: externalStudentId,
  languageMode = "es",
  sessionMode = "default", // NUEVO
  onBoardActions,
  onWhiteboardEvents,
  ttsEnabled = true,
}: UseTutorSessionOptions) {
  const isPrimary = ageGroup === "PRIMARY";

  // NUEVO: Mensaje inicial según el modo
  const getInitialMessage = () => {
    if (sessionMode === "ingles_integrador") {
      return isPrimary
        ? "¡Hola! 👋 Soy Nova, tu tutor de Inglés Integrador. Antes de empezar, cuéntame: ¿Qué temas estás viendo esta semana en tus otras clases como Sociales, Ciencias o Matemáticas? 📚"
        : "¡Hola! Soy Nova, tu tutor de Inglés Integrador. Para comenzar, ¿puedes contarme qué temas estás estudiando esta semana en tus otras materias (Sociales, Ciencias, Matemáticas, Ética, etc.)? Así podemos trabajar el inglés conectado con lo que ya estás aprendiendo.";
    }
    return isPrimary
      ? "¡Hola! 👋 Soy Nova, tu tutor. ¡Mantén presionado el micrófono y cuéntame en qué necesitas ayuda! También puedes dibujar en la pizarra."
      : "¡Hola! Soy Nova, tu tutor. Pulsa el micrófono para hablarme o dibuja en la pizarra mientras resuelves el ejercicio.";
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: getInitialMessage(),
      timestamp: new Date(),
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [isTutorSpeaking, setIsTutorSpeaking] = useState(false);
  const [currentSkill, setCurrentSkill] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isWaitingForBoard, setIsWaitingForBoard] = useState(false); // NUEVO

  // Use external studentId if provided, otherwise generate a temporary one
  const studentId = externalStudentId || `guest_${Date.now()}`;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = () => setIsTutorSpeaking(false);
    audioRef.current.onerror = () => setIsTutorSpeaking(false);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stopTutorAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsTutorSpeaking(false);
  }, []);

  const playTutorAudio = useCallback(async (audioUrl: string) => {
    if (!audioRef.current) return;

    try {
      audioRef.current.src = audioUrl;
      setIsTutorSpeaking(true);
      await audioRef.current.play();
    } catch (error) {
      console.error("Audio playback failed:", error);
      setIsTutorSpeaking(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string, imageBase64?: string) => {
      if (!content.trim() && !imageBase64) return;

      // Stop any playing audio first
      stopTutorAudio();

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: content || "📷 [Imagen subida]",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const chatHistory = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));

        const response = await callSocraticTutor(
          ageGroup,
          content || "Por favor analiza esta imagen",
          chatHistory,
          studentId,
          studentName,
          sessionId || undefined,
          imageBase64,
          languageMode,
          sessionMode === "ingles_integrador" ? "ingles_integrador" : undefined, // NUEVO
        );

        if (response.sessionId && !sessionId) {
          setSessionId(response.sessionId);
        }

        // Handle board actions if present (legacy)
        if (response.boardActions && onBoardActions) {
          onBoardActions(response.boardActions);
        }

        // Handle whiteboard events
        if (response.whiteboardEvents && onWhiteboardEvents) {
          onWhiteboardEvents(response.whiteboardEvents);
        }

        // NUEVO: Procesar etiquetas y normalizar texto
        const rawReply = response.reply || "";

        // Detectar etiquetas de flujo
        const waitingTagRegex = /\[ESPERANDO_TABLERO\]/i;
        const nextStepTagRegex = /\[SIGUIENTE_PASO\]/i;

        // ¿Nova está esperando que el estudiante use el tablero?
        const isWaiting = waitingTagRegex.test(rawReply);
        setIsWaitingForBoard(isWaiting);

        // Eliminar etiquetas del texto visible para el estudiante
        const replyWithoutTags = rawReply.replace(waitingTagRegex, "").replace(nextStepTagRegex, "").trim();

        // Normalizar la parte matemática para mostrarla en el chat
        const normalizedReplyForChat = normalizeMathText(replyWithoutTags);

        // Generate TTS only if enabled
        let audioUrl: string | null = null;
        if (ttsEnabled) {
          try {
            audioUrl = await generateTTS(replyWithoutTags, ageGroup, languageMode);
          } catch (err) {
            console.error("TTS generation failed:", err);
          }
        }

        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: normalizedReplyForChat, // NUEVO: usar texto normalizado
          timestamp: new Date(),
          status: response.status,
          skill: response.skill,
        };

        setMessages((prev) => [...prev, aiResponse]);
        setCurrentSkill(response.skill);

        // Play audio response if TTS enabled
        if (audioUrl && ttsEnabled) {
          await playTutorAudio(audioUrl);
        }
      } catch (error) {
        console.error("Tutor error:", error);
        toast.error(error instanceof Error ? error.message : "Error al comunicarse con el tutor");

        const fallbackResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: isPrimary
            ? "¡Ups! Tuve un problemita. ¿Puedes intentar de nuevo? 🙏"
            : "Error de conexión. Por favor, intenta de nuevo.",
          timestamp: new Date(),
          status: "CONFUSED",
        };
        setMessages((prev) => [...prev, fallbackResponse]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      ageGroup,
      messages,
      sessionId,
      studentId,
      studentName,
      languageMode,
      sessionMode,
      stopTutorAudio,
      playTutorAudio,
      onBoardActions,
      onWhiteboardEvents,
      isPrimary,
      ttsEnabled,
    ],
  );

  return {
    messages,
    isLoading,
    isTutorSpeaking,
    currentSkill,
    sessionId,
    isWaitingForBoard, // NUEVO
    sendMessage,
    stopTutorAudio,
  };
}
