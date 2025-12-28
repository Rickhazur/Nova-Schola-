import React, { useRef } from 'react';
import type { Language } from '@/types/research';
import { cn } from '@/lib/utils';
import { ClipboardPaste, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TextPasteAreaProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  language: Language;
  disabled?: boolean;
}

const safeSources = [
  { name: 'Kiddle', url: 'https://www.kiddle.co', icon: '🔍' },
  { name: 'Vikidia', url: 'https://es.vikidia.org', icon: '📚' },
  { name: 'National Geographic Kids', url: 'https://kids.nationalgeographic.com', icon: '🌍' },
  { name: 'DK Find Out', url: 'https://www.dkfindout.com', icon: '🔬' },
];

export function TextPasteArea({ value, onChange, onAnalyze, language, disabled }: TextPasteAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange(text);
      }
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };
  
  const handleClear = () => {
    onChange('');
    textareaRef.current?.focus();
  };
  
  const wordCount = value.split(/\s+/).filter(w => w.length > 0).length;
  const hasText = value.trim().length > 20;
  
  return (
    <div className="glass-panel p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-fredoka text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="text-2xl">📄</span>
          {language === 'es' ? 'Texto de investigación' : 'Research text'}
          <span className="text-xs font-normal text-muted-foreground ml-2">
            {language === 'es' ? '(Historia, Geografía, Ciencias...)' : '(History, Geography, Sciences...)'}
          </span>
        </h3>
        
        <div className="flex items-center gap-2">
          {value && (
            <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
              {wordCount} {language === 'es' ? 'palabras' : 'words'}
            </span>
          )}
        </div>
      </div>
      
      {/* Safe sources */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground">
          {language === 'es' ? 'Fuentes seguras:' : 'Safe sources:'}
        </span>
        {safeSources.map(source => (
          <a
            key={source.name}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full 
                       bg-accent-soft text-accent text-xs font-medium
                       hover:bg-accent hover:text-accent-foreground
                       transition-all duration-200"
          >
            <span>{source.icon}</span>
            <span>{source.name}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ))}
      </div>
      
      {/* Text area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={language === 'es' 
            ? 'Pega aquí el texto que encontraste sobre Historia, Geografía, Ciencias u otras asignaturas...'
            : 'Paste here text you found about History, Geography, Sciences or other subjects...'
          }
          className={cn(
            'w-full min-h-[200px] p-4 rounded-xl border-2 border-border',
            'bg-background text-foreground resize-none',
            'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
            'placeholder:text-muted-foreground/50',
            'transition-all duration-200',
            'font-nunito text-base leading-relaxed',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        
        {!value && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-muted-foreground/50">
              <ClipboardPaste className="w-12 h-12 mx-auto mb-2 animate-float" />
            </div>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePaste}
            disabled={disabled}
            className="gap-2"
          >
            <ClipboardPaste className="w-4 h-4" />
            {language === 'es' ? 'Pegar' : 'Paste'}
          </Button>
          
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="gap-2 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              {language === 'es' ? 'Limpiar' : 'Clear'}
            </Button>
          )}
        </div>
        
        <Button
          onClick={onAnalyze}
          disabled={!hasText || disabled}
          className="gap-2 bg-gradient-hero hover:opacity-90 text-primary-foreground shadow-glow-orange"
        >
          <span>🔍</span>
          {language === 'es' ? 'Analizar texto' : 'Analyze text'}
        </Button>
      </div>
    </div>
  );
}
