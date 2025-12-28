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

const gradeColors = [
  'bg-grade-1 hover:bg-grade-1/90',
  'bg-grade-2 hover:bg-grade-2/90',
  'bg-grade-3 hover:bg-grade-3/90 text-foreground',
  'bg-grade-4 hover:bg-grade-4/90',
  'bg-grade-5 hover:bg-grade-5/90',
];

export function GradeSelector({ grade, onChange, language }: GradeSelectorProps) {
  const labels = gradeLabels[language];
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground mr-2">
        {language === 'es' ? 'Grado:' : 'Grade:'}
      </span>
      <div className="flex gap-1.5">
        {([1, 2, 3, 4, 5] as Grade[]).map((g, i) => (
          <button
            key={g}
            onClick={() => onChange(g)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-bold transition-all duration-200',
              'text-white shadow-soft',
              grade === g 
                ? cn(gradeColors[i], 'scale-110 ring-2 ring-offset-2 ring-primary/30') 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {labels[i]}
          </button>
        ))}
      </div>
    </div>
  );
}
