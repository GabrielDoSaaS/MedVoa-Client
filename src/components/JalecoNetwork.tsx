import { useState, useCallback, memo } from "react";
import { Users, Gamepad2 } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { JalecoGames } from "@/components/JalecoGames";
import { GameSetupDialog } from "@/components/games/GameSetupDialog";
import { TicTacToeGame } from "@/components/games/TicTacToeGame";
import { HangmanGame } from "@/components/games/HangmanGame";
import { JengaGame } from "@/components/games/JengaGame";
import { MemoryGame } from "@/components/games/MemoryGame";
import { Skeleton } from "@/components/ui/skeleton";
interface JalecoNetworkProps {
  user: User | null;
}
const JalecoNetworkComponent = ({
  user
}: JalecoNetworkProps) => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [gameContent, setGameContent] = useState("");
  const games = [{
    id: "tic-tac-toe",
    title: "Jogo da Velha do Saber",
    component: TicTacToeGame
  }, {
    id: "medical-hangman",
    title: "Forca Terapêutica",
    component: HangmanGame
  }, {
    id: "tower-quiz",
    title: "Quiz da Torre",
    component: JengaGame
  }, {
    id: "memory-clinic",
    title: "Memória Clínica",
    component: MemoryGame
  }];
  const handleGameSelect = useCallback((gameId: string) => {
    setSelectedGame(gameId);
    setShowSetupDialog(true);
  }, []);

  const handleGameStart = useCallback((content: string) => {
    setGameContent(content);
    setShowSetupDialog(false);
  }, []);

  const handleGameBack = useCallback(() => {
    setSelectedGame(null);
    setGameContent("");
  }, []);

  // Renderizar jogo selecionado se gameContent existir
  if (selectedGame && gameContent) {
    const game = games.find(g => g.id === selectedGame);
    if (game) {
      const GameComponent = game.component;
      return <GameComponent onBack={handleGameBack} studyContent={gameContent} />;
    }
  }
  return <div className="min-h-screen">
      <div className="container mx-auto px-6 py-12 max-w-6xl relative z-10">
        {/* Título principal */}
        <div className="text-center mb-12">
          <h1 className="text-foreground font-bold mb-4 tracking-tight text-4xl">Med Play</h1>
          <p className="text-foreground/70 leading-relaxed max-w-2xl mx-auto text-lg">
            Conecte-se com outros estudantes através de jogos educativos
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto rounded-full mt-6"></div>
        </div>

        {/* Features Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="glass-card p-8">
            <div className="flex items-start space-x-6">
              <div className="glow-icon">
                <Gamepad2 className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold text-foreground mb-3">Jogos Educativos</h3>
                <p className="text-foreground/70 leading-relaxed">
                  Aprenda medicina de forma divertida com nossos jogos interativos especialmente desenvolvidos para estudantes da área da saúde.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 relative">
            <div className="flex items-start space-x-6">
              <div className="glow-icon">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold text-foreground mb-3">Modo Multiplayer</h3>
                <p className="text-foreground/70 leading-relaxed">
                  Desafie outros estudantes em tempo real e compartilhe conhecimento através de experiências colaborativas.
                </p>
              </div>
            </div>
            <div className="absolute top-2 right-4 px-3 py-1 text-xs bg-gradient-to-r from-primary/20 to-accent/20 text-primary rounded-full border border-primary/30 font-medium">
              em breve
            </div>
          </div>
        </div>

        {/* Jogos Disponíveis */}
        <JalecoGames user={user} onGameSelect={handleGameSelect} />

        {/* Mensagem sobre novos jogos */}
        <div className="text-center mt-16 mb-8">
          <p className="text-foreground/50 text-sm">
            Novos jogos educativos chegando em breve...
          </p>
        </div>

        <GameSetupDialog isOpen={showSetupDialog} onClose={() => setShowSetupDialog(false)} onStart={handleGameStart} gameTitle={games.find(g => g.id === selectedGame)?.title || ""} />
      </div>
    </div>;
};

export const JalecoNetwork = memo(JalecoNetworkComponent);