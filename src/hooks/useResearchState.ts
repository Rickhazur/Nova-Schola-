import { useState, useCallback, useEffect, useRef } from 'react';
import type { ResearchState, Step, Grade, Language, Report, SaveStatus, SourceInfo } from '@/types/research';
import { analyzeText, checkPlagiarism, generateTutorMessages } from '@/lib/textAnalyzer';

const STORAGE_KEY = 'nova-research-reports';
const AUTOSAVE_DELAY = 2000;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function loadReports(): Report[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const reports = JSON.parse(stored);
      return reports.map((r: any) => ({
        ...r,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      }));
    }
  } catch (e) {
    console.error('Error loading reports:', e);
  }
  return [];
}

function saveReports(reports: Report[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('Error saving reports:', e);
  }
}

const initialState: ResearchState = {
  currentStep: 'paste',
  sourceText: '',
  paraphrasedText: '',
  grade: 3,
  language: 'es',
  analysis: null,
  tutorMessages: [],
  saveStatus: 'idle',
  isAnalyzing: false,
  sources: [],
};

export function useResearchState() {
  const [state, setState] = useState<ResearchState>(initialState);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>(() => loadReports());
  
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Save reports to localStorage whenever they change
  useEffect(() => {
    saveReports(reports);
  }, [reports]);
  
  // Autosave functionality
  const triggerAutosave = useCallback(() => {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }
    
    setState(prev => ({ ...prev, saveStatus: 'saving' }));
    
    autosaveTimer.current = setTimeout(() => {
      setReports(prev => {
        if (!currentReportId) return prev;
        
        const index = prev.findIndex(r => r.id === currentReportId);
        if (index === -1) return prev;
        
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          sourceText: state.sourceText,
          paraphrasedText: state.paraphrasedText,
          grade: state.grade,
          language: state.language,
          updatedAt: new Date(),
        };
        return updated;
      });
      
      setState(prev => ({ ...prev, saveStatus: 'saved' }));
      
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, saveStatus: 'idle' }));
      }, 2000);
    }, AUTOSAVE_DELAY);
  }, [currentReportId, state.sourceText, state.paraphrasedText, state.grade, state.language]);
  
  // Set source text
  const setSourceText = useCallback((text: string) => {
    setState(prev => ({
      ...prev,
      sourceText: text,
      currentStep: text.trim() ? 'analyze' : 'paste',
    }));
    
    if (currentReportId && text.trim()) {
      triggerAutosave();
    }
  }, [currentReportId, triggerAutosave]);
  
  // Set paraphrased text
  const setParaphrasedText = useCallback((text: string) => {
    setState(prev => {
      // Check for plagiarism in real-time
      if (prev.sourceText && text.length > 20) {
        const plagiarismResult = checkPlagiarism(prev.sourceText, text);
        const updatedAnalysis = prev.analysis 
          ? { ...prev.analysis, ...plagiarismResult }
          : null;
        
        // Regenerate messages if plagiarism detected
        const messages = updatedAnalysis 
          ? generateTutorMessages(updatedAnalysis, prev.grade, prev.language, 'paraphrase')
          : prev.tutorMessages;
        
        return {
          ...prev,
          paraphrasedText: text,
          analysis: updatedAnalysis,
          tutorMessages: messages,
          currentStep: text.trim() ? 'paraphrase' : 'analyze',
        };
      }
      
      return {
        ...prev,
        paraphrasedText: text,
        currentStep: text.trim() ? 'paraphrase' : 'analyze',
      };
    });
    
    if (currentReportId && text.trim()) {
      triggerAutosave();
    }
  }, [currentReportId, triggerAutosave]);
  
  // Analyze source text
  const analyzeSourceText = useCallback(() => {
    setState(prev => ({ ...prev, isAnalyzing: true }));
    
    // Simulate brief analysis delay for UX
    setTimeout(() => {
      setState(prev => {
        const analysis = analyzeText(prev.sourceText, prev.language);
        const messages = generateTutorMessages(analysis, prev.grade, prev.language, 'analyze');
        
        return {
          ...prev,
          analysis,
          tutorMessages: messages,
          isAnalyzing: false,
          currentStep: 'paraphrase',
        };
      });
    }, 800);
  }, []);
  
  // Set grade
  const setGrade = useCallback((grade: Grade) => {
    setState(prev => {
      const messages = prev.analysis 
        ? generateTutorMessages(prev.analysis, grade, prev.language, prev.currentStep)
        : prev.tutorMessages;
      
      return { ...prev, grade, tutorMessages: messages };
    });
    
    if (currentReportId) {
      triggerAutosave();
    }
  }, [currentReportId, triggerAutosave]);
  
  // Set language
  const setLanguage = useCallback((language: Language) => {
    setState(prev => {
      const messages = prev.analysis 
        ? generateTutorMessages(prev.analysis, prev.grade, language, prev.currentStep)
        : prev.tutorMessages;
      
      return { ...prev, language, tutorMessages: messages };
    });
    
    if (currentReportId) {
      triggerAutosave();
    }
  }, [currentReportId, triggerAutosave]);
  
  // Create new report
  const createNewReport = useCallback((title: string) => {
    const newReport: Report = {
      id: generateId(),
      title,
      sourceText: state.sourceText,
      paraphrasedText: state.paraphrasedText,
      grade: state.grade,
      language: state.language,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setReports(prev => [...prev, newReport]);
    setCurrentReportId(newReport.id);
    setState(prev => ({ ...prev, saveStatus: 'saved' }));
    
    return newReport.id;
  }, [state]);
  
  // Load existing report
  const loadReport = useCallback((reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (report) {
      setCurrentReportId(reportId);
      setState(prev => ({
        ...prev,
        sourceText: report.sourceText,
        paraphrasedText: report.paraphrasedText,
        grade: report.grade,
        language: report.language,
        currentStep: report.paraphrasedText ? 'review' : report.sourceText ? 'analyze' : 'paste',
        saveStatus: 'saved',
      }));
      
      // Re-analyze if there's source text
      if (report.sourceText) {
        const analysis = analyzeText(report.sourceText, report.language);
        if (report.paraphrasedText) {
          const plagiarismResult = checkPlagiarism(report.sourceText, report.paraphrasedText);
          Object.assign(analysis, plagiarismResult);
        }
        const messages = generateTutorMessages(analysis, report.grade, report.language, 'analyze');
        setState(prev => ({ ...prev, analysis, tutorMessages: messages }));
      }
    }
  }, [reports]);
  
  // Reset state
  const resetState = useCallback(() => {
    setState(initialState);
    setCurrentReportId(null);
  }, []);
  
  // Manual save
  const saveNow = useCallback(() => {
    if (!currentReportId) {
      // Create a new report with auto-generated title
      const title = state.language === 'es' 
        ? `Mi Reporte ${new Date().toLocaleDateString('es')}`
        : `My Report ${new Date().toLocaleDateString('en')}`;
      createNewReport(title);
    } else {
      // Force immediate save
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
      
      setState(prev => ({ ...prev, saveStatus: 'saving' }));
      
      setReports(prev => {
        const index = prev.findIndex(r => r.id === currentReportId);
        if (index === -1) return prev;
        
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          sourceText: state.sourceText,
          paraphrasedText: state.paraphrasedText,
          grade: state.grade,
          language: state.language,
          updatedAt: new Date(),
        };
        return updated;
      });
      
      setState(prev => ({ ...prev, saveStatus: 'saved' }));
      
      setTimeout(() => {
        setState(prev => ({ ...prev, saveStatus: 'idle' }));
      }, 2000);
    }
  }, [currentReportId, state, createNewReport]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, []);
  
  // Add source
  const addSource = useCallback((source: SourceInfo) => {
    setState(prev => ({
      ...prev,
      sources: [...prev.sources, source],
    }));
  }, []);
  
  // Remove source
  const removeSource = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      sources: prev.sources.filter((_, i) => i !== index),
    }));
  }, []);
  
  return {
    state,
    reports,
    currentReportId,
    setSourceText,
    setParaphrasedText,
    analyzeSourceText,
    setGrade,
    setLanguage,
    createNewReport,
    loadReport,
    resetState,
    saveNow,
    addSource,
    removeSource,
  };
}
