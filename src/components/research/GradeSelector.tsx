import React from 'react';
import type { Grade } from '@/types/research';
import { cn } from '@/lib/utils';

interface GradeSelectorProps {
  grade: Grade;
  onChange: (grade: Grade) => void;
  language: 'es' | 'en';
}

const gradeLabels = {
  es: ['1º', '2º', '3º', '4º', '5º'],
  en: ['1st', '2nd', '3rd', '4th', '5th'],
};

// Distinct vibrant colors for each grade
const gradeStyles = [
  {
    active: 'bg-blue-500 text-white shadow-blue-200 ring-blue-200',
    inactive: 'bg-blue-50 text-blue-500 border-blue-100 hover:bg-blue-100'
  },
  {
    active: 'bg-emerald-500 text-white shadow-emerald-200 ring-emerald-200',
    inactive: 'bg-emerald-50 text-emerald-500 border-emerald-100 hover:bg-emerald-100'
  },
  {
    active: 'bg-amber-500 text-white shadow-amber-200 ring-amber-200',
    inactive: 'bg-amber-50 text-amber-500 border-amber-100 hover:bg-amber-100'
  },
  {
    active: 'bg-pink-500 text-white shadow-pink-200 ring-pink-200',
    inactive: 'bg-pink-50 text-pink-500 border-pink-100 hover:bg-pink-100'
  },
  {
    active: 'bg-purple-600 text-white shadow-purple-200 ring-purple-200',
    inactive: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100'
  },
];

export function GradeSelector({ grade, onChange, language }: GradeSelectorProps) {
  const labels = gradeLabels[language];

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest text-[10px]">
        {language === 'es' ? 'GRADO:' : 'GRADE:'}
      </span>
      <div className="flex gap-2">
        {([1, 2, 3, 4, 5] as Grade[]).map((g, i) => {
          const isActive = grade === g;
          const style = gradeStyles[i];

          return (
            <button
              key={g}
              onClick={() => onChange(g)}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300',
                'border-2',
                isActive
                  ? cn('scale-110 shadow-lg border-transparent ring-4 ring-offset-0', style.active)
                  : cn('scale-100 border-transparent', style.inactive)
              )}
            >
              {labels[i]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
