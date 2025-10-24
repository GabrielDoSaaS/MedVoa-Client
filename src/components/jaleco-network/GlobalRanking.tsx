import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal, Award, Users, Calendar, Star } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface GlobalRankingProps {
  user: User | null;
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

export const GlobalRanking = ({ user }: GlobalRankingProps) => {
  const [globalRanking, setGlobalRanking] = useState<UserRanking[]>([]);
  const [currentSemester, setCurrentSemester] = useState("");
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGlobalRanking();
    calculateCurrentSemester();
  }, [user?.id]);

  const calculateCurrentSemester = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Semestres: Janeiro-Junho e Julho-Dezembro
    if (currentMonth >= 0 && currentMonth <= 5) {
      setCurrentSemester(`1º Semestre ${currentYear}`);
    } else {
      setCurrentSemester(`2º Semestre ${currentYear}`);
    }
  };

  const loadGlobalRanking = async () => {
    try {
      // Buscar ranking de todos os usuários da plataforma
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
        .order("total_score", { ascending: false })
        .limit(50); // Top 50 usuários

      if (rankingError) throw rankingError;

      const rankingWithProfiles = rankings?.map(ranking => ({
        ...ranking,
        profiles: Array.isArray(ranking.profiles) ? ranking.profiles[0] : ranking.profiles
      })) || [];

      setGlobalRanking(rankingWithProfiles);
      
      // Encontrar posição do usuário atual
      if (user?.id) {
        const position = rankingWithProfiles.findIndex(r => r.user_id === user.id);
        setUserPosition(position >= 0 ? position + 1 : null);
      }
      
    } catch (error) {
      console.error("Erro ao carregar ranking global:", error);
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
      case 1: return "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-300";
      case 2: return "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300";
      case 3: return "bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-300";
      default: return "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300";
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
          <p className="text-gray-500">Carregando ranking global...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header do Ranking Global */}
      <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-indigo-600" />
            <span className="text-indigo-900">Ranking Global da Plataforma</span>
          </CardTitle>
          <div className="flex items-center justify-between text-sm">
            <span className="text-indigo-700">Período: {currentSemester}</span>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span className="text-purple-600">Os melhores estudantes de medicina</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Pódio - Top 3 */}
      {globalRanking.length >= 3 && (
        <Card className="bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 border-2 border-yellow-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-gray-900 mb-6">
              🏆 Pódio dos Campeões 🏆
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-end space-x-4">
              {/* 2º Lugar */}
              <div className="text-center p-4 bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl border-2 border-gray-300 min-w-[120px]">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
                  2
                </div>
                <p className="font-semibold text-gray-800 text-sm mb-1">
                  @{globalRanking[1]?.profiles?.username || "Usuário"}
                </p>
                <p className="text-2xl font-bold text-gray-700">{globalRanking[1]?.total_score}</p>
                <p className="text-xs text-gray-600">pontos</p>
              </div>

              {/* 1º Lugar */}
              <div className="text-center p-6 bg-gradient-to-b from-yellow-100 to-orange-200 rounded-2xl border-2 border-yellow-400 min-w-[140px] transform scale-110">
                <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-3xl font-bold">
                  1
                </div>
                <p className="font-bold text-yellow-800 mb-1">
                  @{globalRanking[0]?.profiles?.username || "Usuário"}
                </p>
                <p className="text-3xl font-bold text-yellow-700">{globalRanking[0]?.total_score}</p>
                <p className="text-sm text-yellow-600">pontos</p>
                <Badge className="mt-2 bg-yellow-500 text-yellow-900">👑 CAMPEÃO</Badge>
              </div>

              {/* 3º Lugar */}
              <div className="text-center p-4 bg-gradient-to-b from-orange-100 to-red-200 rounded-2xl border-2 border-orange-300 min-w-[120px]">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
                  3
                </div>
                <p className="font-semibold text-orange-800 text-sm mb-1">
                  @{globalRanking[2]?.profiles?.username || "Usuário"}
                </p>
                <p className="text-2xl font-bold text-orange-700">{globalRanking[2]?.total_score}</p>
                <p className="text-xs text-orange-600">pontos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posição do Usuário Atual */}
      {userPosition && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-blue-600" />
              <span className="text-blue-900">Sua Posição Global</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl border border-blue-300">
              <div className="flex items-center space-x-4">
                {getRankIcon(userPosition)}
                <div>
                  <p className="font-bold text-lg text-blue-900">#{userPosition} no ranking global</p>
                  <p className="text-sm text-blue-700">Entre {globalRanking.length} estudantes ativos</p>
                </div>
              </div>
              <Badge className={`text-sm font-semibold ${getRankBadgeColor(userPosition)}`}>
                {userPosition === 1 ? "🥇 LÍDER ABSOLUTO!" : 
                 userPosition <= 3 ? "🏆 TOP 3 GLOBAL!" :
                 userPosition <= 10 ? "⭐ TOP 10!" :
                 userPosition <= 20 ? "🔥 TOP 20!" : 
                 "💪 Continue estudando!"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela do Ranking Global */}
      <Card className="bg-white/90 backdrop-blur-sm border-2 border-gray-200 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span className="text-indigo-900">Top 50 Estudantes ({globalRanking.length})</span>
            </div>
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              Baseado na pontuação total em jogos
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {globalRanking.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Nenhum usuário no ranking ainda
              </h3>
              <p className="text-gray-500">
                Seja o primeiro a jogar e aparecer no ranking global!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {globalRanking.map((ranking, index) => {
                const position = index + 1;
                const winRate = getWinRate(ranking);
                const isCurrentUser = ranking.user_id === user?.id;
                
                return (
                  <div 
                    key={ranking.user_id} 
                    className={`p-4 rounded-xl transition-all duration-300 ${
                      isCurrentUser 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 ring-2 ring-blue-200 shadow-lg transform scale-[1.02]' 
                        : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          {getRankIcon(position)}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                            position <= 3 ? 'bg-gradient-to-r from-purple-500 to-indigo-600' :
                            position <= 10 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                            'bg-gradient-to-r from-gray-500 to-gray-600'
                          }`}>
                            {ranking.profiles?.username?.charAt(0).toUpperCase() || "?"}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-gray-900">
                              @{ranking.profiles?.username || "Usuário"}
                              {isCurrentUser && (
                                <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800 border-blue-300">
                                  Você
                                </Badge>
                              )}
                              {position <= 3 && (
                                <Badge className={`ml-2 ${getRankBadgeColor(position)}`}>
                                  {position === 1 ? "👑" : position === 2 ? "🥈" : "🥉"}
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
                        <div className="grid grid-cols-3 gap-6 text-center">
                          <div>
                            <p className="text-xl font-bold text-purple-600">{ranking.total_score}</p>
                            <p className="text-xs text-gray-500">Pontos</p>
                          </div>
                          <div>
                            <p className="text-xl font-bold text-green-600">{ranking.total_wins}</p>
                            <p className="text-xs text-gray-500">Vitórias</p>
                          </div>
                          <div>
                            <p className="text-xl font-bold text-blue-600">{winRate}%</p>
                            <p className="text-xs text-gray-500">Taxa</p>
                          </div>
                        </div>
                        
                        {ranking.total_games > 0 && (
                          <div className="mt-3">
                            <Progress value={winRate} className="h-2 w-36" />
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
      <Card className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 shadow-lg">
        <CardContent className="p-6">
          <h4 className="font-bold text-green-900 mb-3 text-lg">🎯 Como funciona o ranking global:</h4>
          <div className="text-sm text-green-800 space-y-2 leading-relaxed">
            <p>• 🌟 <strong>Ranking semestral:</strong> todos os estudantes da plataforma competem</p>
            <p>• 🎮 <strong>Pontuação:</strong> baseada no desempenho em todos os jogos educativos</p>
            <p>• 🏆 <strong>Reset semestral:</strong> rankings resetam em Janeiro e Julho</p>
            <p>• 📊 <strong>Critérios:</strong> pontos totais, vitórias e taxa de acerto</p>
            <p>• 🚀 <strong>Meta:</strong> seja um dos top 50 melhores estudantes!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};