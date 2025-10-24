
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Circle } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  is_online: boolean;
}

interface UserSearchCardProps {
  user: User;
  onRequestSent: () => void;
}

export const UserSearchCard = ({ user, onRequestSent }: UserSearchCardProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, is_online")
        .ilike("username", `%${searchTerm}%`)
        .neq("id", user.id)
        .not("username", "is", null)
        .limit(10);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .insert({
          requester_id: user.id,
          addressee_id: profileId,
          status: "pending"
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Aviso",
            description: "Vocês já têm uma conexão pendente ou são amigos",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação de amizade foi enviada",
      });

      onRequestSent();
      setSearchResults([]);
      setSearchTerm("");
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>Buscar Amigos</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            placeholder="Digite o nome de usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && searchUsers()}
          />
          <Button onClick={searchUsers} disabled={loading}>
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {profile.username?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-medium">@{profile.username}</p>
                    {profile.full_name && (
                      <p className="text-sm text-gray-600">{profile.full_name}</p>
                    )}
                  </div>
                  {profile.is_online && (
                    <Circle className="w-3 h-3 text-green-500 fill-current" />
                  )}
                </div>
                <Button size="sm" onClick={() => sendFriendRequest(profile.id)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
