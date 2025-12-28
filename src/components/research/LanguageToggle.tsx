import React from 'react';
import type { Language } from '@/types/research';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  language: Language;
  onChange: (language: Language) => void;
}

export function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  return (
    <div className="flex items-center gap-2 bg-muted rounded-full p-1">
      <Globe className="w-4 h-4 text-muted-foreground ml-2" />
      <button
        onClick={() => onChange('es')}
        className={cn(
          'px-3 py-1 rounded-full text-sm font-semibold transition-all duration-200',
          language === 'es'
            ? 'bg-primary text-primary-foreground shadow-soft'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        ES
      </button>
      <button
        onClick={() => onChange('en')}
        className={cn(
          'px-3 py-1 rounded-full text-sm font-semibold transition-all duration-200',
          language === 'en'
            ? 'bg-primary text-primary-foreground shadow-soft'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        EN
      </button>
    </div>
  );
}
