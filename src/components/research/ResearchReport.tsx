import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, FileText, Download, Quote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResearchReportProps {
    projectId: string;
    initialContent?: string;
    onSave?: (content: string) => void;
}

export function ResearchReport({ projectId, initialContent = "", onSave }: ResearchReportProps) {
    const { toast } = useToast();
    const [content, setContent] = useState(initialContent);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Auto-save simulation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (content !== initialContent) {
                handleSave();
            }
        }, 30000); // Auto-save every 30s
        return () => clearTimeout(timer);
    }, [content]);

    const handleSave = () => {
        setLastSaved(new Date());
        onSave?.(content);
        // In a real app, we'd save to Supabase here
    };

    const handleManualSave = () => {
        handleSave();
        toast({ title: "Guardado", description: "Tu reporte ha sido actualizado." });
    };

    return (
        <div className="flex flex-col h-full bg-white border rounded-xl shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="h-12 border-b bg-slate-50 flex items-center justify-between px-4">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <FileText className="w-4 h-4" />
                    <span>Reporte de Investigación</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground mr-2">
                        {lastSaved ? `Guardado ${lastSaved.toLocaleTimeString()}` : "Sin guardar"}
                    </span>
                    <Button size="sm" variant="outline" onClick={handleManualSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar
                    </Button>
                    <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 p-0 relative">
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-full resize-none border-0 p-8 text-lg leading-relaxed focus-visible:ring-0 font-serif text-slate-800"
                    placeholder="Comienza a escribir tu reporte aquí...
                    
Tip: Puedes usar la información que encuentres en el navegador."
                />
            </div>
        </div>
    );
}
