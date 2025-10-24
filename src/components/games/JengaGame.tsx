import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trophy, RefreshCw } from "lucide-react";

interface JengaGameProps {
  onBack: () => void;
  studyContent: string;
}

export const JengaGame = ({ onBack, studyContent }: JengaGameProps) => {
  const [tower, setTower] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [gamePhase, setGamePhase] = useState<"question" | "gameover">("question");
  const [score, setScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [round, setRound] = useState(1);

  const questions = [
    { question: "Qual é a função principal da insulina?", answer: "regular glicose" },
    { question: "Qual o maior órgão do corpo humano?", answer: "pele" },
    { question: "Quantas câmaras tem o coração humano?", answer: "4" },
    { question: "Qual hormônio regula o açúcar no sangue?", answer: "insulina" },
    { question: "Qual o nome do processo de divisão celular?", answer: "mitose" },
    { question: "Qual a função dos leucócitos?", answer: "defesa" },
    { question: "Onde são produzidas as hemácias?", answer: "medula óssea" },
    { question: "Qual o nome da proteína que transporta oxigênio?", answer: "hemoglobina" }
  ];

  const initializeTower = () => {
    setTower([3, 3, 3, 3, 3]); // 5 níveis com 3 blocos cada
  };

  const generateQuestion = () => {
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    setCurrentQuestion(randomQuestion.question);
    setUserAnswer("");
  };

  const checkAnswer = () => {
    const currentQ = questions.find(q => q.question === currentQuestion);
    if (currentQ && userAnswer.toLowerCase().includes(currentQ.answer.toLowerCase())) {
      // Correct answer - player removes a block safely
      removeBlock(false);
      setScore(prev => prev + 20);
    } else {
      // Wrong answer - bot removes a block randomly (might cause tower to fall)
      removeBlock(true);
    }
  };

  const removeBlock = (isBot: boolean) => {
    const newTower = [...tower];
    
    if (isBot) {
      // Bot removes randomly - higher chance of tower falling
      const nonEmptyLevels = newTower.map((blocks, index) => blocks > 0 ? index : -1).filter(i => i !== -1);
      if (nonEmptyLevels.length > 0) {
        const randomLevel = nonEmptyLevels[Math.floor(Math.random() * nonEmptyLevels.length)];
        newTower[randomLevel]--;
        
        // Check if tower falls (if any level becomes 0 or structure becomes unstable)
        if (newTower[randomLevel] === 0 || Math.random() < 0.3) {
          setGameWon(false);
          setGamePhase("gameover");
          return;
        }
      }
    } else {
      // Player removes carefully - lower chance of tower falling
      const nonEmptyLevels = newTower.map((blocks, index) => blocks > 0 ? index : -1).filter(i => i !== -1);
      if (nonEmptyLevels.length > 0) {
        const safestLevel = nonEmptyLevels[nonEmptyLevels.length - 1]; // Remove from top level (safer)
        newTower[safestLevel]--;
        
        // Small chance of tower falling even with correct answer
        if (newTower[safestLevel] === 0 && Math.random() < 0.1) {
          setGameWon(false);
          setGamePhase("gameover");
          return;
        }
      }
    }
    
    setTower(newTower);
    
    // Check win condition (survived 10 rounds)
    if (round >= 10) {
      setGameWon(true);
      setGamePhase("gameover");
      setScore(prev => prev + 100);
    } else {
      setRound(prev => prev + 1);
      generateQuestion();
    }
  };

  const resetGame = () => {
    initializeTower();
    setScore(0);
    setRound(1);
    setGameWon(false);
    generateQuestion();
    setGamePhase("question");
  };

  const renderTower = () => {
    return (
      <div className="flex flex-col-reverse items-center space-y-1 space-y-reverse">
        {tower.map((blocks, level) => (
          <div key={level} className="flex space-x-1">
            {Array.from({ length: 3 }, (_, blockIndex) => (
              <div
                key={blockIndex}
                className={`w-12 h-8 rounded border-2 ${
                  blockIndex < blocks
                    ? 'bg-amber-200 border-amber-400 shadow-md'
                    : 'bg-transparent border-transparent'
                }`}
              >
                {blockIndex < blocks && (
                  <div className="w-full h-full bg-gradient-to-b from-amber-300 to-amber-500 rounded flex items-center justify-center text-xs font-bold text-amber-900">
                    🧱
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        
      </div>
    );
  };

  useEffect(() => {
    resetGame();
  }, []);

  if (gamePhase === "gameover") {
    return (
      <div className="min-h-screen py-6">
        <div className="w-full max-w-4xl mx-auto px-4 space-y-6">
          <Card className="glass-card shadow-2xl border-2 border-primary/20">
            <CardHeader className="text-center pb-2">
              <div className="text-8xl mb-4 animate-bounce">{gameWon ? "🎉" : "🏗️"}</div>
              <CardTitle className="text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {gameWon ? "Parabéns! Você Manteve a Torre de Pé!" : "A Torre Caiu!"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
                {gameWon 
                  ? `Impressionante! Você demonstrou conhecimento médico excepcional e estratégia cuidadosa. Sobreviveu a ${round - 1} rounds e conquistou ${score} pontos!`
                  : `A torre caiu, mas não desista! A medicina exige precisão e conhecimento. Você sobreviveu a ${round - 1} rounds. Continue estudando para construir uma base sólida!`
                }
              </p>
              
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div className="p-4 rounded-xl border-2 border-green-500 bg-green-500/10">
                  <div className="text-2xl font-bold text-green-500">{score}</div>
                  <div className="text-sm text-green-500">Pontos</div>
                </div>
                <div className="p-4 rounded-xl border-2 border-blue-500 bg-blue-500/10">
                  <div className="text-2xl font-bold text-blue-500">{round - 1}</div>
                  <div className="text-sm text-blue-500">Rounds</div>
                </div>
                <div className="p-4 rounded-xl border-2 border-purple-500 bg-purple-500/10">
                  <div className="text-2xl font-bold text-purple-500">{Math.max(0, 15 - tower.reduce((a, b) => a + b, 0))}</div>
                  <div className="text-sm text-purple-500">Blocos Removidos</div>
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button onClick={resetGame} className="btn-glow text-lg px-8 py-3">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Jogar Novamente
                </Button>
                <Button onClick={onBack} variant="outline" className="text-lg px-8 py-3">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card border border-primary/20 bg-primary/5">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-bold text-foreground mb-2">Precisão Diagnóstica</h3>
                <p className="text-sm text-foreground/80">
                  Você treinou a precisão e cuidado necessários para decisões médicas críticas!
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card border border-secondary/20 bg-secondary/5">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">⚖️</div>
                <h3 className="font-bold text-foreground mb-2">Tomada de Decisão</h3>
                <p className="text-sm text-foreground/80">
                  Desenvolveu habilidades de análise de risco essenciais para a prática médica.
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card border border-accent/20 bg-accent/5">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">🧪</div>
                <h3 className="font-bold text-foreground mb-2">Conhecimento Clínico</h3>
                <p className="text-sm text-foreground/80">
                  Expandiu sua base de conhecimento médico através de perguntas desafiadoras.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center p-4">
            <p className="text-white leading-relaxed">
              💡 <strong>DICA:</strong> A gamificação do aprendizado médico aumenta a retenção de conhecimento em até 250%. Continue desafiando-se!
            </p>
          </div>
        </div>
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
            <CardTitle className="gradient-text">Quiz da Torre (Jenga)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-primary font-semibold">
              Round: {round}/10
            </div>
            <div className="text-primary font-semibold">
              Pontos: {score}
            </div>
          </div>

          <div className="flex justify-center">
            {renderTower()}
          </div>

          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4 space-y-4">
              <div className="text-center">
                <p className="text-sm text-amber-700 mb-2">
                  ⚠️ Responda corretamente para remover um bloco com segurança!
                </p>
                <p className="text-sm text-foreground/70">
                  Se errar, o oponente remove um bloco aleatório e a torre pode cair!
                </p>
              </div>
              <h3 className="font-semibold text-amber-700">Pergunta:</h3>
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
                  Remover Bloco
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};