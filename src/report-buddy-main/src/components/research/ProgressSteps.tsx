import React from 'react';
import type { Step } from '@/types/research';
import { cn } from '@/lib/utils';
import { ClipboardPaste, Search, PenLine, CheckCircle } from 'lucide-react';

interface ProgressStepsProps {
  currentStep: Step;
  language: 'es' | 'en';
}

const steps: { id: Step; icon: typeof ClipboardPaste; labelEs: string; labelEn: string }[] = [
  { id: 'paste', icon: ClipboardPaste, labelEs: 'Pegar', labelEn: 'Paste' },
  { id: 'analyze', icon: Search, labelEs: 'Analizar', labelEn: 'Analyze' },
  { id: 'paraphrase', icon: PenLine, labelEs: 'Escribir', labelEn: 'Write' },
  { id: 'review', icon: CheckCircle, labelEs: 'Revisar', labelEn: 'Review' },
];

const stepOrder: Step[] = ['paste', 'analyze', 'paraphrase', 'review'];

export function ProgressSteps({ currentStep, language }: ProgressStepsProps) {
  const currentIndex = stepOrder.indexOf(currentStep);
  
  return (
    <div className="flex items-center justify-between w-full max-w-lg mx-auto">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isPending = index > currentIndex;
        
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'step-indicator',
                  isActive && 'active',
                  isCompleted && 'completed',
                  isPending && 'pending'
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={cn(
                  'text-xs font-medium transition-colors duration-300',
                  isActive && 'text-primary',
                  isCompleted && 'text-success',
                  isPending && 'text-muted-foreground'
                )}
              >
                {language === 'es' ? step.labelEs : step.labelEn}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-1 mx-2 rounded-full transition-colors duration-300',
                  index < currentIndex ? 'bg-success' : 'bg-muted'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
