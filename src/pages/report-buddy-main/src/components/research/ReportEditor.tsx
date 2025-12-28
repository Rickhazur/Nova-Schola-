import React, { useRef, useEffect } from 'react';
import type { Language, TextAnalysis, Grade } from '@/types/research';
import { cn } from '@/lib/utils';
import { PenLine, AlertTriangle } from 'lucide-react';

interface ReportEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: Language;
  analysis: TextAnalysis | null;
  disabled?: boolean;
  grade: Grade;
}

export function ReportEditor({ value, onChange, language, analysis, disabled, grade }: ReportEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const wordCount = value.split(/\s+/).filter(w => w.length > 0).length;
  const isPlagiarism = analysis?.isPlagiarism ?? false;
  const plagiarismPercentage = analysis?.plagiarismPercentage ?? 0;
  
  // Grade-specific word targets (based on reference table)
  const gradeTargets = {
    1: { min: 50, max: 100 },
    2: { min: 50, max: 100 },
    3: { min: 120, max: 200 },
    4: { min: 120, max: 200 },
    5: { min: 200, max: 300 },
  };
  
  const target = gradeTargets[grade];
  const progress = Math.min((wordCount / target.min) * 100, 100);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(200, textareaRef.current.scrollHeight)}px`;
    }
  }, [value]);
  
  const insertAtCursor = (text: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newValue = value.substring(0, start) + text + value.substring(end);
    onChange(newValue);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + text.length;
        textareaRef.current.focus();
      }
    }, 0);
  };
  
  useEffect(() => {
    (window as any).__insertReportText = insertAtCursor;
    return () => { delete (window as any).__insertReportText; };
  }, [value]);
  
  return (
    <div className="glass-panel p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-fredoka text-lg font-semibold text-foreground flex items-center gap-2">
          <PenLine className="w-5 h-5 text-primary" />
          {language === 'es' ? 'Tu reporte' : 'Your report'}
        </h3>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs px-2 py-1 rounded-full font-medium',
              wordCount >= target.min ? 'bg-success/20 text-success' : 'bg-accent-soft text-accent'
            )}>
              {wordCount}/{target.min} {language === 'es' ? 'palabras' : 'words'}
            </span>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={cn('h-full transition-all duration-300', wordCount >= target.min ? 'bg-success' : 'bg-accent')} style={{ width: `${progress}%` }} />
            </div>
          </div>
          
          {isPlagiarism && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-destructive/20 text-destructive font-medium animate-pulse-soft">
              <AlertTriangle className="w-3 h-3" />
              {plagiarismPercentage}% {language === 'es' ? 'similar' : 'similar'}
            </span>
          )}
        </div>
      </div>
      
      {isPlagiarism && (
        <div className="plagiarism-warning">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            {language === 'es' ? '¡Alerta! Tu texto es muy parecido al original. Usa tus propias palabras.' : 'Alert! Your text is too similar to the original. Use your own words.'}
          </p>
        </div>
      )}
      
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={language === 'es' 
            ? `Escribe tu reporte aquí...\nPara ${grade}º grado: al menos ${target.min} palabras.`
            : `Write your report here...\nFor grade ${grade}: at least ${target.min} words.`}
          className={cn(
            'w-full min-h-[250px] p-4 rounded-xl border-2 bg-background text-foreground resize-none',
            'focus:outline-none transition-all duration-200 font-nunito text-base leading-relaxed placeholder:text-muted-foreground/50',
            isPlagiarism ? 'border-destructive/50 focus:border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        {!value && !disabled && (
          <div className="absolute bottom-4 left-4 text-muted-foreground/50 pointer-events-none">
            <span className="text-2xl animate-float">✏️</span>
          </div>
        )}
      </div>
      
      {wordCount > 0 && wordCount < target.min && (
        <p className="text-xs text-accent font-medium p-2 rounded-lg bg-accent/10">
          💡 {language === 'es' ? `Te faltan ${target.min - wordCount} palabras` : `You need ${target.min - wordCount} more words`}
        </p>
      )}
      
      {wordCount >= target.min && (
        <p className="text-xs text-success font-medium p-2 rounded-lg bg-success/10">
          ✨ {language === 'es' ? `¡Excelente tamaño para ${grade}º grado!` : `Excellent size for grade ${grade}!`}
        </p>
      )}
    </div>
  );
}
