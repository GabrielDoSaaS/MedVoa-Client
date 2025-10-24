import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trophy } from "lucide-react";

interface MazeGameProps {
  onBack: () => void;
  studyContent: string;
}

type Position = {
  x: number;
  y: number;
};

export const MazeGame = ({ onBack, studyContent }: MazeGameProps) => {
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 0 });
  const [botPos, setBotPos] = useState<Position>({ x: 0, y: 4 });
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [gamePhase, setGamePhase] = useState<"question" | "gameover">("question");
  const [score, setScore] = useState({ player: 0, bot: 0 });
  const [turn, setTurn] = useState<"player" | "bot">("player");

  const mazeSize = 5;
  const goalPos = { x: 4, y: 2 };

  const questions = [
    { question: "Qual é a função principal do coração?", answer: "bombear sangue" },
    { question: "Qual o maior órgão do corpo humano?", answer: "pele" },
    { question: "Quantos ossos tem o corpo humano adulto?", answer: "206" },
    { question: "Qual hormônio regula o açúcar no sangue?", answer: "insulina" },
    { question: "Qual o nome do processo de divisão celular?", answer: "mitose" },
    { question: "Qual a função dos leucócitos?", answer: "defesa" },
    { question: "Onde são produzidas as hemácias?", answer: "medula óssea" },
    { question: "Qual o nome da proteína que transporta oxigênio?", answer: "hemoglobina" }
  ];

  // Simple maze layout (0 = path, 1 = wall)
  const maze = [
    [0, 1, 0, 0, 0],
    [0, 1, 0, 1, 0],
    [0, 0, 0, 1, 1],
    [1, 1, 0, 0, 0],
    [0, 0, 0, 1, 0]
  ];

  const generateQuestion = () => {
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    setCurrentQuestion(randomQuestion.question);
    setUserAnswer("");
  };

  const checkAnswer = () => {
    const currentQ = questions.find(q => q.question === currentQuestion);
    if (currentQ && userAnswer.toLowerCase().includes(currentQ.answer.toLowerCase())) {
      // Correct answer - player moves forward
      movePlayer();
      setScore(prev => ({ ...prev, player: prev.player + 10 }));
    } else {
      // Wrong answer - player loses turn, bot moves
      moveBot();
    }
  };

  const movePlayer = () => {
    const newPos = { ...playerPos };
    
    // Try to move towards goal
    if (newPos.x < goalPos.x && maze[newPos.y][newPos.x + 1] === 0) {
      newPos.x++;
    } else if (newPos.y < goalPos.y && maze[newPos.y + 1][newPos.x] === 0) {
      newPos.y++;
    } else if (newPos.y > goalPos.y && maze[newPos.y - 1][newPos.x] === 0) {
      newPos.y--;
    } else if (newPos.x > goalPos.x && maze[newPos.y][newPos.x - 1] === 0) {
      newPos.x--;
    } else {
      // Find any valid move
      const directions = [
        { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
      ];
      
      for (const dir of directions) {
        const testX = newPos.x + dir.x;
        const testY = newPos.y + dir.y;
        if (testX >= 0 && testX < mazeSize && testY >= 0 && testY < mazeSize && maze[testY][testX] === 0) {
          newPos.x = testX;
          newPos.y = testY;
          break;
        }
      }
    }
    
    setPlayerPos(newPos);
    
    // Check if player reached goal
    if (newPos.x === goalPos.x && newPos.y === goalPos.y) {
      setScore(prev => ({ ...prev, player: prev.player + 100 }));
      setGamePhase("gameover");
      return;
    }
    
    setTurn("bot");
    setTimeout(() => moveBot(), 1000);
  };

  const moveBot = () => {
    const newPos = { ...botPos };
    
    // Bot moves randomly but towards goal
    const directions = [
      { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
    ];
    
    // Prioritize moves towards goal
    directions.sort(() => Math.random() - 0.5);
    
    for (const dir of directions) {
      const testX = newPos.x + dir.x;
      const testY = newPos.y + dir.y;
      if (testX >= 0 && testX < mazeSize && testY >= 0 && testY < mazeSize && maze[testY][testX] === 0) {
        newPos.x = testX;
        newPos.y = testY;
        break;
      }
    }
    
    setBotPos(newPos);
    
    // Check if bot reached goal
    if (newPos.x === goalPos.x && newPos.y === goalPos.y) {
      setScore(prev => ({ ...prev, bot: prev.bot + 100 }));
      setGamePhase("gameover");
      return;
    }
    
    setTurn("player");
    generateQuestion();
  };

  const resetGame = () => {
    setPlayerPos({ x: 0, y: 0 });
    setBotPos({ x: 0, y: 4 });
    setScore({ player: 0, bot: 0 });
    setTurn("player");
    generateQuestion();
    setGamePhase("question");
  };

  const renderMaze = () => {
    return (
      <div className="grid grid-cols-5 gap-1 max-w-xs mx-auto p-4 bg-muted/20 rounded-lg">
        {maze.map((row, y) =>
          row.map((cell, x) => {
            const isPlayer = playerPos.x === x && playerPos.y === y;
            const isBot = botPos.x === x && botPos.y === y;
            const isGoal = goalPos.x === x && goalPos.y === y;
            const isWall = cell === 1;
            
            return (
              <div
                key={`${x}-${y}`}
                className={`w-12 h-12 flex items-center justify-center text-lg font-bold rounded ${
                  isWall
                    ? 'bg-muted border-2 border-muted-foreground'
                    : 'bg-background border border-border'
                }`}
              >
                {isPlayer && "🚶"}
                {isBot && "🤖"}
                {isGoal && !isPlayer && !isBot && "🎯"}
                {isWall && "🧱"}
              </div>
            );
          })
        )}
      </div>
    );
  };

  useEffect(() => {
    resetGame();
  }, []);

  if (gamePhase === "gameover") {
    const playerWon = playerPos.x === goalPos.x && playerPos.y === goalPos.y;
    const botWon = botPos.x === goalPos.x && botPos.y === goalPos.y;
    
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button onClick={onBack} variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <CardTitle className="gradient-text">Labirinto Terapêutico</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <Trophy className="w-16 h-16 mx-auto text-primary" />
            <h2 className="text-2xl font-bold">
              {playerWon ? "Parabéns! Você Chegou Primeiro! 🎉" : 
               botWon ? "Medvoa Bot Chegou Primeiro! 🤖" : 
               "Jogo Finalizado!"}
            </h2>
            
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-primary">{score.player}</p>
                <p className="text-sm text-foreground/70">Você</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-destructive">{score.bot}</p>
                <p className="text-sm text-foreground/70">Medvoa Bot</p>
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
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button onClick={onBack} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <CardTitle className="gradient-text">Labirinto Terapêutico</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="glass-card p-3">
              <p className="text-lg font-bold text-primary">{score.player}</p>
              <p className="text-sm text-foreground/70">Você 🚶</p>
            </div>
            <div className="glass-card p-3">
              <p className="text-sm text-foreground/70">Vez do:</p>
              <p className="font-bold">{turn === "player" ? "Jogador" : "Medvoa Bot"}</p>
            </div>
            <div className="glass-card p-3">
              <p className="text-lg font-bold text-destructive">{score.bot}</p>
              <p className="text-sm text-foreground/70">Medvoa Bot 🤖</p>
            </div>
          </div>

          {renderMaze()}

          <div className="text-center text-sm text-foreground/70">
            <p>🎯 = Meta | 🧱 = Parede | 🚶 = Você | 🤖 = Medvoa Bot</p>
            <p className="mt-1">Seja o primeiro a chegar na meta!</p>
          </div>

          {turn === "player" && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-amber-700">
                  Responda corretamente para avançar no labirinto:
                </h3>
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
                    Avançar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {turn === "bot" && (
            <div className="text-center">
              <p className="text-foreground/70">🤖 Medvoa Bot está pensando e se movendo...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};