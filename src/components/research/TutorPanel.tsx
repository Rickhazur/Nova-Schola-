import React from 'react';
import type { TutorMessage, Language } from '@/types/research';
import { cn } from '@/lib/utils';
import { Lightbulb, AlertTriangle, Sparkles, Brain, Bot, PartyPopper } from 'lucide-react';
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
  encouragement: PartyPopper,
  analysis: Brain,
};

const typeStyles = {
  tip: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  warning: 'bg-red-50 border-red-200 text-red-800',
  encouragement: 'bg-green-50 border-green-200 text-green-800',
  analysis: 'bg-indigo-50 border-indigo-200 text-indigo-800',
};

const iconColors = {
  tip: 'text-yellow-500',
  warning: 'text-red-500',
  encouragement: 'text-green-500',
  analysis: 'text-indigo-500',
};

export function TutorPanel({ messages, isAnalyzing, language, onStarterClick }: TutorPanelProps) {
  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-3xl p-6 border-2 border-indigo-50 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-50/30 animate-pulse"></div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-md animate-bounce-slow">
            <img src={tutorAvatar} alt="Nova Tutor" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-fredoka text-xl font-bold text-slate-700 mb-2 flex items-center gap-2">
              {language === 'es' ? 'Analizando...' : 'Analyzing...'}
              <Brain className="w-5 h-5 text-indigo-500 animate-spin-slow" />
            </h3>
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0s' }}></span>
              <span className="w-3 h-3 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-6 border-2 border-indigo-100/50 shadow-sm text-center">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white p-2 shadow-inner">
          <img src={tutorAvatar} alt="Nova Tutor" className="w-full h-full object-cover rounded-full" />
        </div>
        <h3 className="font-fredoka text-xl font-bold text-slate-700 mb-2">
          {language === 'es' ? '¡Hola! Soy tu tutor' : 'Hello! I\'m your tutor'}
        </h3>
        <p className="text-slate-500 leading-relaxed max-w-sm mx-auto">
          {language === 'es'
            ? 'Pega un texto sobre Historia, Geografía, Ciencias u otra asignatura y te ayudaré a escribir tu reporte.'
            : 'Paste text about History, Geography, Sciences or another subject and I\'ll help you write your report.'
          }
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <span className="text-2xl animate-bounce" style={{ animationDelay: '0.1s' }}>📚</span>
          <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🌍</span>
          <span className="text-2xl animate-bounce" style={{ animationDelay: '0.3s' }}>🔍</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const Icon = typeIcons[message.type];

        return (
          <div
            key={message.id}
            className={cn(
              'rounded-2xl p-5 border-l-8 shadow-sm transition-all duration-500 hover:shadow-md hover:scale-[1.02]',
              typeStyles[message.type],
              'animate-in fade-in slide-in-from-bottom-4'
            )}
            style={{ animationDelay: `${index * 0.15}s` }}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm bg-white",
                iconColors[message.type]
              )}>
                {message.icon ? <span className="text-xl">{message.icon}</span> : <Icon className="w-5 h-5" />}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-fredoka font-bold text-sm uppercase tracking-wider opacity-80">
                    {message.type === 'warning' && (language === 'es' ? '¡Atención!' : 'Attention!')}
                    {message.type === 'tip' && (language === 'es' ? 'Consejo' : 'Tip')}
                    {message.type === 'encouragement' && (language === 'es' ? '¡Muy bien!' : 'Great Work!')}
                    {message.type === 'analysis' && (language === 'es' ? 'Análisis' : 'Analysis')}
                  </span>
                </div>

                <p className="text-base font-medium leading-relaxed mb-3">
                  {message.message}
                </p>

                {message.starters && message.starters.length > 0 && (
                  <div className="bg-white/60 rounded-xl p-3 border border-white/50">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-yellow-500" />
                      {language === 'es' ? 'Puedes empezar con:' : 'Start with:'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {message.starters.map((starter, i) => (
                        <button
                          key={i}
                          onClick={() => onStarterClick(starter)}
                          className="px-3 py-1.5 rounded-lg bg-white border-b-2 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-700 text-sm font-medium transition-all duration-200 active:translate-y-0.5 active:border-b-0 shadow-sm"
                        >
                          {starter}
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
