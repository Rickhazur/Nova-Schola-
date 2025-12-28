import React from 'react';
import type { SaveStatus as SaveStatusType } from '@/types/research';
import { cn } from '@/lib/utils';
import { Check, Loader2, AlertCircle, Save } from 'lucide-react';

interface SaveStatusProps {
  status: SaveStatusType;
  language: 'es' | 'en';
  onSave?: () => void;
}

const statusConfig = {
  idle: {
    es: 'Guardar',
    en: 'Save',
    icon: Save,
    className: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
  },
  saving: {
    es: 'Guardando...',
    en: 'Saving...',
    icon: Loader2,
    className: 'bg-warning/20 text-warning-foreground',
  },
  saved: {
    es: '¡Guardado!',
    en: 'Saved!',
    icon: Check,
    className: 'bg-success/20 text-success',
  },
  error: {
    es: 'Error al guardar',
    en: 'Save error',
    icon: AlertCircle,
    className: 'bg-destructive/20 text-destructive',
  },
};

export function SaveStatusIndicator({ status, language, onSave }: SaveStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  const isClickable = status === 'idle';
  
  return (
    <button
      onClick={isClickable ? onSave : undefined}
      disabled={!isClickable}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold',
        'transition-all duration-300',
        config.className,
        isClickable && 'cursor-pointer hover:shadow-soft active:scale-95',
        !isClickable && 'cursor-default'
      )}
    >
      <Icon 
        className={cn(
          'w-4 h-4',
          status === 'saving' && 'animate-spin'
        )} 
      />
      <span>{config[language]}</span>
    </button>
  );
}
