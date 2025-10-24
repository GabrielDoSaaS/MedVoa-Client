
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Users, Plus, Lock, Globe, UserPlus } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StudyGroupsProps {
  user: User;
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  is_private: boolean;
  created_by: string;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
}

export const StudyGroups = ({ user }: StudyGroupsProps) => {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadGroups();
    loadMyGroups();
  }, [user.id]);

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("study_groups")
        .select(`
          id,
          name,
          description,
          is_private,
          created_by,
          created_at,
          group_members(count)
        `)
        .eq("is_private", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const groupsWithCounts = data?.map(group => ({
        ...group,
        member_count: group.group_members?.[0]?.count || 0
      })) || [];

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
    }
  };

  const loadMyGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("group_members")
        .select(`
          group_id,
          study_groups(
            id,
            name,
            description,
            is_private,
            created_by,
            created_at
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      const myGroupsList = data?.map(member => member.study_groups).filter(Boolean) || [];
      setMyGroups(myGroupsList as StudyGroup[]);
    } catch (error) {
      console.error("Erro ao carregar meus grupos:", error);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;

    setLoading(true);
    try {
      const { data: group, error: groupError } = await supabase
        .from("study_groups")
        .insert({
          name: newGroupName,
          description: newGroupDescription,
          is_private: isPrivate,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Adicionar o criador como membro
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: "admin"
        });

      if (memberError) throw memberError;

      toast({
        title: "Grupo criado!",
        description: "Seu grupo de estudo foi criado com sucesso",
      });

      setNewGroupName("");
      setNewGroupDescription("");
      setIsPrivate(false);
      setShowCreateDialog(false);
      loadGroups();
      loadMyGroups();
    } catch (error) {
      console.error("Erro ao criar grupo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o grupo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from("group_members")
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: "member"
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Aviso",
            description: "Você já é membro deste grupo",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Você entrou no grupo de estudos",
      });

      loadGroups();
      loadMyGroups();
    } catch (error) {
      console.error("Erro ao entrar no grupo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível entrar no grupo",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Criar Grupo */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Criar Grupo de Estudo</span>
            </CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Grupo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Grupo de Estudo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="groupName">Nome do Grupo</Label>
                    <Input
                      id="groupName"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Ex: Cardiologia Intensiva"
                    />
                  </div>
                  <div>
                    <Label htmlFor="groupDescription">Descrição</Label>
                    <Textarea
                      id="groupDescription"
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      placeholder="Descreva o objetivo do grupo..."
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="private"
                      checked={isPrivate}
                      onCheckedChange={setIsPrivate}
                    />
                    <Label htmlFor="private">Grupo Privado</Label>
                  </div>
                  <Button onClick={createGroup} disabled={loading} className="w-full">
                    {loading ? "Criando..." : "Criar Grupo"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Meus Grupos */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Meus Grupos ({myGroups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {myGroups.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Você ainda não faz parte de nenhum grupo
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myGroups.map((group) => (
                <div key={group.id} className="p-4 bg-white rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{group.name}</h3>
                    {group.is_private ? (
                      <Lock className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Globe className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  {group.description && (
                    <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                  )}
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Membro
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grupos Públicos */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Grupos Públicos</CardTitle>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhum grupo público disponível
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => {
                const isMyGroup = myGroups.some(myGroup => myGroup.id === group.id);
                
                return (
                  <div key={group.id} className="p-4 bg-white rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{group.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{group.member_count}</span>
                      </div>
                    </div>
                    {group.description && (
                      <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Público
                      </Badge>
                      {!isMyGroup ? (
                        <Button size="sm" onClick={() => joinGroup(group.id)}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Entrar
                        </Button>
                      ) : (
                        <Badge className="bg-blue-50 text-blue-700">
                          Membro
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
