import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trophy } from "lucide-react";

interface DominoGameProps {
  onBack: () => void;
  studyContent: string;
}

type DominoTile = {
  id: number;
  left: string;
  right: string;
  isPlayed: boolean;
  playedBy: 'player' | 'bot' | null;
};

export const DominoGame = ({ onBack, studyContent }: DominoGameProps) => {
  const [playerTiles, setPlayerTiles] = useState<DominoTile[]>([]);
  const [botTiles, setBotTiles] = useState<DominoTile[]>([]);
  const [playedSequence, setPlayedSequence] = useState<DominoTile[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [gamePhase, setGamePhase] = useState<"question" | "play" | "gameover">("question");
  const [turn, setTurn] = useState<"player" | "bot">("player");
  const [canPlay, setCanPlay] = useState(false);
  const [score, setScore] = useState({ player: 0, bot: 0 });

  const medicalConnections = [
    { left: "Coração", right: "Bomba Sangue" },
    { left: "Bomba Sangue", right: "Circulação" },
    { left: "Circulação", right: "Oxigenação" },
    { left: "Oxigenação", right: "Pulmão" },
    { left: "Pulmão", right: "Respiração" },
    { left: "Respiração", right: "CO2" },
    { left: "CO2", right: "Expiração" },
    { left: "Insulina", right: "Glicose" },
    { left: "Glicose", right: "Energia" },
    { left: "Energia", right: "Mitocôndria" },
    { left: "Mitocôndria", right: "ATP" },
    { left: "ATP", right: "Metabolismo" }
  ];

  const questions = [
    { question: "Qual órgão bombeia sangue?", answer: "coração" },
    { question: "Qual hormônio regula a glicose?", answer: "insulina" },
    { question: "Onde é produzida a energia celular?", answer: "mitocôndria" },
    { question: "Qual gás é eliminado na expiração?", answer: "co2" },
    { question: "Qual processo permite a troca gasosa?", answer: "respiração" }
  ];

  const initializeGame = () => {
    const allTiles: DominoTile[] = medicalConnections.map((conn, index) => ({
      id: index,
      left: conn.left,
      right: conn.right,
      isPlayed: false,
      playedBy: null
    }));

    // Shuffle and distribute tiles
    const shuffled = [...allTiles].sort(() => Math.random() - 0.5);
    const playerHand = shuffled.slice(0, 6);
    const botHand = shuffled.slice(6, 12);

    setPlayerTiles(playerHand);
    setBotTiles(botHand);
    setPlayedSequence([]);
    setScore({ player: 0, bot: 0 });
  };

  const generateQuestion = () => {
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    setCurrentQuestion(randomQuestion.question);
    setUserAnswer("");
    setGamePhase("question");
  };

  const checkAnswer = () => {
    const currentQ = questions.find(q => q.question === currentQuestion);
    if (currentQ && userAnswer.toLowerCase().includes(currentQ.answer.toLowerCase())) {
      setGamePhase("play");
      setCanPlay(turn === "player");
    } else {
      // Wrong answer - skip player turn
      setTurn("bot");
      setTimeout(() => botMove(), 1000);
    }
  };

  const canPlayTile = (tile: DominoTile): boolean => {
    if (playedSequence.length === 0) return true;
    
    const firstTile = playedSequence[0];
    const lastTile = playedSequence[playedSequence.length - 1];
    
    return (
      tile.left === firstTile.left ||
      tile.right === lastTile.right ||
      tile.left === lastTile.right ||
      tile.right === firstTile.left
    );
  };

  const playTile = (tile: DominoTile, player: 'player' | 'bot') => {
    const newPlayedSequence = [...playedSequence];
    const playedTile = { ...tile, isPlayed: true, playedBy: player };
    
    if (newPlayedSequence.length === 0) {
      newPlayedSequence.push(playedTile);
    } else {
      const lastTile = newPlayedSequence[newPlayedSequence.length - 1];
      if (tile.left === lastTile.right) {
        newPlayedSequence.push(playedTile);
      } else if (tile.right === lastTile.right) {
        newPlayedSequence.push({ ...playedTile, left: tile.right, right: tile.left });
      } else {
        newPlayedSequence.unshift(playedTile);
      }
    }
    
    setPlayedSequence(newPlayedSequence);
    
    if (player === 'player') {
      setPlayerTiles(prev => prev.filter(t => t.id !== tile.id));
      setScore(prev => ({ ...prev, player: prev.player + 10 }));
    } else {
      setBotTiles(prev => prev.filter(t => t.id !== tile.id));
      setScore(prev => ({ ...prev, bot: prev.bot + 10 }));
    }
    
    // Check win condition
    if (playerTiles.length === 1 || botTiles.length === 1) {
      setGamePhase("gameover");
      return;
    }
    
    setTurn(player === 'player' ? 'bot' : 'player');
    if (player === 'player') {
      setTimeout(() => botMove(), 1000);
    } else {
      generateQuestion();
    }
  };

  const botMove = () => {
    const playableTiles = botTiles.filter(tile => canPlayTile(tile));
    if (playableTiles.length > 0) {
      const randomTile = playableTiles[Math.floor(Math.random() * playableTiles.length)];
      playTile(randomTile, 'bot');
    } else {
      // Bot passes
      setTurn("player");
      generateQuestion();
    }
  };

  const resetGame = () => {
    initializeGame();
    setTurn("player");
    generateQuestion();
  };

  useEffect(() => {
    resetGame();
  }, []);

  if (gamePhase === "gameover") {
    const winner = playerTiles.length < botTiles.length ? "Você" : 
                   botTiles.length < playerTiles.length ? "Medvoa Bot" : "Empate";
    
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button onClick={onBack} variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <CardTitle className="gradient-text">Dominó do Saber</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <Trophy className="w-16 h-16 mx-auto text-primary" />
            <h2 className="text-2xl font-bold">
              {winner === "Você" ? "Parabéns! Você Ganhou! 🎉" : 
               winner === "Medvoa Bot" ? "Medvoa Bot Ganhou! 🤖" : 
               "Empate! 🤝"}
            </h2>
            
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-primary">{score.player}</p>
                <p className="text-sm text-foreground/70">Seus Pontos</p>
                <p className="text-xs text-foreground/50">{playerTiles.length} peças restantes</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-destructive">{score.bot}</p>
                 <p className="text-sm text-foreground/70">Medvoa Bot</p>
                <p className="text-xs text-foreground/50">{botTiles.length} peças restantes</p>
              </div>
            </div>

            <div className="space-x-4">
              <Button onClick={resetGame} className="btn-primary">
                Jogar Novamente
              </Button>
              <Button onClick={onBack} variant="outline">
                Voltar ao Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button onClick={onBack} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <CardTitle className="gradient-text">Dominó do Saber</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="glass-card p-3">
              <p className="text-lg font-bold text-primary">{score.player}</p>
              <p className="text-sm text-foreground/70">Seus Pontos</p>
              <p className="text-xs text-foreground/50">{playerTiles.length} peças</p>
            </div>
            <div className="glass-card p-3">
              <p className="text-sm text-foreground/70">Vez do:</p>
              <p className="font-bold">{turn === "player" ? "Jogador" : "Medvoa Bot"}</p>
            </div>
            <div className="glass-card p-3">
              <p className="text-lg font-bold text-destructive">{score.bot}</p>
              <p className="text-sm text-foreground/70">Medvoa Bot</p>
              <p className="text-xs text-foreground/50">{botTiles.length} peças</p>
            </div>
          </div>

          {/* Played Sequence */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Sequência Jogada:</h3>
            <div className="flex flex-wrap justify-center gap-2 min-h-[80px] items-center">
              {playedSequence.length === 0 ? (
                <p className="text-foreground/50">Nenhuma peça jogada ainda</p>
              ) : (
                playedSequence.map((tile, index) => (
                  <div
                    key={`played-${tile.id}-${index}`}
                    className={`glass-card p-3 text-sm border-2 ${
                      tile.playedBy === 'player' ? 'border-primary/50' : 'border-destructive/50'
                    }`}
                  >
                    <div className="font-bold">{tile.left}</div>
                    <div className="text-xs text-foreground/70">|</div>
                    <div className="font-bold">{tile.right}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {gamePhase === "question" && turn === "player" && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-amber-700">Responda para jogar uma peça:</h3>
                <p className="text-foreground">{currentQuestion}</p>
                <div className="flex space-x-2">
                  <Input
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Digite sua resposta..."
                    className="glass-input"
                    onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                  />
                  <Button onClick={checkAnswer} className="btn-primary">
                    Responder
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {gamePhase === "play" && turn === "player" && canPlay && (
            <div className="text-center">
              <p className="text-green-600 font-semibold mb-4">✅ Resposta correta! Escolha uma peça para jogar:</p>
            </div>
          )}

          {/* Player's Tiles */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Suas Peças:</h3>
            <div className="flex flex-wrap gap-3">
              {playerTiles.map((tile) => (
                <button
                  key={tile.id}
                  onClick={() => playTile(tile, 'player')}
                  disabled={!canPlay || !canPlayTile(tile)}
                  className="glass-card p-3 text-sm hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-primary/20"
                >
                  <div className="font-bold text-primary">{tile.left}</div>
                  <div className="text-xs text-foreground/70">|</div>
                  <div className="font-bold text-primary">{tile.right}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Bot's Tiles (hidden) */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Peças do Medvoa Bot:</h3>
            <div className="flex flex-wrap gap-3">
              {botTiles.map((tile, index) => (
                <div
                  key={`bot-${tile.id}-${index}`}
                  className="glass-card p-3 text-sm border-2 border-destructive/20"
                >
                  <div className="text-2xl">🧠</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};