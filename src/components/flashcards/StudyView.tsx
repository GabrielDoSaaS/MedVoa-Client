
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Shuffle, ArrowLeft, FileText } from "lucide-react";

interface Flashcard {
  id: number;
  question: string;
  answer: string;
  difficulty: string;
}

interface Deck {
  id: number;
  name: string;
  subject: string;
  flashcards: Flashcard[];
  createdAt: string;
}

interface StudyViewProps {
  deck: Deck;
  onBack: () => void;
  onUpdateMetrics: (cardId: number, isCorrect: boolean) => void;
}

export const StudyView = ({ deck, onBack, onUpdateMetrics }: StudyViewProps) => {
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleNextCard = () => {
    setCurrentCard((prev) => (prev + 1) % deck.flashcards.length);
    setShowAnswer(false);
  };

  const handlePrevCard = () => {
    setCurrentCard((prev) => (prev - 1 + deck.flashcards.length) % deck.flashcards.length);
    setShowAnswer(false);
  };

  const shuffleCards = () => {
    setCurrentCard(Math.floor(Math.random() * deck.flashcards.length));
    setShowAnswer(false);
  };

  const handleMetricUpdate = (isCorrect: boolean) => {
    onUpdateMetrics(deck.flashcards[currentCard].id, isCorrect);
    handleNextCard();
  };

  if (deck.flashcards.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack} className="btn-glass text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Decks
          </Button>
          <div>
            <h3 className="text-lg font-semibold text-white">{deck.name}</h3>
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
              {deck.subject}
            </Badge>
          </div>
        </div>
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-white/60 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Deck Vazio</h3>
            <p className="text-white/70">Este deck ainda não possui flashcards. Vá para a aba "Criar" para adicionar alguns.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack} className="bg-primary/20 hover:bg-primary/30 text-white border-primary/30">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos Decks
        </Button>
        <div>
          <h3 className="text-lg font-semibold text-white">{deck.name}</h3>
          <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
            {deck.subject}
          </Badge>
        </div>
      </div>

      <Card className="glass-card min-h-[400px]">
        <CardContent className="p-8">
          <div className="flex justify-between items-center mb-6">
            <Badge className="bg-primary/20 text-primary border-primary/30">
              {currentCard + 1} / {deck.flashcards.length}
            </Badge>
          </div>

          <div className="text-center space-y-6">
            <div className="min-h-[200px] flex items-center justify-center">
              {!showAnswer ? (
                <div>
                  <h3 className="text-lg font-medium text-white/80 mb-4">Pergunta:</h3>
                  <p className="text-xl font-semibold text-white">
                    {deck.flashcards[currentCard]?.question}
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium text-white/80 mb-4">Resposta:</h3>
                  <p className="text-lg text-white leading-relaxed">
                    {deck.flashcards[currentCard]?.answer}
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={() => setShowAnswer(!showAnswer)}
              className="btn-glow text-white"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {showAnswer ? "Ver Pergunta" : "Ver Resposta"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center space-x-4">
        <Button variant="outline" onClick={handlePrevCard} className="bg-primary/20 hover:bg-primary/30 text-white border-primary/30">
          Anterior
        </Button>
        <Button variant="outline" onClick={shuffleCards} className="bg-primary/20 hover:bg-primary/30 text-white border-primary/30">
          <Shuffle className="w-4 h-4 mr-2" />
          Embaralhar
        </Button>
        <Button variant="outline" onClick={handleNextCard} className="bg-primary/20 hover:bg-primary/30 text-white border-primary/30">
          Próximo
        </Button>
      </div>

      {showAnswer && (
        <Card className="glass-card max-w-md mx-auto">
          <CardContent className="p-3">
            <p className="text-center text-white mb-3 text-sm">Como foi essa pergunta?</p>
            <div className="flex justify-center space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-destructive/30 hover:bg-destructive/40 text-white border-destructive/40 backdrop-blur-sm"
                onClick={() => handleMetricUpdate(false)}
              >
                Errei
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-green-500/30 hover:bg-green-500/40 text-white border-green-500/40 backdrop-blur-sm"
                onClick={() => handleMetricUpdate(true)}
              >
                Acertei
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
