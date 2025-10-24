import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";

interface MemoryGameProps {
  onBack: () => void;
  studyContent: string;
}

interface MemoryCard {
  id: number;
  content: string;
  type: 'term' | 'definition';
  pairId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryGame = ({ onBack, studyContent }: MemoryGameProps) => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const medicalPairs = [
    { term: "Hipertensão", definition: "Pressão arterial elevada" },
    { term: "Taquicardia", definition: "Batimentos cardíacos acelerados" },
    { term: "Anemia", definition: "Deficiência de glóbulos vermelhos" },
    { term: "Diabetes", definition: "Níveis elevados de glucose no sangue" },
    { term: "Pneumonia", definition: "Infecção pulmonar" },
    { term: "Artrite", definition: "Inflamação das articulações" },
    { term: "Cefaleia", definition: "Dor de cabeça" },
    { term: "Dispneia", definition: "Dificuldade para respirar" },
    { term: "Bradicardia", definition: "Batimentos cardíacos lentos" },
    { term: "Hipotensão", definition: "Pressão arterial baixa" },
    { term: "Febre", definition: "Elevação da temperatura corporal" },
    { term: "Edema", definition: "Acúmulo de líquido nos tecidos" },
    { term: "Cianose", definition: "Coloração azulada da pele" },
    { term: "Icterícia", definition: "Coloração amarelada da pele" },
    { term: "Hematoma", definition: "Acúmulo de sangue nos tecidos" },
    { term: "Epistaxe", definition: "Sangramento nasal" }
  ];

  const getDifficultyConfig = () => {
    // Extract difficulty from studyContent
    const difficultyMatch = studyContent.match(/\[Dificuldade:\s*(Fácil|Médio|Difícil)\]/i);
    const difficulty = difficultyMatch ? difficultyMatch[1] : 'Fácil';
    
    switch (difficulty) {
      case 'Médio':
        return { pairs: 12, cols: 6, rows: 4 }; // 6x4
      case 'Difícil':
        return { pairs: 16, cols: 8, rows: 4 }; // 8x4
      default:
        return { pairs: 8, cols: 4, rows: 4 }; // 4x4
    }
  };

  const initializeCards = () => {
    const config = getDifficultyConfig();
    const gameCards: MemoryCard[] = [];
    let cardId = 0;

    // Select only the required number of pairs
    const selectedPairs = medicalPairs.slice(0, config.pairs);

    selectedPairs.forEach((pair, pairIndex) => {
      gameCards.push({
        id: cardId++,
        content: pair.term,
        type: 'term',
        pairId: pairIndex,
        isFlipped: false,
        isMatched: false
      });
      
      gameCards.push({
        id: cardId++,
        content: pair.definition,
        type: 'definition',
        pairId: pairIndex,
        isFlipped: false,
        isMatched: false
      });
    });

    // Shuffle cards
    const shuffled = gameCards.sort(() => Math.random() - 0.5);
    setCards(shuffled);
  };

