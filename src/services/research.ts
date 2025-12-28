import { supabase } from "@/integrations/supabase/client";
import { ResearchProject, ResearchSource, ResearchSession, PlagiarismCheck } from "@/types/research";

// Helper for safe IDs
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// --- Projects ---

export const getResearchProjects = async (studentId: string): Promise<ResearchProject[]> => {
    const { data, error } = await supabase
        .from('research_projects')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

    if (error) {
        console.warn("Table research_projects might not exist yet. Returning empty list.", error);
        return [];
    }
    return data as ResearchProject[];
};

export const createResearchProject = async (
    project: Omit<ResearchProject, 'id' | 'created_at' | 'updated_at'>
): Promise<ResearchProject | null> => {
    try {
        const { data, error } = await supabase
            .from('research_projects')
            .insert(project)
            .select()
            .single();

        if (error) throw error;
        return data as ResearchProject;
    } catch (err) {
        console.warn("Using mock project due to DB error:", err);
        return {
            id: generateId(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...project
        } as ResearchProject;
    }
};

// --- Sources ---

export const getResearchSources = async (projectId: string): Promise<ResearchSource[]> => {
    const { data, error } = await supabase
        .from('research_sources')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (error) return [];
    return data as ResearchSource[];
};

export const saveResearchSource = async (
    source: Omit<ResearchSource, 'id' | 'created_at'>
): Promise<ResearchSource | null> => {
    try {
        const { data, error } = await supabase
            .from('research_sources')
            .insert(source)
            .select()
            .single();

        if (error) throw error;
        return data as ResearchSource;
    } catch (e) {
        console.warn("Using mock source due to DB error");
        return {
            id: generateId(),
            created_at: new Date().toISOString(),
            ...source
        } as ResearchSource;
    }
};

// --- Sessions ---

export const startResearchSession = async (
    projectId: string
): Promise<ResearchSession | null> => {
    try {
        const { data, error } = await supabase
            .from('research_sessions')
            .insert({
                project_id: projectId,
                start_time: new Date().toISOString(),
                duration_seconds: 0
            })
            .select()
            .single();

        if (error) throw error;
        return data as ResearchSession;
    } catch (e) {
        return {
            id: generateId(),
            project_id: projectId,
            start_time: new Date().toISOString(),
            duration_seconds: 0,
            created_at: new Date().toISOString()
        } as ResearchSession;
    }
};

export const endResearchSession = async (
    sessionId: string,
    endTime: string,
    duration: number,
    notes?: string
): Promise<void> => {
    const { error } = await supabase
        .from('research_sessions')
        .update({
            end_time: endTime,
            duration_seconds: duration,
            notes: notes
        })
        .eq('id', sessionId);

    if (error) throw error;
};

// --- Plagiarism (Mocked for now) ---

export const checkPlagiarism = async (text: string, projectId: string): Promise<PlagiarismCheck> => {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockScore = Math.floor(Math.random() * 20);

    const mockResult = {
        id: generateId(),
        project_id: projectId,
        text_content: text.substring(0, 100) + "...",
        similarity_score: mockScore,
        created_at: new Date().toISOString(),
        report_url: "#"
    };

    await supabase.from('plagiarism_checks').insert(mockResult).select();

    return mockResult;
};

// --- Report Drafts (Local Persistence for Demo) ---

export const saveProjectReport = async (projectId: string, content: string): Promise<void> => {
    // In a real app, this would be a DB update:
    // await supabase.from('research_projects').update({ report_content: content }).eq('id', projectId);

    // For now, we use LocalStorage to ensure it persists across reloads during the demo
    localStorage.setItem(`nova_report_${projectId}`, content);
    console.log("Report saved locally for project:", projectId);
};

export const getProjectReport = async (projectId: string): Promise<string> => {
    // Try local storage first
    const local = localStorage.getItem(`nova_report_${projectId}`);
    return local || "";
};
