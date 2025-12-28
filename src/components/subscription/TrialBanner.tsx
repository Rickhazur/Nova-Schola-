import { useEffect, useState } from "react";
import { differenceInDays, differenceInHours } from "date-fns";
import { Gift, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface TrialBannerProps {
  trialEndsAt: string | null;
  isTrialActive: boolean;
  isPaid: boolean;
  planName: string;
}

export function TrialBanner({ trialEndsAt, isTrialActive, isPaid, planName }: TrialBannerProps) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number } | null>(null);

  useEffect(() => {
    if (!trialEndsAt || isPaid) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const endDate = new Date(trialEndsAt);
      const days = differenceInDays(endDate, now);
      const hours = differenceInHours(endDate, now) % 24;
      setTimeLeft({ days: Math.max(0, days), hours: Math.max(0, hours) });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000 * 60); // Update every minute

    return () => clearInterval(interval);
  }, [trialEndsAt, isPaid]);

  // Don't show if paid or no trial info
  if (isPaid || !trialEndsAt || !isTrialActive) return null;

  const isExpiringSoon = timeLeft && timeLeft.days === 0;

  return (
    <div className={`w-full px-4 py-3 ${
      isExpiringSoon 
        ? "bg-gradient-to-r from-destructive/20 to-destructive/10 border-b border-destructive/30" 
        : "bg-gradient-to-r from-accent/20 to-primary/10 border-b border-accent/30"
    }`}>
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {isExpiringSoon ? (
            <AlertTriangle className="w-5 h-5 text-destructive" />
          ) : (
            <Gift className="w-5 h-5 text-accent" />
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {isExpiringSoon ? (
                <>Prueba gratuita termina hoy</>
              ) : (
                <>Estás usando una prueba gratuita de 3 días del plan <strong>{planName}</strong></>
              )}
            </span>
            {timeLeft && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/50">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {timeLeft.days > 0 
                    ? `${timeLeft.days} día${timeLeft.days > 1 ? 's' : ''} restante${timeLeft.days > 1 ? 's' : ''}` 
                    : `${timeLeft.hours} hora${timeLeft.hours > 1 ? 's' : ''} restante${timeLeft.hours > 1 ? 's' : ''}`
                  }
                </span>
              </div>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant={isExpiringSoon ? "destructive" : "default"}
          onClick={() => navigate("/app/trial-ended")}
          className="whitespace-nowrap"
        >
          Ver cómo activar
        </Button>
      </div>
    </div>
  );
}
