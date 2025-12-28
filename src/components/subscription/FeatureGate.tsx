import { ReactNode } from 'react';
import { useSubscription, PlanFeatures } from '@/hooks/useSubscription';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeatureGateProps {
  feature: keyof PlanFeatures;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  requiredPlan?: 'PRO' | 'ELITE';
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  requiredPlan = 'PRO',
}: FeatureGateProps) {
  const { canAccessFeature, subscription, loading } = useSubscription();

  if (loading) {
    return (
      <div className="animate-pulse bg-muted/50 rounded-lg h-32" />
    );
  }

  const hasAccess = canAccessFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-muted/50">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
      <CardContent className="relative p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <Badge className="mb-3 bg-gradient-primary text-primary-foreground">
          <Sparkles className="w-3 h-3 mr-1" />
          Plan {requiredPlan}
        </Badge>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Función exclusiva de {requiredPlan}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Actualiza tu plan para desbloquear esta característica y muchas más.
        </p>
        <Button asChild className="bg-gradient-primary hover:opacity-90">
          <Link to="/pricing">
            Actualizar a {requiredPlan}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

interface UpgradeBadgeProps {
  requiredPlan?: 'PRO' | 'ELITE';
  className?: string;
}

export function UpgradeBadge({ requiredPlan = 'PRO', className }: UpgradeBadgeProps) {
  return (
    <Link to="/pricing">
      <Badge 
        className={`bg-gradient-primary text-primary-foreground hover:opacity-90 cursor-pointer ${className}`}
      >
        <Lock className="w-3 h-3 mr-1" />
        Upgrade to {requiredPlan}
      </Badge>
    </Link>
  );
}
