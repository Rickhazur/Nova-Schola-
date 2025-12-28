import React, { useRef } from 'react';
import type { Language } from '@/types/research';
import { cn } from '@/lib/utils';
import { ClipboardPaste, ExternalLink, Trash2, Search, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TextPasteAreaProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  language: Language;
  disabled?: boolean;
}

const safeSources = [
  { name: 'Kiddle', url: 'https://www.kiddle.co', icon: '🔍', color: 'text-blue-500 bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { name: 'Vikidia', url: 'https://es.vikidia.org', icon: '📚', color: 'text-orange-500 bg-orange-50 border-orange-200 hover:bg-orange-100' },
  { name: 'NatGeo Kids', url: 'https://kids.nationalgeographic.com', icon: '🌍', color: 'text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100' },
  { name: 'DK Find Out', url: 'https://www.dkfindout.com', icon: '🔬', color: 'text-pink-500 bg-pink-50 border-pink-200 hover:bg-pink-100' },
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
    <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-indigo-50 relative overflow-hidden group hover:border-indigo-100 transition-all duration-300">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-pink-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>

      <div className="relative z-10 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-fredoka text-xl font-bold text-slate-700 flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100 text-2xl shadow-sm border border-indigo-200">
              📄
            </span>
            <div>
              {language === 'es' ? 'Texto de investigación' : 'Research text'}
              <span className="block text-xs font-medium text-slate-400 mt-0.5">
                {language === 'es' ? 'Historia, Geografía, Ciencias...' : 'History, Geography, Sciences...'}
              </span>
            </div>
          </h3>

          <div className="flex items-center gap-2">
            {value && (
              <span className="text-xs font-bold text-indigo-500 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
                {wordCount} {language === 'es' ? 'palabras' : 'words'}
              </span>
            )}
          </div>
        </div>

        {/* Safe sources */}
        <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              {language === 'es' ? 'Fuentes seguras:' : 'Safe sources:'}
            </span>
            {safeSources.map(source => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 shadow-sm hover:-translate-y-0.5",
                  source.color
                )}
              >
                <span>{source.icon}</span>
                <span>{source.name}</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            ))}
          </div>
        </div>

        {/* Text area */}
        <div className="relative group/textarea">
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
              'w-full min-h-[220px] p-5 rounded-2xl border-2 border-slate-200',
              'bg-white text-slate-700 resize-none',
              'focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 focus:outline-none',
              'placeholder:text-slate-300 placeholder:font-fredoka placeholder:text-lg',
              'transition-all duration-300 shadow-inner',
              'font-medium text-base leading-relaxed',
              disabled && 'opacity-50 cursor-not-allowed bg-slate-50'
            )}
          />

          {!value && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-slate-300 flex flex-col items-center gap-2 group-hover/textarea:text-indigo-300 transition-colors duration-300">
                <ClipboardPaste className="w-16 h-16 animate-bounce-slow" />
                <p className="font-fredoka text-lg">
                  {language === 'es' ? '¡Pega tu texto aquí!' : 'Paste your text here!'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePaste}
              disabled={disabled}
              className="gap-2 rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 font-bold"
            >
              <ClipboardPaste className="w-4 h-4" />
              {language === 'es' ? 'Pegar Texto' : 'Paste Text'}
            </Button>

            {value && (
              <Button
                variant="ghost"
                onClick={handleClear}
                disabled={disabled}
                className="gap-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 font-medium"
              >
                <Trash2 className="w-4 h-4" />
                {language === 'es' ? 'Borrar' : 'Clear'}
              </Button>
            )}
          </div>

          <Button
            onClick={onAnalyze}
            disabled={!hasText || disabled}
            className={cn(
              "gap-2 px-6 h-12 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all duration-300",
              !hasText || disabled
                ? "bg-slate-200 text-slate-400"
                : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-105 hover:shadow-xl hover:shadow-indigo-300 text-white"
            )}
          >
            <span className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              {language === 'es' ? 'Analizar Texto' : 'Analyze Text'}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