  const handleCardClick = (cardId: number) => {
    if (flippedCards.length >= 2) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      checkMatch(newFlippedCards);
    }
  };

  const checkMatch = (flippedCardIds: number[]) => {
    const [firstId, secondId] = flippedCardIds;
    const firstCard = cards.find(c => c.id === firstId);
    const secondCard = cards.find(c => c.id === secondId);

    if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
      // Match found
      setScore(prev => prev + 10);
      setCards(prev => prev.map(c => 
        c.id === firstId || c.id === secondId 
          ? { ...c, isMatched: true }
          : c
      ));
      setFlippedCards([]);
      
      // Check if game is complete
      const updatedCards = cards.map(c => 
        c.id === firstId || c.id === secondId 
          ? { ...c, isMatched: true }
          : c
      );
      
      if (updatedCards.every(c => c.isMatched)) {
        setGameComplete(true);
      }
    } else {
      // No match, flip back after delay
      setTimeout(() => {
        setCards(prev => prev.map(c => 
          c.id === firstId || c.id === secondId 
            ? { ...c, isFlipped: false }
            : c
        ));
        setFlippedCards([]);
      }, 1500);
    }
  };

  const resetGame = () => {
    setScore(0);
    setMoves(0);
    setFlippedCards([]);
    setGameComplete(false);
    setTimeElapsed(0);
    initializeCards();
  };

  useEffect(() => {
    initializeCards();
  }, []);

  useEffect(() => {
    if (!gameComplete) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [gameComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCongratulationMessage = () => {
    const config = getDifficultyConfig();
    const efficiency = Math.max(1, Math.round((config.pairs / moves) * 100));
    
    if (config.pairs === 8) {
      return {
        title: "Excelente Memória! 🧠",
        message: `Você dominou os conceitos básicos com ${efficiency}% de eficiência! Sua base médica está sólida.`
      };
    } else if (config.pairs === 12) {
      return {
        title: "Memória Clínica Avançada! 🩺",
        message: `Impressionante! Você conectou ${config.pairs} conceitos médicos com ${efficiency}% de precisão. Futuro médico promissor!`
      };
    } else {
      return {
        title: "Mestre da Medicina! 👨‍⚕️",
        message: `Extraordinário! Você demonstrou excelência médica conectando ${config.pairs} termos complexos com ${efficiency}% de eficiência. Parabéns, doutor!`
      };
    }
  };

  if (gameComplete) {
    const congratsData = getCongratulationMessage();
    const config = getDifficultyConfig();
    
    return (
      <div className="min-h-screen py-6 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="w-full max-w-4xl mx-auto px-4 space-y-6">
          <Card className="glass-card shadow-2xl border-2 border-primary/20">
            <CardHeader className="text-center pb-2">
              <div className="text-8xl mb-4 animate-bounce">🎉</div>
              <CardTitle className="text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {congratsData.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
                {congratsData.message}
              </p>
              
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-100 to-green-200 border border-emerald-300">
                  <div className="text-2xl font-bold text-emerald-800">{score}</div>
                  <div className="text-sm text-emerald-700">Pontos</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200 border border-blue-300">
                  <div className="text-2xl font-bold text-blue-800">{moves}</div>
                  <div className="text-sm text-blue-700">Movimentos</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-100 to-violet-200 border border-purple-300">
                  <div className="text-2xl font-bold text-purple-800">{formatTime(timeElapsed)}</div>
                  <div className="text-sm text-purple-700">Tempo</div>
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
            <Card className="glass-card border border-green-200 bg-green-50/50">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">🧠</div>
                <h3 className="font-bold text-green-800 mb-2">Memória Clínica</h3>
                <p className="text-sm text-green-700">
                  Você exercitou {config.pairs} conexões neurais importantes para a medicina!
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card border border-blue-200 bg-blue-50/50">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-bold text-blue-800 mb-2">Precisão Diagnóstica</h3>
                <p className="text-sm text-blue-700">
                  Desenvolveu habilidades de associação essenciais para diagnósticos precisos.
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card border border-purple-200 bg-purple-50/50">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">⚡</div>
                <h3 className="font-bold text-purple-800 mb-2">Rapidez Mental</h3>
                <p className="text-sm text-purple-700">
                  Treinou a velocidade de processamento necessária em emergências médicas.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card className="glass-card border border-amber-200 bg-amber-50/50">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">📚</div>
              <h3 className="font-bold text-amber-800 mb-3">Dica de Estudo Avançada</h3>
              <p className="text-sm text-amber-700 leading-relaxed mb-4">
                A repetição espaçada melhora a retenção da memória em até 400%. Continue praticando esses termos médicos regularmente!
              </p>
              <div className="bg-amber-100 rounded-lg p-4 border border-amber-300">
                <p className="text-xs text-amber-800 font-medium">
                  💡 <strong>Próximo passo:</strong> Tente o nível {config.pairs === 8 ? 'Médio' : config.pairs === 12 ? 'Difícil' : 'Expert'} para um desafio maior!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6">
      <div className={`mx-auto px-4 ${
        getDifficultyConfig().cols === 4 ? 'max-w-4xl' : 
        getDifficultyConfig().cols === 6 ? 'max-w-5xl' : 
        'max-w-7xl'
      }`}>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Memória Clínica</CardTitle>
            <Button onClick={onBack} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-6 text-center">
              <div className="glass-card p-4 py-3 rounded-xl border-2 border-green-200 bg-card/40 backdrop-blur-sm min-w-[120px] shadow-lg hover:shadow-xl transition-all duration-200">
                <p className="text-sm font-semibold text-green-700 mb-2">Pontuação</p>
                <p className="text-2xl font-bold text-green-800">{score}</p>
              </div>
              <div className="glass-card p-4 py-3 rounded-xl border-2 border-blue-200 bg-card/40 backdrop-blur-sm min-w-[120px] shadow-lg hover:shadow-xl transition-all duration-200">
                <p className="text-sm font-semibold text-blue-700 mb-2">Movimentos</p>
                <p className="text-2xl font-bold text-blue-800">{moves}</p>
              </div>
              <div className="glass-card p-4 py-3 rounded-xl border-2 border-purple-200 bg-card/40 backdrop-blur-sm min-w-[120px] shadow-lg hover:shadow-xl transition-all duration-200">
                <p className="text-sm font-semibold text-purple-700 mb-2">Tempo</p>
                <p className="text-2xl font-bold text-purple-800">{formatTime(timeElapsed)}</p>
              </div>
            </div>
            
            <div 
              className={`grid gap-3 mx-auto ${
                getDifficultyConfig().cols === 4 ? 'max-w-2xl' : 
                getDifficultyConfig().cols === 6 ? 'max-w-4xl' : 
                'max-w-6xl'
              }`}
              style={{ gridTemplateColumns: `repeat(${getDifficultyConfig().cols}, 1fr)` }}
            >
              {cards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`
                    relative w-full aspect-square rounded-xl cursor-pointer transition-all duration-500 transform hover:scale-105
                    ${card.isMatched 
                      ? 'bg-gradient-to-br from-emerald-100 to-green-200 border-2 border-emerald-400 shadow-lg shadow-emerald-200' 
                      : card.isFlipped 
                        ? 'bg-gradient-to-br from-blue-100 to-indigo-200 border-2 border-blue-400 shadow-lg shadow-blue-200' 
                        : 'bg-gradient-to-br from-slate-100 to-gray-200 border-2 border-gray-300 hover:border-primary shadow-md hover:shadow-lg'
                    }
                  `}
                >
                  <div className="absolute inset-0 flex items-center justify-center p-2 rounded-xl">
                    {card.isFlipped || card.isMatched ? (
                      <div className="text-center space-y-1">
                        <div className={`text-xs font-bold uppercase tracking-wider px-1 py-1 rounded-full ${
                          card.type === 'term' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-emerald-500 text-white'
                        }`}>
                          {card.type === 'term' ? 'TERMO' : 'DEF'}
                        </div>
                        <div className={`font-semibold leading-tight text-gray-800 ${
                          getDifficultyConfig().cols === 8 ? 'text-xs' : 'text-sm'
                        }`}>
                          {card.content}
                        </div>
                      </div>
                    ) : (
                      <div className={`opacity-60 ${
                        getDifficultyConfig().cols === 8 ? 'text-xl' : 'text-2xl'
                      }`}>🧠</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <Button onClick={resetGame} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reiniciar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};