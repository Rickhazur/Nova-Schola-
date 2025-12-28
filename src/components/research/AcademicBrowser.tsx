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

interface AcademicBrowserProps {
    projectId: string;
    onSourceSaved?: () => void;
    initialQuery?: string;
    initialReportContent?: string;
    onSaveReport?: (content: string) => void;
    studentLevel?: 'primary' | 'highschool';
    grade?: number;
}

export function AcademicBrowser({
    projectId,
    onSourceSaved,
    initialQuery,
    initialReportContent,
    onSaveReport,
    studentLevel,
    grade: initialGrade,
}: AcademicBrowserProps) {
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

    // Sync initial props
    useEffect(() => {
        if (initialReportContent) {
            setParaphrasedText(initialReportContent);
        }
    }, [initialReportContent, setParaphrasedText]);

    useEffect(() => {
        if (initialGrade) {
            // @ts-ignore
            setGrade(initialGrade as any);
        }
    }, [initialGrade, setGrade]);

    // Sync back to parent
    useEffect(() => {
        // Autosave to parent when text changes (debounced by parent's expectation usually, but here we can just call it)
        // Or hook into saveStatus
        if (state.saveStatus === 'saved' || state.saveStatus === 'saving') {
            onSaveReport?.(state.paraphrasedText);
        }
    }, [state.paraphrasedText, state.saveStatus, onSaveReport]);

    // When a source is added, notify parent
    useEffect(() => {
        if (state.sources.length > 0) {
            onSourceSaved?.();
        }
    }, [state.sources, onSourceSaved]);

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
        onSaveReport?.(state.paraphrasedText);
        toast({
            title: state.language === 'es' ? '¡Reporte enviado!' : 'Report submitted!',
            description: state.language === 'es'
                ? 'Tu reporte ha sido guardado. ¡Buen trabajo!'
                : 'Your report has been saved. Great job!',
        });
    };

    return (
        <div className="flex flex-col h-screen max-h-[85vh] bg-gradient-to-br from-[#FFF5F5] via-[#FFF0F5] to-[#F0F7FF] rounded-3xl overflow-hidden border-4 border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            {/* Writing Feedback Popup */}
            <WritingFeedbackPopup
                feedback={currentFeedback}
                onDismiss={handleDismissFeedback}
            />

            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-indigo-50 z-10">
                <div className="p-4 md:px-8 md:py-5">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* Logo & Title */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-200 transform hover:scale-105 transition-transform duration-200">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="font-fredoka text-2xl font-bold text-slate-800 flex items-center gap-2">
                                    {state.language === 'es' ? 'Centro de Investigación' : 'Research Center'}
                                    <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                                </h1>
                                <p className="text-sm font-medium text-slate-500 bg-slate-100/50 px-2 py-0.5 rounded-full inline-block mt-1">
                                    {state.language === 'es'
                                        ? '📚 Historia • 🌍 Geografía • 🔬 Ciencias • 📖 Sociales'
                                        : '📚 History • 🌍 Geography • 🔬 Sciences • 📖 Social Studies'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-3 flex-wrap bg-white/50 p-2 rounded-xl border border-indigo-50/50 backdrop-blur-sm">
                            <GradeSelector
                                grade={state.grade}
                                onChange={setGrade}
                                language={state.language}
                            />
                            <div className="h-6 w-px bg-slate-200 mx-1"></div>
                            <LanguageToggle
                                language={state.language}
                                onChange={setLanguage}
                            />
                            <div className="h-6 w-px bg-slate-200 mx-1"></div>
                            <SaveStatusIndicator
                                status={state.saveStatus}
                                language={state.language}
                                onSave={saveNow}
                            />
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-6">
                        <ProgressSteps
                            currentStep={state.currentStep}
                            language={state.language}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                <div className="grid lg:grid-cols-2 gap-8 h-full">
                    {/* Left Column - Source Text & Editor */}
                    <div className="space-y-6 animate-slide-in-left" style={{ animationDuration: '0.4s' }}>
                        <TextPasteArea
                            value={state.sourceText}
                            onChange={setSourceText}
                            onAnalyze={analyzeSourceText}
                            language={state.language}
                            disabled={state.isAnalyzing}
                        />

                        {state.analysis && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                                <ReportEditor
                                    value={state.paraphrasedText}
                                    onChange={setParaphrasedText}
                                    language={state.language}
                                    analysis={state.analysis}
                                    disabled={state.isAnalyzing}
                                    grade={state.grade}
                                />
                            </div>
                        )}
                    </div>

                    {/* Right Column - Tutor & Progress */}
                    <div className="space-y-6 animate-slide-in-right" style={{ animationDuration: '0.6s' }}>
                        {/* Tutor Avatar */}
                        <div className="flex items-center gap-5 p-5 bg-white rounded-3xl border-2 border-indigo-50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 group-hover:bg-indigo-100 transition-colors"></div>

                            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-indigo-100 border-4 border-white z-10 shrink-0 transform group-hover:rotate-3 transition-transform duration-300">
                                <img src={tutorAvatar} alt="Nova Tutor" className="w-full h-full object-cover" />
                            </div>
                            <div className="z-10">
                                <h2 className="font-fredoka text-xl font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                    {state.language === 'es' ? 'Tu Tutor Nova' : 'Your Nova Tutor'}
                                </h2>
                                <p className="text-sm text-slate-500 max-w-[200px] leading-relaxed">
                                    {state.language === 'es'
                                        ? '¡Estoy aquí para ayudarte a escribir tu reporte!'
                                        : 'I\'m here to help you write your report!'
                                    }
                                </p>
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold mt-2 bg-indigo-100 text-indigo-700 border border-indigo-200`}>
                                    <BookOpen className="w-3 h-3" />
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
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
                                <CitationHelper
                                    grade={state.grade}
                                    language={state.language}
                                    sources={state.sources}
                                    onAddSource={addSource}
                                    onRemoveSource={removeSource}
                                    onInsertCitation={handleInsertCitation}
                                />
                            </div>
                        )}

                        {/* Report Completeness Checklist */}
                        {state.analysis && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
                                <ReportCompleteness
                                    paraphrasedText={state.paraphrasedText}
                                    analysis={state.analysis}
                                    grade={state.grade}
                                    language={state.language}
                                />
                            </div>
                        )}

                        {/* Report Review */}
                        {state.analysis && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-300">
                                <ReportReview
                                    paraphrasedText={state.paraphrasedText}
                                    sourceText={state.sourceText}
                                    analysis={state.analysis}
                                    grade={state.grade}
                                    language={state.language}
                                    onRequestFeedback={handleSubmitReport}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-white/50 p-3 border-t border-indigo-50/50 text-center text-xs font-medium text-slate-400">
                <p className="flex items-center justify-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    {state.language === 'es'
                        ? '¡Recuerda usar siempre tus propias palabras!'
                        : 'Remember to always use your own words!'
                    }
                    <Sparkles className="w-3 h-3" />
                </p>
            </div>
        </div>
    );
}
