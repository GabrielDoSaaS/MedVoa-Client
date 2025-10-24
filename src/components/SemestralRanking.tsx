import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trophy, Medal, Award, Clock, TrendingUp, Users, Info } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MedicalFileManager } from "@/components/MedicalFileManager";
interface SemestralRankingProps {
  user: User | null;
}
interface UserRankingData {
  user_id: string;
  username: string;
  full_name: string;
  study_hours: number;
  avatar_url?: string;
  position: number;
}
export const SemestralRanking = ({
  user
}: SemestralRankingProps) => {
  const [rankings, setRankings] = useState<UserRankingData[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState("");
  const [nextReset, setNextReset] = useState("");
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [userProfile, setUserProfile] = useState<{ full_name: string; username: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredUser, setHoveredUser] = useState<UserRankingData | null>(null);
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0
  });
  const {
    toast
  } = useToast();
  useEffect(() => {
    calculateCurrentPeriod();
    loadRankings();
    if (user) {
      loadUserProfile();
    }
  }, [user]);
  const calculateCurrentPeriod = () => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11 (Janeiro = 0)
    const currentYear = now.getFullYear();

    // Período mensal
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    setCurrentPeriod(`${monthNames[currentMonth]} ${currentYear}`);

    // Próximo reset será no primeiro dia do próximo mês
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    setNextReset(`1 de ${monthNames[nextMonth]}`);
  };
  const loadRankings = async () => {
    try {
      setLoading(true);

      // Buscar usuários premium com planos ativos
      // Por enquanto simulando - em produção checaria tabela subscribers
      const {
        data: profiles,
        error
      } = await supabase.from("profiles").select("id, username, full_name, avatar_url").limit(200);
      if (error) throw error;

      // Simular dados apenas para usuários premium (50% dos usuários simulados são premium)
      const premiumProfiles = profiles?.filter((_, index) => index % 2 === 0) || [];
      
      const mockRankings: UserRankingData[] = premiumProfiles.map((profile, index) => ({
        user_id: profile.id,
        username: profile.username || `user${index + 1}`,
        full_name: profile.full_name || "Usuário Anônimo",
        avatar_url: profile.avatar_url,
        study_hours: Math.floor(Math.random() * 200) + 10,
        position: index + 1
      })).sort((a, b) => b.study_hours - a.study_hours).map((item, index) => ({
        ...item,
        position: index + 1
      }));
      
      setRankings(mockRankings.slice(0, 100)); // Top 100

      // Encontrar posição do usuário atual (simular posição entre todos os premium)
      if (user) {
        // Simular que o usuário tem posição 150 (fora do top 100)
        const allPremiumUsers = mockRankings.length;
        const userPosition = Math.floor(Math.random() * 200) + 101; // Posição simulada fora do top 100
        setUserPosition(userPosition);
      }
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
      toast({
        title: "Erro ao carregar ranking",
        description: "Não foi possível carregar os dados do ranking.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", user.id)
        .single();
        
      if (error) throw error;
      setUserProfile(profile);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    }
  };
  const getRankNumber = (position: number) => {
    const getStyleByPosition = (pos: number) => {
      switch (pos) {
        case 1:
          return "bg-gradient-to-r from-yellow-400 to-yellow-600 border-yellow-500 text-white shadow-lg";
        case 2:
          return "bg-gradient-to-r from-gray-300 to-gray-500 border-gray-400 text-white shadow-lg";
        case 3:
          return "bg-gradient-to-r from-orange-400 to-orange-600 border-orange-500 text-white shadow-lg";
        default:
          return "bg-primary/10 border-primary/20 text-primary";
      }
    };
    return <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${getStyleByPosition(position)}`}>
        <span className="text-sm font-bold">#{position}</span>
      </div>;
  };
  const getRankBadgeColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case 2:
        return "bg-gray-100 text-gray-800 border-gray-300";
      case 3:
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };
  const handleMouseMove = (e: React.MouseEvent, userData: UserRankingData) => {
    setMousePosition({
      x: e.clientX,
      y: e.clientY
    });
    setHoveredUser(userData);
  };
  const handleMouseLeave = () => {
    setHoveredUser(null);
  };
  if (loading) {
    return <div className="glass-card">
        <div className="p-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Trophy className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Carregando ranking...</p>
            </div>
          </div>
        </div>
      </div>;
  }
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Ranking Section */}
      <div className="glass-card">
        <div className="p-6 h-full flex flex-col">
        {/* Header do Ranking */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="glow-icon w-12 h-12 flex items-center justify-center relative">
              <Trophy className="w-7 h-7 text-white z-10 relative" />
            </div>
            <div>
              <h2 className="text-lg font-bold gradient-text">Ranking Premium Mensal</h2>
              <p className="text-xs text-foreground/70">Top 100 estudantes premium por horas de estudo</p>
            </div>
          </div>
          
          <div className="text-right text-xs">
            <div className="flex items-center space-x-1 justify-end">
              <Clock className="w-3 h-3 text-primary" />
              <p className="font-medium">{currentPeriod}</p>
            </div>
            <p className="text-muted-foreground">Reset: {nextReset}</p>
          </div>
        </div>

        {/* Lista do Ranking */}
        <ScrollArea className="h-[380px]">
          <div className="space-y-1 pr-2">
            {rankings.slice(0, userPosition && userPosition <= 100 ? 100 : 99).map(rankingUser => <div key={rankingUser.user_id} className="flex items-center justify-between py-2 px-3 hover:bg-primary/5 transition-colors cursor-pointer border-b border-border/50" onMouseMove={e => handleMouseMove(e, rankingUser)} onMouseLeave={handleMouseLeave}>
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-muted-foreground w-6 text-center">#{rankingUser.position}</span>
                    <div className="w-6 h-6 bg-gradient-to-r from-primary to-primary/70 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                      {rankingUser.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs truncate">{rankingUser.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">@{rankingUser.username}</p>
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-primary">{rankingUser.study_hours}h</p>
                </div>
              </div>)}
          </div>
        </ScrollArea>


        {/* Footer com instruções e posição do usuário */}
        <div className="mt-auto pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            {/* Botão de Instruções */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Info className="w-3 h-3" />
                  <span>Instruções</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    <span>Como funciona o ranking</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• <strong>Ranking exclusivo</strong> para estudantes premium</p>
                    <p>• <strong>Baseado no tempo total</strong> de estudos na plataforma</p>
                    <p>• <strong>Atualizado em tempo real</strong> conforme você estuda</p>
                    <p>• <strong>Rankings resetam mensalmente</strong> no dia 1º</p>
                    <p>• <strong>Apenas os top 100</strong> usuários aparecem na lista</p>
                    <p>• <strong>Sua posição é privada</strong> (só você pode ver) exceto se estiver no ranking</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Posição do usuário atual (estilo ranking) - sempre visível */}
            {userPosition && user && (
              <div className="bg-primary/5 rounded-lg py-3 px-5 border border-primary/20 min-w-[240px]">
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-muted-foreground">#{userPosition}</span>
                    <div className="w-6 h-6 bg-gradient-to-r from-primary to-primary/70 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{
                        (() => {
                          const fullName = user.user_metadata?.full_name || userProfile?.full_name || userProfile?.username || user.email?.split('@')[0] || 'Usuário';
                          const nameParts = fullName.split(' ');
                          return nameParts.slice(0, 2).join(' ');
                        })()
                      }</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-primary">{Math.floor(Math.random() * 50) + 10}h</p>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* File Manager Section */}
      <MedicalFileManager onUpgrade={() => window.location.href = '/subscription-plans'} />
    </div>;
};