import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, Play, Brain, Target, Trophy, Clock, Star, Zap, Grid3X3, Type, Building2, RefreshCw, Hash, MapPin } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { GlobalRanking } from "@/components/jaleco-network/GlobalRanking";
import { UsageBanner } from "@/components/ui/usage-banner";
import { useSubscription } from "@/hooks/useSubscription";
import { TicTacToeGame } from "@/components/games/TicTacToeGame";
import { HangmanGame } from "@/components/games/HangmanGame";
import { JengaGame } from "@/components/games/JengaGame";
import { MemoryGame } from "@/components/games/MemoryGame";
interface JalecoGamesProps {
  user: User | null;
  onGameSelect?: (gameId: string) => void;
}
export const JalecoGames = ({
  user,
  onGameSelect
}: JalecoGamesProps) => {
  const {
    canUseFeature,
    getRemainingUsage,
    incrementUsage,
    subscription
  } = useSubscription(user);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const handleUpgrade = () => {
    window.open('/subscription', '_blank');
  };
  const games = [{
    id: "tic-tac-toe",
    title: "Jogo da Velha do Saber",
    description: "Responda perguntas para marcar posições no tabuleiro",
    icon: Grid3X3,
    difficulty: "Fácil"
  }, {
    id: "medical-hangman",
    title: "Forca Terapêutica",
    description: "Descubra termos médicos antes que o boneco seja completado",
    icon: Type,
    difficulty: "Médio"
  }, {
    id: "tower-quiz",
    title: "Quiz da Torre",
    description: "Remova blocos respondendo corretamente, sem derrubar!",
    icon: Building2,
    difficulty: "Médio"
  }, {
    id: "memory-clinic",
    title: "Memória Clínica",
    description: "Encontre pares de termos médicos e suas definições",
    icon: RefreshCw,
    difficulty: "Fácil"
  }];
  const startGame = (gameId: string) => {
    console.log('Tentando iniciar jogo:', gameId);
    console.log('Pode usar games:', canUseFeature('games', 'daily'));
    console.log('Uso restante games:', getRemainingUsage('games', 'daily'));
    
    if (!canUseFeature('games', 'daily')) {
      console.log('Limite de jogos atingido para hoje');
      return;
    }
    
    if (onGameSelect) {
      console.log('Chamando onGameSelect');
      onGameSelect(gameId);
      return;
    }
    
    console.log('Iniciando jogo:', gameId);
    incrementUsage('games', 'daily');
    incrementUsage('games', 'monthly');
    setSelectedGame(gameId);
    setGameActive(true);
    setCurrentQuestion(0);
    setScore(0);
    setTimeLeft(60);
  };
  const endGame = () => {
    setGameActive(false);
    setSelectedGame(null);
  };
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  if (gameActive && selectedGame) {
    const studyContent = "Conteúdo médico para estudos";
    
    switch (selectedGame) {
      case "tic-tac-toe":
        return <TicTacToeGame onBack={endGame} studyContent={studyContent} />;
      case "medical-hangman":
        return <HangmanGame onBack={endGame} studyContent={studyContent} />;
      case "tower-quiz":
        return <JengaGame onBack={endGame} studyContent={studyContent} />;
      case "memory-clinic":
        return <MemoryGame onBack={endGame} studyContent={studyContent} />;
      default:
        return null;
    }
  }
  return <div className="space-y-8">
      {/* Usage Banner */}
      <UsageBanner featureType="jogos" remaining={getRemainingUsage('games', 'daily')} total={3} resetPeriod="todos os dias" onUpgrade={handleUpgrade} isPremium={subscription.subscription_tier === 'premium'} />

      {/* Título da Seção */}
      <div className="text-center mb-8">
        <h2 className="text-foreground font-bold mb-4 text-4xl">Jogos Disponíveis</h2>
        <p className="text-foreground/70 max-w-2xl mx-auto text-lg">
          Escolha um jogo educativo e aprenda medicina de forma divertida
        </p>
        <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto rounded-full mt-6"></div>
      </div>

      {/* Lista de Jogos */}
      <div className="grid md:grid-cols-2 gap-6">
        {games.map(game => <div key={game.id} className="glass-card p-6 group hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="glow-icon">
                <game.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-2">{game.title}</h3>
                    <p className="text-foreground/70 text-sm leading-relaxed">
                      {game.description}
                    </p>
                  </div>
                  <Button onClick={() => startGame(game.id)} disabled={!canUseFeature('games', 'daily')} className="btn-glow ml-4" size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    {!canUseFeature('games', 'daily') ? 'Limite Atingido' : 'Jogar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>)}
      </div>
    </div>;
};