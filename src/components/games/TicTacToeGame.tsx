import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, RefreshCw } from "lucide-react";
interface TicTacToeGameProps {
  onBack: () => void;
  studyContent: string;
}
type Player = 'X' | 'O' | null;
type Board = Player[];
export const TicTacToeGame = ({
  onBack,
  studyContent
}: TicTacToeGameProps) => {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<Player | 'tie'>(null);
  const [gamePhase, setGamePhase] = useState<'question' | 'playing' | 'gameover'>('playing');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [score, setScore] = useState({
    player: 0,
    bot: 0
  });
  const questions = [{
    question: "Qual é a função principal do coração?",
    answer: "bombear sangue"
  }, {
    question: "Quantos ossos tem o corpo humano adulto?",
    answer: "206"
  }, {
    question: "Qual é o maior órgão do corpo humano?",
    answer: "pele"
  }, {
    question: "Qual é a função dos rins?",
    answer: "filtrar sangue"
  }, {
    question: "Quantas câmaras tem o coração?",
    answer: "4"
  }];
  const winningLines = [[0, 1, 2], [3, 4, 5], [6, 7, 8],
  // Horizontais
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  // Verticais
  [0, 4, 8], [2, 4, 6] // Diagonais
  ];
  const generateQuestion = () => {
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    setCurrentQuestion(randomQuestion.question);
    setCorrectAnswer(randomQuestion.answer.toLowerCase());
  };
  const checkWinner = (currentBoard: Board): Player | 'tie' => {
    for (const line of winningLines) {
      const [a, b, c] = line;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return currentBoard[a];
      }
    }
    if (currentBoard.every(cell => cell !== null)) {
      return 'tie';
    }
    return null;
  };
  const handleCellClick = (index: number) => {
    if (board[index] || winner || gamePhase !== 'playing') return;
    setSelectedCell(index);
    setGamePhase('question');
    generateQuestion();
  };
  const checkAnswer = () => {
    const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer;
    if (isCorrect && selectedCell !== null) {
      const newBoard = [...board];
      newBoard[selectedCell] = currentPlayer;
      setBoard(newBoard);
      const gameResult = checkWinner(newBoard);
      if (gameResult) {
        setWinner(gameResult);
        if (gameResult === 'X') {
          setScore(prev => ({
            ...prev,
            player: prev.player + 1
          }));
        }
        setGamePhase('gameover');
      } else {
        setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
        setGamePhase('playing');

        // Bot move
        if (currentPlayer === 'X') {
          setTimeout(() => botMove(newBoard), 1000);
        }
      }
    } else {
      // Resposta incorreta, bot joga
      setTimeout(() => botMove(board), 500);
    }
    setUserAnswer('');
    setSelectedCell(null);
  };
  const botMove = (currentBoard: Board) => {
    const availableCells = currentBoard.map((cell, index) => cell === null ? index : null).filter(val => val !== null) as number[];
    if (availableCells.length > 0) {
      const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
      const newBoard = [...currentBoard];
      newBoard[randomCell] = 'O';
      setBoard(newBoard);
      const gameResult = checkWinner(newBoard);
      if (gameResult) {
        setWinner(gameResult);
        if (gameResult === 'O') {
          setScore(prev => ({
            ...prev,
            bot: prev.bot + 1
          }));
        }
        setGamePhase('gameover');
      } else {
        setCurrentPlayer('X');
        setGamePhase('playing');
      }
    }
  };
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setGamePhase('playing');
    setSelectedCell(null);
    setUserAnswer('');
  };
  useEffect(() => {
    resetGame();
  }, []);
  if (gamePhase === 'gameover') {
    return <div className="min-h-screen py-6">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Jogo Finalizado!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-slate-50 text-3xl">
                {winner === 'X' ? '🎉' : winner === 'O' ? '🤖' : '🤝'}
              </div>
              <p className="text-xl">
                {winner === 'X' ? 'Você venceu!' : winner === 'O' ? 'Medvoa Bot venceu!' : 'Empate!'}
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-green-200 border border-emerald-300">
                  <div className="text-2xl font-bold text-emerald-800">{score.player}</div>
                  <div className="text-sm text-emerald-700">Jogador</div>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-100 to-rose-200 border border-red-300">
                  <div className="text-2xl font-bold text-red-800">{score.bot}</div>
                  <div className="text-sm text-red-700">Medvoa Bot</div>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <Button onClick={resetGame} className="btn-glow">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Jogar Novamente
                </Button>
                <Button onClick={onBack} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="glass-card border border-border/50 bg-card/80">
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">🧠</div>
                <h3 className="font-bold text-foreground mb-1">Raciocínio Clínico</h3>
                <p className="text-xs text-muted-foreground">
                  Exercite seu conhecimento médico através da estratégia.
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card border border-border/50 bg-card/80">
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="font-bold text-foreground mb-1">Agilidade Mental</h3>
                <p className="text-xs text-muted-foreground">
                  Respostas rápidas fortalecem a memória médica.
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card border border-border/50 bg-card/80">
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-bold text-foreground mb-1">Precisão Diagnóstica</h3>
                <p className="text-xs text-muted-foreground">
                  Cada resposta correta aprimora seu julgamento clínico.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>;
  }
  if (gamePhase === 'question') {
    return <div className="min-h-screen py-6">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Responda para marcar sua posição!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg">{currentQuestion}</p>
              <Input value={userAnswer} onChange={e => setUserAnswer(e.target.value)} placeholder="Digite sua resposta..." onKeyDown={e => e.key === 'Enter' && checkAnswer()} />
              <div className="flex gap-4">
                <Button onClick={checkAnswer} className="btn-glow">
                  Confirmar
                </Button>
                <Button onClick={() => setGamePhase('playing')} variant="outline">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>;
  }
  return <div className="min-h-screen py-6">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Jogo da Velha do Saber</CardTitle>
            <Button onClick={onBack} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 flex flex-col items-center">
            <div className="flex justify-center gap-4 max-w-md mx-auto">
              <div className="glass-card p-2 rounded-xl border-2 border-emerald-200 bg-card/40 backdrop-blur-sm min-w-[120px] shadow-lg">
                <p className="text-sm font-bold text-emerald-800">Jogador: {score.player}</p>
              </div>
              <div className="glass-card p-2 rounded-xl border-2 border-red-200 bg-card/40 backdrop-blur-sm min-w-[120px] shadow-lg">
                <p className="text-sm font-bold text-red-800">Medvoa Bot: {score.bot}</p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Vez do: {currentPlayer === 'X' ? 'Jogador (X)' : 'Medvoa Bot (O)'}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {board.map((cell, index) => <button key={index} onClick={() => handleCellClick(index)} disabled={cell !== null || currentPlayer === 'O'} className="w-20 h-20 border-2 border-gray-300 rounded-lg text-2xl font-bold
                           hover:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center
                           transition-colors duration-200">
                  {cell}
                </button>)}
            </div>
            
            <div className="text-center">
              <Button onClick={resetGame} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reiniciar
              </Button>
            </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card mt-4">
            <CardContent className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Dica:</strong> Responda corretamente às perguntas médicas para marcar sua posição no tabuleiro!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>;
};