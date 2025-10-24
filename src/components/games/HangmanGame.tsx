import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trophy, Heart, RefreshCw } from "lucide-react";

interface HangmanGameProps {
  onBack: () => void;
  studyContent: string;
}

export const HangmanGame = ({ onBack, studyContent }: HangmanGameProps) => {
  const [currentWord, setCurrentWord] = useState("");
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [letterGuess, setLetterGuess] = useState("");
  const [wordGuess, setWordGuess] = useState("");
  const [gamePhase, setGamePhase] = useState<"question" | "guess" | "wordguess" | "gameover">("question");
  const [lives, setLives] = useState(6);
  const [score, setScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [letterAttempts, setLetterAttempts] = useState(0);
  const [showWordGuess, setShowWordGuess] = useState(false);

  const medicalWords = [
    { word: "CORAÇÃO", clue: "Órgão que bombeia sangue" },
    { word: "PULMÃO", clue: "Órgão responsável pela respiração" },
    { word: "FÍGADO", clue: "Maior órgão interno do corpo" },
    { word: "NEURÔNIO", clue: "Célula do sistema nervoso" },
    { word: "HEMOGLOBINA", clue: "Proteína que transporta oxigênio" }
  ];

  const questions = [
    { question: "Qual é a função principal do coração?", answer: "bombear sangue" },
    { question: "Qual o maior órgão do corpo humano?", answer: "pele" },
    { question: "Quantos ossos tem o corpo humano adulto?", answer: "206" },
    { question: "Qual hormônio regula o açúcar no sangue?", answer: "insulina" },
    { question: "Qual o nome do processo de divisão celular?", answer: "mitose" }
  ];

  const hangmanStages = [
    "  ____\n  |  |\n  |\n  |\n  |\n__|__",
    "  ____\n  |  |\n  |  😵\n  |\n  |\n__|__",
    "  ____\n  |  |\n  |  😵\n  |  |\n  |\n__|__",
    "  ____\n  |  |\n  |  😵\n  | /|\n  |\n__|__",
    "  ____\n  |  |\n  |  😵\n  | /|\\\n  |\n__|__",
    "  ____\n  |  |\n  |  😵\n  | /|\\\n  | /\n__|__",
    "  ____\n  |  |\n  |  😵\n  | /|\\\n  | / \\\n__|__"
  ];

  const generateQuestion = () => {
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    setCurrentQuestion(randomQuestion.question);
    setGamePhase("question");
    setUserAnswer("");
  };

  const checkAnswer = () => {
    const currentQ = questions.find(q => q.question === currentQuestion);
    if (currentQ && userAnswer.toLowerCase().includes(currentQ.answer.toLowerCase())) {
      setGamePhase("guess");
      return true;
    } else {
      setLives(prev => prev - 1);
      if (lives <= 1) {
        setGamePhase("gameover");
        setGameWon(false);
      } else {
        generateQuestion();
      }
      return false;
    }
  };

  const guessLetter = () => {
    if (letterGuess && !guessedLetters.includes(letterGuess.toUpperCase())) {
      const newGuessedLetters = [...guessedLetters, letterGuess.toUpperCase()];
      setGuessedLetters(newGuessedLetters);
      setLetterAttempts(prev => prev + 1);
      
      if (currentWord.includes(letterGuess.toUpperCase())) {
        setScore(prev => prev + 10);
        // Check if word is complete
        const isComplete = currentWord.split('').every(letter => 
          newGuessedLetters.includes(letter) || letter === ' '
        );
        if (isComplete) {
          setGameWon(true);
          setGamePhase("gameover");
          setScore(prev => prev + 50);
        } else {
          generateQuestion();
        }
      } else {
        setLives(prev => prev - 1);
        if (lives <= 1) {
          setGamePhase("gameover");
          setGameWon(false);
        } else {
          generateQuestion();
        }
      }
      setLetterGuess("");
    }
  };

  const guessWord = () => {
    if (wordGuess.toUpperCase() === currentWord) {
      setGameWon(true);
      setGamePhase("gameover");
      setScore(prev => prev + 100);
    } else {
      setLives(prev => prev - 1);
      if (lives <= 1) {
        setGamePhase("gameover");
        setGameWon(false);
      } else {
        generateQuestion();
      }
    }
    setWordGuess("");
  };

  const resetGame = () => {
    const randomWord = medicalWords[Math.floor(Math.random() * medicalWords.length)];
    setCurrentWord(randomWord.word);
    setGuessedLetters([]);
    setLives(6);
    setScore(0);
    setGameWon(false);
    setLetterAttempts(0);
    setShowWordGuess(false);
    generateQuestion();
  };

  const displayWord = () => {
    return currentWord.split('').map(letter => 
      guessedLetters.includes(letter) || letter === ' ' ? letter : '_'
    ).join(' ');
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
              <div className="text-8xl mb-4 animate-bounce">{gameWon ? "🎉" : "💔"}</div>
              <CardTitle className="text-3xl text-purple-400">
                {gameWon ? "Parabéns! Você Salvou o Paciente!" : "O Paciente Não Resistiu"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
                {gameWon 
                  ? `Excelente trabalho! Você demonstrou conhecimento médico sólido e salvou uma vida. A palavra era "${currentWord}" e você conquistou ${score} pontos!`
                  : `Não desanime! A medicina exige prática constante. A palavra era "${currentWord}". Continue estudando para salvar mais vidas!`
                }
              </p>
              
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div className="p-4 rounded-xl border-2 border-emerald-500">
                  <div className="text-2xl font-bold text-emerald-500">{score}</div>
                  <div className="text-sm text-emerald-400">Pontos</div>
                </div>
                <div className="p-4 rounded-xl border-2 border-blue-500">
                  <div className="text-2xl font-bold text-blue-500">{lives}</div>
                  <div className="text-sm text-blue-400">Vidas Restantes</div>
                </div>
                <div className="p-4 rounded-xl border-2 border-purple-500">
                  <div className="text-2xl font-bold text-purple-500">{currentWord.length}</div>
                  <div className="text-sm text-purple-400">Letras</div>
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
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">🩺</div>
                <h3 className="font-bold text-foreground mb-2">Vocabulário Médico</h3>
                <p className="text-sm text-muted-foreground">
                  Você expandiu seu conhecimento de termos médicos essenciais para a prática clínica!
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">🧠</div>
                <h3 className="font-bold text-foreground mb-2">Raciocínio Clínico</h3>
                <p className="text-sm text-muted-foreground">
                  Desenvolveu habilidades de dedução e associação fundamentais para diagnósticos.
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">❤️</div>
                <h3 className="font-bold text-foreground mb-2">Cuidado ao Paciente</h3>
                <p className="text-sm text-muted-foreground">
                  Treinou a responsabilidade e atenção necessárias para salvar vidas.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              💡 <strong>Dica:</strong> Estudos mostram que jogos educativos aumentam a retenção de vocabulário médico em até 300%. Continue praticando!
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
            <CardTitle className="gradient-text">Forca Terapêutica</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-semibold">Vidas: {lives}</span>
            </div>
            <div className="text-primary font-semibold">
              Pontos: {score}
            </div>
          </div>

          <div className="text-center">
            <pre className="text-xs font-mono bg-muted/50 p-4 rounded-lg">
              {hangmanStages[6 - lives]}
            </pre>
          </div>

          <div className="text-center">
            <p className="text-2xl font-mono font-bold tracking-wider mb-2">
              {displayWord()}
            </p>
            <div className="mb-4 p-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-foreground/80">
                💡 Dica: {medicalWords.find(w => w.word === currentWord)?.clue || "Termo médico"}
              </p>
            </div>
            <p className="text-sm text-foreground/70">
              Letras usadas: {guessedLetters.join(', ')}
            </p>
          </div>

          {gamePhase === "question" && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-amber-700">Responda para tentar uma letra:</h3>
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

          {gamePhase === "guess" && (
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="p-4 space-y-4">
                <p className="text-green-600 font-semibold">✅ Resposta correta!</p>
                <p className="text-foreground">Agora tente uma letra:</p>
                <div className="flex space-x-2">
                  <Input
                    value={letterGuess}
                    onChange={(e) => setLetterGuess(e.target.value.slice(0, 1))}
                    placeholder="Digite uma letra..."
                    className="glass-input"
                    maxLength={1}
                    onKeyPress={(e) => e.key === 'Enter' && guessLetter()}
                  />
                  <Button onClick={guessLetter} className="btn-primary">
                    Tentar Letra
                  </Button>
                </div>
                {letterAttempts >= 3 && (
                  <div className="flex justify-center pt-2">
                    <Button 
                      onClick={() => setShowWordGuess(!showWordGuess)} 
                      variant="outline" 
                      className="btn-secondary"
                    >
                      🎯 Chutar Palavra
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {letterAttempts >= 3 && !showWordGuess && (
            <div className="flex justify-center">
              <Button 
                onClick={() => setShowWordGuess(true)} 
                variant="outline" 
                className="btn-secondary"
              >
                🎯 Chutar Palavra Completa ({letterAttempts} tentativas)
              </Button>
            </div>
          )}

          {showWordGuess && letterAttempts >= 3 && (
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-4 space-y-4">
                <p className="text-blue-600 font-semibold">🎯 Chutar palavra completa:</p>
                <p className="text-foreground">Digite a palavra que você acha que é:</p>
                <div className="flex space-x-2">
                  <Input
                    value={wordGuess}
                    onChange={(e) => setWordGuess(e.target.value)}
                    placeholder="Digite a palavra completa..."
                    className="glass-input"
                    onKeyPress={(e) => e.key === 'Enter' && guessWord()}
                  />
                  <Button onClick={guessWord} className="btn-primary">
                    Chutar Palavra
                  </Button>
                </div>
                <p className="text-xs text-blue-600">
                  💡 Tentativas de letras: {letterAttempts}/3
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};