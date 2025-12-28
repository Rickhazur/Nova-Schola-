import { useState, useRef, useCallback } from "react";

export interface VoiceRecorderState {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
}

interface UseVoiceRecorderOptions {
  onTranscription: (text: string) => void;
  onError?: (error: string) => void;
}

// Placeholder function for transcription - will be replaced with OpenAI API call
async function transcribeAudio(audioBlob: Blob): Promise<string> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  // Placeholder response - in production, send audioBlob to OpenAI Whisper API
  console.log("Audio blob ready for transcription:", audioBlob.size, "bytes");
  
  // Return a placeholder message for now
  return "Esto es un mensaje de prueba transcrito por voz.";
}

export function useVoiceRecorder({ onTranscription, onError }: UseVoiceRecorderOptions) {
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    isProcessing: false,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setState({ isRecording: true, isProcessing: false, error: null });
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") 
          ? "audio/webm" 
          : "audio/mp4",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        if (chunksRef.current.length === 0) {
          setState({ isRecording: false, isProcessing: false, error: null });
          return;
        }

        setState({ isRecording: false, isProcessing: true, error: null });

        try {
          const audioBlob = new Blob(chunksRef.current, { 
            type: mediaRecorder.mimeType 
          });
          
          const transcription = await transcribeAudio(audioBlob);
          onTranscription(transcription);
          setState({ isRecording: false, isProcessing: false, error: null });
        } catch (err) {
          const errorMessage = "No se pudo transcribir el audio. Inténtalo de nuevo.";
          setState({ isRecording: false, isProcessing: false, error: errorMessage });
          onError?.(errorMessage);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
    } catch (err) {
      let errorMessage = "No se pudo acceder al micrófono.";
      
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          errorMessage = "Permiso de micrófono denegado. Por favor, habilítalo en tu navegador.";
        } else if (err.name === "NotFoundError") {
          errorMessage = "No se encontró ningún micrófono en tu dispositivo.";
        }
      }

      setState({ isRecording: false, isProcessing: false, error: errorMessage });
      onError?.(errorMessage);
    }
  }, [onTranscription, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [state.isRecording]);

  const toggleRecording = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  return {
    ...state,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
