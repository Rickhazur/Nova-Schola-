import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coins, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

interface TokenUsageCardProps {
  showAdminControls?: boolean;
  onResetTokens?: () => void;
}

export function TokenUsageCard({ showAdminControls = false, onResetTokens }: TokenUsageCardProps) {
  const { subscription, loading, resetTokens } = useSubscription();
  const [resetting, setResetting] = useState(false);

  if (loading || !subscription) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = (subscription.tokensUsedThisMonth / subscription.tokenAllowance) * 100;
  const isLow = usagePercentage >= 80;
  const isAtLimit = subscription.isAtLimit;

  const handleReset = async () => {
    setResetting(true);
    await resetTokens();
    onResetTokens?.();
    setResetting(false);
  };

  return (
    <Card className={`bg-card border-border ${isAtLimit ? 'border-destructive/50' : isLow ? 'border-gold/50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-gold" />
            <CardTitle className="text-foreground text-base">Tokens de IA</CardTitle>
          </div>
          <Badge 
            variant="outline" 
            className={isAtLimit ? 'border-destructive text-destructive' : 'border-primary text-primary'}
          >
            Plan {subscription.plan}
          </Badge>
        </div>
        <CardDescription>
          Uso mensual de tokens para el tutor IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {subscription.tokensUsedThisMonth} / {subscription.tokenAllowance} tokens
            </span>
            <span className={`font-medium ${isAtLimit ? 'text-destructive' : isLow ? 'text-gold' : 'text-foreground'}`}>
              {subscription.tokensRemaining} restantes
            </span>
          </div>
          <Progress 
            value={Math.min(usagePercentage, 100)} 
            className={`h-2 ${isAtLimit ? '[&>div]:bg-destructive' : isLow ? '[&>div]:bg-gold' : ''}`}
          />
        </div>

        {isAtLimit && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Has alcanzado tu límite mensual
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ¡Pide a tus padres subir de nivel para seguir aprendiendo!
              </p>
              <Button asChild size="sm" className="mt-2 bg-gradient-primary">
                <Link to="/pricing">Ver planes</Link>
              </Button>
            </div>
          </div>
        )}

        {isLow && !isAtLimit && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-gold/10 border border-gold/20">
            <AlertTriangle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gold">
              Quedan pocos tokens. Considera actualizar tu plan.
            </p>
          </div>
        )}

        {showAdminControls && (
          <div className="pt-2 border-t border-border">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset}
              disabled={resetting}
              className="w-full"
            >
              {resetting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Reiniciar tokens del mes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
