
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal, Award, Users, Clock, Target } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface RankingProps {
  user: User;
}

interface UserRanking {
  user_id: string;
  total_games: number;
  total_wins: number;
  total_score: number;
  updated_at: string;
  profiles: {
    username: string;
    full_name: string;
  };
}

export const Ranking = ({ user }: RankingProps) => {
  const [friendsRanking, setFriendsRanking] = useState<UserRanking[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState("");
  const [nextReset, setNextReset] = useState("");
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriendsRanking();
    calculateCurrentPeriod();
  }, [user.id]);

  const calculateCurrentPeriod = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    
    // Períodos: Janeiro-Junho e Julho-Dezembro
    if (currentMonth >= 0 && currentMonth <= 5) {
      setCurrentPeriod("Janeiro - Junho 2024");
      setNextReset("1 de Julho");
    } else {
      setCurrentPeriod("Julho - Dezembro 2024");
      setNextReset("1 de Janeiro de 2025");
    }
  };

  const loadFriendsRanking = async () => {
    try {
      // Primeiro, buscar os amigos do usuário
      const { data: friendships, error: friendsError } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (friendsError) throw friendsError;

      // Extrair IDs dos amigos
      const friendIds = friendships?.map(friendship => 
        friendship.requester_id === user.id ? friendship.addressee_id : friendship.requester_id
      ) || [];

      // Incluir o próprio usuário no ranking
      const allUserIds = [...friendIds, user.id];

      if (allUserIds.length === 0) {
        setLoading(false);
        return;
      }

      // Buscar ranking apenas dos amigos + usuário atual
      const { data: rankings, error: rankingError } = await supabase
        .from("user_rankings")
        .select(`
          user_id,
          total_games,
          total_wins,
          total_score,
          updated_at,
          profiles!user_rankings_user_id_fkey(username, full_name)
        `)
        .in("user_id", allUserIds)
        .order("total_score", { ascending: false });

      if (rankingError) throw rankingError;

      const rankingWithProfiles = rankings?.map(ranking => ({
        ...ranking,
        profiles: Array.isArray(ranking.profiles) ? ranking.profiles[0] : ranking.profiles
      })) || [];

      setFriendsRanking(rankingWithProfiles);
      
      // Encontrar posição do usuário atual
      const position = rankingWithProfiles.findIndex(r => r.user_id === user.id);
      setUserPosition(position >= 0 ? position + 1 : null);
      
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-orange-500" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">#{position}</span>;
    }
  };

  const getRankBadgeColor = (position: number) => {
    switch (position) {
      case 1: return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case 2: return "bg-gray-100 text-gray-800 border-gray-300";
      case 3: return "bg-orange-100 text-orange-800 border-orange-300";
      default: return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  const getWinRate = (ranking: UserRanking) => {
    return ranking.total_games > 0 ? Math.round((ranking.total_wins / ranking.total_games) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header do Ranking */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-yellow-600" />
            <span>Ranking Entre Amigos</span>
          </CardTitle>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Período: {currentPeriod}</span>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-orange-600">Próximo reset: {nextReset}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas Pessoais */}
      {userPosition && (
        <Card className="bg-white/60 backdrop-blur-sm border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span>Sua Posição</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-4">
                {getRankIcon(userPosition)}
                <div>
                  <p className="font-semibold">#{userPosition} no ranking</p>
                  <p className="text-sm text-gray-600">Entre {friendsRanking.length} amigos</p>
                </div>
              </div>
              <Badge className={getRankBadgeColor(userPosition)}>
                {userPosition === 1 ? "Líder!" : 
                 userPosition <= 3 ? "Top 3!" : 
                 "Continue jogando!"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Ranking */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Ranking de Amigos ({friendsRanking.length})</span>
            </div>
            <div className="text-sm text-gray-500">
              Baseado na pontuação total em jogos
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {friendsRanking.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Nenhum amigo no ranking ainda
              </h3>
              <p className="text-gray-500">
                Adicione amigos e joguem juntos para aparecer no ranking!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {friendsRanking.map((ranking, index) => {
                const position = index + 1;
                const winRate = getWinRate(ranking);
                const isCurrentUser = ranking.user_id === user.id;
                
                return (
                  <div 
                    key={ranking.user_id} 
                    className={`p-4 rounded-lg border transition-all ${
                      isCurrentUser 
                        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          {getRankIcon(position)}
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {ranking.profiles?.username?.charAt(0).toUpperCase() || "?"}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">
                              @{ranking.profiles?.username || "Usuário"}
                              {isCurrentUser && (
                                <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800">
                                  Você
                                </Badge>
                              )}
                            </p>
                          </div>
                          {ranking.profiles?.full_name && (
                            <p className="text-sm text-gray-600">{ranking.profiles.full_name}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-lg font-bold text-purple-600">{ranking.total_score}</p>
                            <p className="text-xs text-gray-500">Pontos</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-green-600">{ranking.total_wins}</p>
                            <p className="text-xs text-gray-500">Vitórias</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-blue-600">{winRate}%</p>
                            <p className="text-xs text-gray-500">Taxa de vitória</p>
                          </div>
                        </div>
                        
                        {ranking.total_games > 0 && (
                          <div className="mt-2">
                            <Progress value={winRate} className="h-2 w-32" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações sobre o Sistema */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-green-900 mb-2">Como funciona o ranking:</h4>
          <div className="text-sm text-green-800 space-y-1">
            <p>• Apenas amigos aparecem no seu ranking pessoal</p>
            <p>• Pontuação baseada no desempenho em jogos educativos</p>
            <p>• Rankings resetam a cada 6 meses (Janeiro e Julho)</p>
            <p>• Jogue mais para subir de posição!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
