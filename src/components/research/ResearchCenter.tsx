import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useResearchState } from '@/hooks/useResearchState';
import { GradeSelector } from './GradeSelector';
import { LanguageToggle } from './LanguageToggle';
import { SaveStatusIndicator } from './SaveStatus';
import { ProgressSteps } from './ProgressSteps';
import { TutorPanel } from './TutorPanel';
import { TextPasteArea } from './TextPasteArea';
import { ReportEditor } from './ReportEditor';
import { ReportCompleteness } from './ReportCompleteness';
import { ReportReview } from './ReportReview';
import { CitationHelper } from './CitationHelper';
import { WritingFeedbackPopup, generateWritingFeedback, type WritingFeedback } from './WritingFeedbackPopup';
import { BookOpen, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import tutorAvatar from '@/assets/tutor-avatar.png';
import type { SourceInfo } from '@/types/research';

export function ResearchCenter() {
  const {
    state,
    setSourceText,
    setParaphrasedText,
    analyzeSourceText,
    setGrade,
    setLanguage,
    saveNow,
    addSource,
    removeSource,
  } = useResearchState();
  
  const [currentFeedback, setCurrentFeedback] = useState<WritingFeedback | null>(null);
  const lastFeedbackId = useRef<string>('');
  const feedbackCooldown = useRef<boolean>(false);
  
  // Generate writing feedback as user types
  useEffect(() => {
    if (feedbackCooldown.current) return;
    
    const feedback = generateWritingFeedback(
      state.paraphrasedText,
      state.grade,
      state.language,
      state.sourceText
    );
    
    if (feedback && feedback.id !== lastFeedbackId.current) {
      lastFeedbackId.current = feedback.id;
      setCurrentFeedback(feedback);
      feedbackCooldown.current = true;
      
      // Cooldown to prevent feedback spam
      setTimeout(() => {
        feedbackCooldown.current = false;
      }, 5000);
    }
  }, [state.paraphrasedText, state.grade, state.language, state.sourceText]);
  
  const handleDismissFeedback = useCallback(() => {
    setCurrentFeedback(null);
  }, []);
  
  const handleStarterClick = (starter: string) => {
    // Insert starter text into the report
    const currentText = state.paraphrasedText;
    const newText = currentText 
      ? `${currentText}\n\n${starter} `
      : `${starter} `;
    setParaphrasedText(newText);
    
    // Also trigger the global insert function if available
    if ((window as any).__insertReportText) {
      (window as any).__insertReportText(starter + ' ');
    }
  };
  
  const handleInsertCitation = (citation: string) => {
    const currentText = state.paraphrasedText;
    const newText = currentText ? `${currentText} ${citation}` : citation;
    setParaphrasedText(newText);
    
    if ((window as any).__insertReportText) {
      (window as any).__insertReportText(citation);
    }
  };
  
  const handleSubmitReport = () => {
    saveNow();
    toast({
      title: state.language === 'es' ? '¡Reporte enviado!' : 'Report submitted!',
      description: state.language === 'es' 
        ? 'Tu reporte ha sido guardado. ¡Buen trabajo!' 
        : 'Your report has been saved. Great job!',
    });
  };
  
  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Writing Feedback Popup */}
      <WritingFeedbackPopup 
        feedback={currentFeedback} 
        onDismiss={handleDismissFeedback} 
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow-orange">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-fredoka text-xl font-bold text-foreground flex items-center gap-2">
                  {state.language === 'es' ? 'Centro de Investigación' : 'Research Center'}
                  <Sparkles className="w-4 h-4 text-primary animate-pulse-soft" />
                </h1>
                <p className="text-xs text-muted-foreground">
                  {state.language === 'es' 
                    ? '📚 Historia • 🌍 Geografía • 🔬 Ciencias • 📖 Sociales'
                    : '📚 History • 🌍 Geography • 🔬 Sciences • 📖 Social Studies'
                  }
                </p>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-4 flex-wrap">
              <GradeSelector 
                grade={state.grade} 
                onChange={setGrade} 
                language={state.language}
              />
              <LanguageToggle 
                language={state.language} 
                onChange={setLanguage} 
              />
              <SaveStatusIndicator 
                status={state.saveStatus} 
                language={state.language}
                onSave={saveNow}
              />
            </div>
          </div>
          
          {/* Progress */}
          <div className="mt-4">
            <ProgressSteps 
              currentStep={state.currentStep} 
              language={state.language} 
            />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Source Text & Editor */}
          <div className="space-y-6">
            <TextPasteArea
              value={state.sourceText}
              onChange={setSourceText}
              onAnalyze={analyzeSourceText}
              language={state.language}
              disabled={state.isAnalyzing}
            />
            
            {state.analysis && (
              <ReportEditor
                value={state.paraphrasedText}
                onChange={setParaphrasedText}
                language={state.language}
                analysis={state.analysis}
                disabled={state.isAnalyzing}
                grade={state.grade}
              />
            )}
          </div>
          
          {/* Right Column - Tutor & Progress */}
          <div className="lg:sticky lg:top-40 lg:self-start space-y-6">
            {/* Tutor Avatar */}
            <div className="flex items-center gap-4 p-4 glass-panel">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-glow-teal animate-float">
                <img src={tutorAvatar} alt="Nova Tutor" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="font-fredoka text-xl font-bold text-foreground">
                  {state.language === 'es' ? 'Tu Tutor Nova' : 'Your Nova Tutor'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {state.language === 'es' 
                    ? '¡Estoy aquí para ayudarte a escribir tu reporte!'
                    : 'I\'m here to help you write your report!'
                  }
                </p>
                <div className={`grade-badge grade-${state.grade} mt-2`}>
                  {state.language === 'es' ? `${state.grade}º Grado` : `Grade ${state.grade}`}
                </div>
              </div>
            </div>
            
            {/* Tutor Messages */}
            <TutorPanel
              messages={state.tutorMessages}
              isAnalyzing={state.isAnalyzing}
              language={state.language}
              onStarterClick={handleStarterClick}
            />
            
            {/* Citation Helper */}
            {state.analysis && (
              <CitationHelper
                grade={state.grade}
                language={state.language}
                sources={state.sources}
                onAddSource={addSource}
                onRemoveSource={removeSource}
                onInsertCitation={handleInsertCitation}
              />
            )}
            
            {/* Report Completeness Checklist */}
            {state.analysis && (
              <ReportCompleteness
                paraphrasedText={state.paraphrasedText}
                analysis={state.analysis}
                grade={state.grade}
                language={state.language}
              />
            )}
            
            {/* Report Review */}
            {state.analysis && (
              <ReportReview
                paraphrasedText={state.paraphrasedText}
                sourceText={state.sourceText}
                analysis={state.analysis}
                grade={state.grade}
                language={state.language}
                onRequestFeedback={handleSubmitReport}
              />
            )}
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-sm text-muted-foreground">
        <p>
          {state.language === 'es' 
            ? '🌟 ¡Recuerda usar siempre tus propias palabras!'
            : '🌟 Remember to always use your own words!'
          }
        </p>
      </footer>
    </div>
  );
}
