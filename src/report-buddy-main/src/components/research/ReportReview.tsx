import React, { useState } from 'react';
import type { Grade, Language, TextAnalysis } from '@/types/research';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Star, Award, RefreshCw, Send, Sparkles } from 'lucide-react';

interface ReportReviewProps {
  paraphrasedText: string;
  sourceText: string;
  analysis: TextAnalysis | null;
  grade: Grade;
  language: Language;
  onRequestFeedback: () => void;
}

interface ReviewResult {
  score: number;
  stars: number;
  feedback: string[];
  suggestions: string[];
  isReady: boolean;
}

function evaluateReport(
  text: string,
  sourceText: string,
  analysis: TextAnalysis | null,
  grade: Grade,
  language: Language
): ReviewResult {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 5).length;
  const paragraphCount = text.split(/\n\n+/).filter(p => p.trim().length > 20).length;
  
  const gradeExpectations = {
    1: { minWords: 15, minSentences: 2, paragraphs: 1 },
    2: { minWords: 25, minSentences: 3, paragraphs: 1 },
    3: { minWords: 40, minSentences: 4, paragraphs: 2 },
    4: { minWords: 60, minSentences: 5, paragraphs: 2 },
    5: { minWords: 80, minSentences: 6, paragraphs: 3 },
  };
  
  const exp = gradeExpectations[grade];
  const feedback: string[] = [];
  const suggestions: string[] = [];
  let score = 0;
  
  // Word count scoring (0-30 points)
  const wordRatio = Math.min(wordCount / exp.minWords, 1.5);
  score += Math.min(wordRatio * 20, 30);
  
  if (wordCount >= exp.minWords) {
    feedback.push(language === 'es' 
      ? `✓ Buen número de palabras (${wordCount})` 
      : `✓ Good word count (${wordCount})`);
  } else {
    suggestions.push(language === 'es'
      ? `Agrega ${exp.minWords - wordCount} palabras más`
      : `Add ${exp.minWords - wordCount} more words`);
  }
  
  // Sentence count scoring (0-20 points)
  const sentenceRatio = Math.min(sentenceCount / exp.minSentences, 1.5);
  score += Math.min(sentenceRatio * 15, 20);
  
  if (sentenceCount >= exp.minSentences) {
    feedback.push(language === 'es'
      ? `✓ Buenas oraciones completas (${sentenceCount})`
      : `✓ Good complete sentences (${sentenceCount})`);
  } else {
    suggestions.push(language === 'es'
      ? `Escribe ${exp.minSentences - sentenceCount} oraciones más`
      : `Write ${exp.minSentences - sentenceCount} more sentences`);
  }
  
  // Paragraph structure for higher grades (0-15 points)
  if (grade >= 3) {
    if (paragraphCount >= exp.paragraphs) {
      score += 15;
      feedback.push(language === 'es'
        ? `✓ Buena estructura con ${paragraphCount} párrafos`
        : `✓ Good structure with ${paragraphCount} paragraphs`);
    } else {
      suggestions.push(language === 'es'
        ? `Divide tu texto en ${exp.paragraphs} párrafos`
        : `Divide your text into ${exp.paragraphs} paragraphs`);
    }
  } else {
    score += 15;
  }
  
  // Originality scoring (0-35 points)
  const isPlagiarism = analysis?.isPlagiarism ?? false;
  const plagiarismPct = analysis?.plagiarismPercentage ?? 0;
  
  if (!isPlagiarism && plagiarismPct < 30) {
    score += 35;
    feedback.push(language === 'es'
      ? '✓ ¡Muy original! Usaste tus propias palabras'
      : '✓ Very original! You used your own words');
  } else if (plagiarismPct < 50) {
    score += 15;
    suggestions.push(language === 'es'
      ? 'Cambia más palabras para hacerlo más original'
      : 'Change more words to make it more original');
  } else {
    suggestions.push(language === 'es'
      ? '⚠️ Tu texto es muy parecido al original. ¡Reescríbelo!'
      : '⚠️ Your text is too similar to the original. Rewrite it!');
  }
  
  // Calculate stars (1-5)
  const stars = Math.max(1, Math.min(5, Math.ceil(score / 20)));
  
  // Determine if ready
  const isReady = score >= 70 && !isPlagiarism && wordCount >= exp.minWords;
  
  return { score: Math.round(score), stars, feedback, suggestions, isReady };
}

export function ReportReview({ 
  paraphrasedText, 
  sourceText, 
  analysis, 
  grade, 
  language,
  onRequestFeedback 
}: ReportReviewProps) {
  const [showReview, setShowReview] = useState(false);
  const [review, setReview] = useState<ReviewResult | null>(null);
  
  const handleReview = () => {
    const result = evaluateReport(paraphrasedText, sourceText, analysis, grade, language);
    setReview(result);
    setShowReview(true);
  };
  
  const handleTryAgain = () => {
    setShowReview(false);
    setReview(null);
  };
  
  const wordCount = paraphrasedText.split(/\s+/).filter(w => w.length > 0).length;
  
  if (wordCount < 10) {
    return null;
  }
  
  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Award className="w-5 h-5 text-primary" />
        <h3 className="font-fredoka text-lg font-semibold text-foreground">
          {language === 'es' ? 'Revisión del reporte' : 'Report review'}
        </h3>
      </div>
      
      {!showReview ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {language === 'es'
              ? '¿Terminaste de escribir? ¡Vamos a revisar tu reporte!'
              : 'Finished writing? Let\'s review your report!'}
          </p>
          <Button 
            onClick={handleReview}
            className="w-full bg-gradient-hero hover:opacity-90"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {language === 'es' ? 'Revisar mi reporte' : 'Review my report'}
          </Button>
        </div>
      ) : review && (
        <div className="space-y-4 animate-bubble-in">
          {/* Stars */}
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-8 h-8 transition-all',
                  i < review.stars 
                    ? 'text-warning fill-warning animate-pulse-soft' 
                    : 'text-muted-foreground/30'
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          
          {/* Score */}
          <div className="text-center">
            <span className="text-3xl font-fredoka font-bold text-gradient-hero">
              {review.score}/100
            </span>
          </div>
          
          {/* Status */}
          <div className={cn(
            'flex items-center justify-center gap-2 p-3 rounded-xl',
            review.isReady ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'
          )}>
            {review.isReady ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">
                  {language === 'es' ? '¡Tu reporte está listo!' : 'Your report is ready!'}
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">
                  {language === 'es' ? 'Casi listo, sigue mejorando' : 'Almost there, keep improving'}
                </span>
              </>
            )}
          </div>
          
          {/* Feedback */}
          {review.feedback.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {language === 'es' ? 'Lo que hiciste bien:' : 'What you did well:'}
              </p>
              <ul className="space-y-1">
                {review.feedback.map((item, i) => (
                  <li key={i} className="text-sm text-success flex items-start gap-2">
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Suggestions */}
          {review.suggestions.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {language === 'es' ? 'Para mejorar:' : 'To improve:'}
              </p>
              <ul className="space-y-1">
                {review.suggestions.map((item, i) => (
                  <li key={i} className="text-sm text-primary flex items-start gap-2">
                    <span>→ {item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleTryAgain}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {language === 'es' ? 'Seguir editando' : 'Keep editing'}
            </Button>
            {review.isReady && (
              <Button 
                onClick={onRequestFeedback}
                className="flex-1 bg-gradient-hero"
              >
                <Send className="w-4 h-4 mr-2" />
                {language === 'es' ? 'Enviar' : 'Submit'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
