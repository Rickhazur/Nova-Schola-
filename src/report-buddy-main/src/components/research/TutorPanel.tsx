import React from 'react';
import type { TutorMessage, Language } from '@/types/research';
import { cn } from '@/lib/utils';
import { Lightbulb, AlertTriangle, Sparkles, Brain } from 'lucide-react';
import tutorAvatar from '@/assets/tutor-avatar.png';

interface TutorPanelProps {
  messages: TutorMessage[];
  isAnalyzing: boolean;
  language: Language;
  onStarterClick: (starter: string) => void;
}

const typeIcons = {
  tip: Lightbulb,
  warning: AlertTriangle,
  encouragement: Sparkles,
  analysis: Brain,
};

const typeStyles = {
  tip: 'border-l-accent bg-accent-soft',
  warning: 'border-l-destructive bg-destructive/10',
  encouragement: 'border-l-success bg-success/10',
  analysis: 'border-l-secondary bg-secondary-soft',
};

export function TutorPanel({ messages, isAnalyzing, language, onStarterClick }: TutorPanelProps) {
  if (isAnalyzing) {
    return (
      <div className="glass-panel p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden animate-pulse-soft">
            <img src={tutorAvatar} alt="Nova Tutor" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-fredoka text-lg font-semibold text-foreground mb-1">
              {language === 'es' ? 'Analizando...' : 'Analyzing...'}
            </h3>
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (messages.length === 0) {
    return (
      <div className="glass-panel p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden">
            <img src={tutorAvatar} alt="Nova Tutor" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-fredoka text-lg font-semibold text-foreground mb-1">
              {language === 'es' ? '¡Hola! Soy tu tutor' : 'Hello! I\'m your tutor'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === 'es' 
                ? 'Pega un texto sobre Historia, Geografía, Ciencias u otra asignatura y te ayudaré a escribir tu reporte.'
                : 'Paste text about History, Geography, Sciences or another subject and I\'ll help you write your report.'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const Icon = typeIcons[message.type];
        const isWarning = message.type === 'warning';
        
        return (
          <div
            key={message.id}
            className={cn(
              'rounded-2xl p-5 border-l-4 animate-bubble-in',
              typeStyles[message.type],
              isWarning && 'plagiarism-warning'
            )}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{message.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn(
                    'w-4 h-4',
                    isWarning ? 'text-destructive' : 'text-accent'
                  )} />
                  <span className="font-semibold text-sm uppercase tracking-wide">
                    {isWarning 
                      ? (language === 'es' ? 'Alerta' : 'Alert')
                      : (language === 'es' ? 'Pista' : 'Tip')
                    }
                  </span>
                </div>
                <p className={cn(
                  'text-sm leading-relaxed mb-4',
                  isWarning ? 'text-destructive font-medium' : 'text-foreground'
                )}>
                  {message.message}
                </p>
                
                {message.starters && message.starters.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {language === 'es' ? 'Empieza con:' : 'Start with:'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {message.starters.map((starter, i) => (
                        <button
                          key={i}
                          onClick={() => onStarterClick(starter)}
                          className="starter-pill"
                          style={{ animationDelay: `${0.1 + i * 0.1}s` }}
                        >
                          <span>✨</span>
                          <span>{starter}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
