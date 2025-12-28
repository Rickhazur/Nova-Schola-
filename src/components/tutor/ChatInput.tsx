import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  isPrimary?: boolean;
  isLoading?: boolean;
  onSend: (message: string) => void;
}

export function ChatInput({ isPrimary = false, isLoading = false, onSend }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className={`p-3 border-t ${isPrimary ? "border-amber-200 bg-amber-50" : "border-border bg-card"}`}>
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={isPrimary ? "Escribe tu pregunta... ✏️" : "Escribe tu pregunta..."}
          className={`flex-1 px-3 py-2 rounded-lg border resize-none text-sm ${
            isPrimary 
              ? "bg-white border-amber-300 text-amber-900 placeholder:text-amber-400" 
              : "bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          } focus:outline-none focus:ring-2 focus:ring-primary`}
          rows={2}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          size="icon"
          className={isPrimary ? "bg-amber-500 hover:bg-amber-600 h-auto" : "h-auto"}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
