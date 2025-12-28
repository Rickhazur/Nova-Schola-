import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Gift, Coins, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  cost_coins: number;
  category: string;
  is_active: boolean;
}

interface Redemption {
  id: string;
  status: string;
  created_at: string;
  student_id: string;
  reward_id: string;
  rewards: { name: string; cost_coins: number } | null;
  student_profiles: { full_name: string } | null;
}

export const RewardsManager = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cost_coins: "",
    category: "Digital",
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [rewardsRes, redemptionsRes] = await Promise.all([
      supabase.from('rewards').select('*').order('name'),
      supabase.from('reward_redemptions')
        .select(`
          id, status, created_at, student_id, reward_id,
          rewards (name, cost_coins),
          student_profiles!reward_redemptions_student_id_fkey (full_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    setRewards(rewardsRes.data || []);
    setRedemptions((redemptionsRes.data as unknown as Redemption[]) || []);
    setLoading(false);
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const rewardData = {
        name: formData.name,
        description: formData.description || null,
        cost_coins: parseInt(formData.cost_coins),
        category: formData.category,
        is_active: formData.is_active
      };

      if (editingReward) {
        const { error } = await supabase
          .from('rewards')
          .update(rewardData)
          .eq('id', editingReward.id);
        if (error) throw error;
        toast.success("Premio actualizado");
      } else {
        const { error } = await supabase
          .from('rewards')
          .insert(rewardData);
        if (error) throw error;
        toast.success("Premio creado");
      }

      setShowModal(false);
      setEditingReward(null);
      setFormData({ name: "", description: "", cost_coins: "", category: "Digital", is_active: true });
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al guardar";
      toast.error(message);
    }
  };

  const handleDeleteReward = async (id: string) => {
    if (!confirm("¿Eliminar este premio?")) return;

    const { error } = await supabase.from('rewards').delete().eq('id', id);
    if (error) {
      toast.error("Error al eliminar");
    } else {
      toast.success("Premio eliminado");
      fetchData();
    }
  };

  const handleDeliverRedemption = async (redemption: Redemption) => {
    if (!user) return;

    const { error } = await supabase
      .from('reward_redemptions')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        delivered_by_admin_id: user.id
      })
      .eq('id', redemption.id);

    if (error) {
      toast.error("Error al marcar como entregado");
    } else {
      toast.success("Premio marcado como entregado");
      fetchData();
    }
  };

  const openEditModal = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description || "",
      cost_coins: reward.cost_coins.toString(),
      category: reward.category,
      is_active: reward.is_active
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Rewards CRUD */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-gold" />
              Catálogo de Premios
            </CardTitle>
            <Button onClick={() => {
              setEditingReward(null);
              setFormData({ name: "", description: "", cost_coins: "", category: "Digital", is_active: true });
              setShowModal(true);
            }}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Premio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards.map(reward => (
                  <TableRow key={reward.id}>
                    <TableCell className="font-medium">{reward.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{reward.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-gold">
                        <Coins className="w-3 h-3" />
                        {reward.cost_coins}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={reward.is_active ? "default" : "secondary"}>
                        {reward.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditModal(reward)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteReward(reward.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Redemptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Canjes Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {redemptions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay canjes pendientes</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Premio</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptions.map(redemption => (
                  <TableRow key={redemption.id}>
                    <TableCell>{redemption.student_profiles?.full_name || 'Desconocido'}</TableCell>
                    <TableCell>{redemption.rewards?.name || 'Desconocido'}</TableCell>
                    <TableCell>{new Date(redemption.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => handleDeliverRedemption(redemption)}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Entregar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReward ? 'Editar Premio' : 'Nuevo Premio'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveReward} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cost">Costo (coins) *</Label>
                <Input
                  id="cost"
                  type="number"
                  min={1}
                  value={formData.cost_coins}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_coins: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Digital">Digital</SelectItem>
                    <SelectItem value="Físico">Físico</SelectItem>
                    <SelectItem value="Permiso especial">Permiso especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Activo</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {editingReward ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};