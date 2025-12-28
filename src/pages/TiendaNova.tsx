import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Coins, Gift, Sparkles, ShoppingBag, Loader2 } from "lucide-react";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  cost_coins: number;
  category: string;
}

interface StudentCoins {
  balance: number;
}

const TiendaNova = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [coins, setCoins] = useState<StudentCoins | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Fetch rewards
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('cost_coins');
      
      setRewards(rewardsData || []);

      // Fetch student coins
      const { data: coinsData } = await supabase
        .from('student_coins')
        .select('balance')
        .eq('student_id', user.id)
        .maybeSingle();
      
      setCoins(coinsData || { balance: 0 });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (!user || !coins) return;
    
    if (coins.balance < reward.cost_coins) {
      toast.error("No tienes suficientes monedas");
      return;
    }

    setRedeeming(reward.id);
    try {
      // Create redemption
      const { error: redemptionError } = await supabase
        .from('reward_redemptions')
        .insert({
          student_id: user.id,
          reward_id: reward.id,
          status: 'pending'
        });

      if (redemptionError) throw redemptionError;

      // Create spend transaction
      const { error: txError } = await supabase
        .from('coin_transactions')
        .insert({
          student_id: user.id,
          amount: -reward.cost_coins,
          type: 'spend',
          reason: `Canje: ${reward.name}`
        });

      if (txError) throw txError;

      // Update balance
      const newBalance = coins.balance - reward.cost_coins;
      const { error: updateError } = await supabase
        .from('student_coins')
        .update({ 
          balance: newBalance,
          total_spent: (coins as any).total_spent ? (coins as any).total_spent + reward.cost_coins : reward.cost_coins
        })
        .eq('student_id', user.id);

      if (updateError) throw updateError;

      setCoins({ balance: newBalance });
      toast.success("¡Premio canjeado! El administrador te lo entregará pronto.");
    } catch (error) {
      console.error('Error redeeming:', error);
      toast.error("Error al canjear el premio");
    } finally {
      setRedeeming(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'digital':
        return Sparkles;
      case 'físico':
      case 'fisico':
        return Gift;
      default:
        return Gift;
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tienda Nova</h1>
            <p className="text-muted-foreground mt-1">
              Canjea tus monedas por recompensas increíbles
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gold/10 border border-gold/20">
            <Coins className="w-5 h-5 text-gold" />
            <span className="text-lg font-bold text-gold">{coins?.balance || 0}</span>
            <span className="text-sm text-muted-foreground">monedas</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : rewards.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">No hay recompensas disponibles</p>
              <p className="text-muted-foreground">Vuelve pronto para ver nuevas recompensas</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => {
              const IconComponent = getCategoryIcon(reward.category);
              const canAfford = (coins?.balance || 0) >= reward.cost_coins;
              
              return (
                <Card key={reward.id} className="bg-card border-border hover:border-gold/30 transition-colors group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                        <IconComponent className="w-6 h-6 text-gold" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {reward.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-foreground mt-3">{reward.name}</CardTitle>
                    <CardDescription>{reward.description || 'Recompensa especial'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-gold" />
                        <span className="text-lg font-bold text-gold">{reward.cost_coins}</span>
                      </div>
                      <Button 
                        onClick={() => handleRedeem(reward)}
                        disabled={!canAfford || redeeming === reward.id}
                        className={canAfford 
                          ? "bg-gradient-gold text-gold-foreground hover:opacity-90" 
                          : "bg-muted text-muted-foreground"
                        }
                      >
                        {redeeming === reward.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            {canAfford ? 'Canjear' : 'Sin fondos'}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Earn More Section */}
        <Card className="bg-gradient-to-br from-gold/10 to-accent/10 border-gold/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gold flex items-center justify-center shadow-glow-gold">
                  <Coins className="w-7 h-7 text-gold-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">¿Necesitas más monedas?</h2>
                  <p className="text-muted-foreground">Completa desafíos y tutorías para ganar más</p>
                </div>
              </div>
              <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
                Ver cómo ganar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default TiendaNova;
