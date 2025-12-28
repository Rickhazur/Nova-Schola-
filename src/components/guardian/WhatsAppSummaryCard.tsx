import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  MessageSquare, 
  Loader2, 
  Copy, 
  Check,
  Phone,
  Calendar,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppSummaryCardProps {
  studentId: string;
  studentName: string;
  guardianWhatsapp?: string | null;
}

export function WhatsAppSummaryCard({ studentId, studentName, guardianWhatsapp }: WhatsAppSummaryCardProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [weekRange, setWeekRange] = useState<{ start: string; end: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const generateSummary = async () => {
    setIsGenerating(true);
    setSummary(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para generar el resumen",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke('generate-whatsapp-summary', {
        body: { studentId }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error al generar el resumen');
      }

      if (response.data?.summary) {
        setSummary(response.data.summary);
        setWeekRange({
          start: response.data.weekStart,
          end: response.data.weekEnd
        });
        setShowDialog(true);
        toast({
          title: "Resumen generado",
          description: "El resumen semanal está listo para copiar",
        });
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo generar el resumen",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!summary) return;
    
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      toast({
        title: "Copiado",
        description: "El resumen ha sido copiado al portapapeles",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      });
    }
  };

  const openWhatsApp = () => {
    if (!guardianWhatsapp || !summary) return;
    
    // Clean the phone number
    const cleanPhone = guardianWhatsapp.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(summary);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <CardTitle className="text-foreground">Resumen para WhatsApp</CardTitle>
            <CardDescription>Genera un resumen semanal para el acudiente</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {guardianWhatsapp ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">WhatsApp del acudiente:</span>
              <span className="text-sm font-medium text-foreground">{guardianWhatsapp}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gold/10 border border-gold/20">
              <Phone className="w-4 h-4 text-gold" />
              <span className="text-sm text-gold">
                No hay número de WhatsApp registrado para el acudiente
              </span>
            </div>
          )}

          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full border-green-500/30 text-green-500 hover:bg-green-500/10 gap-2"
                onClick={generateSummary}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando resumen...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Generar resumen semanal para WhatsApp
                  </>
                )}
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  Resumen Semanal para WhatsApp
                </DialogTitle>
                <DialogDescription>
                  {weekRange && (
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Semana del {formatDate(weekRange.start)} al {formatDate(weekRange.end)}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                {summary && (
                  <>
                    <Textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="min-h-[250px] text-sm"
                      placeholder="El resumen aparecerá aquí..."
                    />
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={copyToClipboard}
                        className="flex-1 gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copiar mensaje
                          </>
                        )}
                      </Button>
                      
                      {guardianWhatsapp && (
                        <Button 
                          variant="default"
                          onClick={openWhatsApp}
                          className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Abrir WhatsApp
                        </Button>
                      )}
                    </div>
                    
                    {!guardianWhatsapp && (
                      <p className="text-sm text-muted-foreground text-center">
                        Copia el mensaje y envíalo manualmente por WhatsApp
                      </p>
                    )}
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
