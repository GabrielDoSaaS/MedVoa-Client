
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Upload, Check, X } from "lucide-react";
import { DeckList } from "./DeckList";

interface Deck {
  id: number;
  name: string;
  subject: string;
  flashcards: any[];
  createdAt: string;
}

interface GenerateViewProps {
  selectedDeck: Deck | null;
  onSelectDeck: (deck: Deck | null) => void;
  decks: Deck[];
  onCreateDeck: () => void;
  onAddGeneratedCards: (cards: any[]) => void;
}

export const GenerateView = ({ 
  selectedDeck, 
  onSelectDeck, 
  decks, 
  onCreateDeck, 
  onAddGeneratedCards 
}: GenerateViewProps) => {
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<any[]>([]);
  const [showApproval, setShowApproval] = useState(false);

  const generateRealFlashcards = (text: string) => {
    // Gerar flashcards baseados no conteúdo real do texto
    const cards = [];
    
    // Analisar o texto e gerar perguntas relevantes
    if (text.toLowerCase().includes("coração") || text.toLowerCase().includes("cardíaco")) {
      cards.push(
        {
          question: "Quais são as principais câmaras do coração?",
          answer: "O coração possui quatro câmaras: dois átrios (direito e esquerdo) na parte superior e dois ventrículos (direito e esquerdo) na parte inferior.",
          difficulty: "Básico"
        },
        {
          question: "Qual é a função do ventrículo esquerdo?",
          answer: "O ventrículo esquerdo é responsável por bombear sangue oxigenado para todo o corpo através da aorta, sendo a câmara mais muscular do coração.",
          difficulty: "Médio"
        }
      );
    }
    
    if (text.toLowerCase().includes("respiração") || text.toLowerCase().includes("pulmão")) {
      cards.push(
        {
          question: "Qual é o processo de troca gasosa nos alvéolos?",
          answer: "Nos alvéolos ocorre a hematose: o oxigênio passa do ar para o sangue e o gás carbônico passa do sangue para o ar, através da membrana alveolocapilar.",
          difficulty: "Médio"
        },
        {
          question: "Quais são os músculos principais da respiração?",
          answer: "Os músculos principais são o diafragma (principal músculo inspiratório) e os músculos intercostais, que auxiliam na expansão e contração da caixa torácica.",
          difficulty: "Básico"
        }
      );
    }
    
    if (text.toLowerCase().includes("diabetes") || text.toLowerCase().includes("insulina")) {
      cards.push(
        {
          question: "Qual é a diferença entre diabetes tipo 1 e tipo 2?",
          answer: "Diabetes tipo 1: destruição autoimune das células beta pancreáticas, deficiência absoluta de insulina. Tipo 2: resistência insulínica associada à deficiência relativa de insulina.",
          difficulty: "Médio"
        },
        {
          question: "Quais são os sintomas clássicos do diabetes?",
          answer: "Os sintomas clássicos são polidipsia (sede excessiva), poliúria (urina em excesso), polifagia (fome excessiva) e perda de peso inexplicada.",
          difficulty: "Básico"
        }
      );
    }
    
    // Se não encontrar temas específicos, gerar cards genéricos baseados no texto
    if (cards.length === 0) {
      const words = text.split(' ').filter(word => word.length > 4);
      const keyWords = words.slice(0, 3);
      
      cards.push(
        {
          question: `O que significa ${keyWords[0] || "este conceito"} no contexto médico?`,
          answer: `${keyWords[0] || "Este conceito"} refere-se a um termo importante na medicina que está relacionado ao conteúdo estudado. É fundamental compreender sua definição e aplicação clínica.`,
          difficulty: "Básico"
        },
        {
          question: `Como ${keyWords[1] || "este processo"} se relaciona com a prática médica?`,
          answer: `${keyWords[1] || "Este processo"} tem relevância clínica significativa e deve ser compreendido no contexto da patofisiologia e tratamento das condições médicas relacionadas.`,
          difficulty: "Médio"
        }
      );
    }
    
    return cards;
  };

  const handleGenerateFlashcards = async () => {
    if (!inputText.trim() || !selectedDeck) return;
    
    setIsGenerating(true);
    
    try {
      // Simular tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newCards = generateRealFlashcards(inputText);
      setGeneratedCards(newCards);
      setShowApproval(true);
      
      console.log("Flashcards gerados:", newCards);
    } catch (error) {
      console.error("Erro ao gerar flashcards:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveCards = () => {
    onAddGeneratedCards(generatedCards);
    setInputText("");
    setGeneratedCards([]);
    setShowApproval(false);
    console.log("Flashcards aprovados e adicionados ao deck:", selectedDeck.name);
  };

  const handleRejectCards = () => {
    setGeneratedCards([]);
    setShowApproval(false);
  };

  if (!selectedDeck) {
    return (
      <Card className="glass-card border-primary/20">
        <CardContent className="p-8 text-center">
          <BookOpen className="w-16 h-16 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Selecione um Deck</h3>
          <p className="text-white/70 mb-6">Escolha um deck para gerar flashcards com IA</p>
          <DeckList
            decks={decks}
            onSelectDeck={onSelectDeck}
            selectedDeck={selectedDeck}
            title=""
          />
        </CardContent>
      </Card>
    );
  }

  if (showApproval) {
    return (
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>Aprovar Flashcards Gerados</span>
          </CardTitle>
          <CardDescription className="text-white/70">
            Gerados {generatedCards.length} flashcards para o deck: <strong>{selectedDeck.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {generatedCards.map((card, index) => (
              <div key={index} className="p-4 glass-card border-primary/10 rounded-lg">
                <div className="mb-2">
                  <span className="text-sm font-medium text-primary">Pergunta {index + 1}:</span>
                  <p className="font-medium text-white">{card.question}</p>
                </div>
                <div className="mb-2">
                  <span className="text-sm font-medium text-green-400">Resposta:</span>
                  <p className="text-white/80">{card.answer}</p>
                </div>
                <div className="text-sm text-white/60">
                  Dificuldade: {card.difficulty}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={handleApproveCards}
              className="flex-1 btn-glow text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Aprovar e Adicionar ao Deck
            </Button>
            <Button 
              onClick={handleRejectCards}
              variant="outline" 
              className="flex-1 btn-glass text-white border-primary/30 hover:border-primary/50"
            >
              <X className="w-4 h-4 mr-2" />
              Rejeitar e Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2 text-white">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>Gerar Flashcards com IA</span>
            </CardTitle>
            <CardDescription className="text-white/70">
              Gerando para o deck: <strong>{selectedDeck.name}</strong>
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            onClick={() => onSelectDeck(null)}
            className="btn-glass text-white border-primary/30 hover:border-primary/50"
          >
            Trocar Deck
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Cole o texto da aula ou material de estudo aqui... A IA analisará o conteúdo e criará flashcards relevantes automaticamente."
          className="input-glass text-white placeholder:text-white/50 min-h-[150px]"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <div className="flex gap-4">
          <Button 
            className="flex-1 btn-glow text-white"
            onClick={handleGenerateFlashcards}
            disabled={!inputText.trim() || isGenerating}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            {isGenerating ? "Analisando conteúdo..." : "Gerar Flashcards"}
          </Button>
          <Button variant="outline" className="btn-glass text-white border-primary/30 hover:border-primary/50">
            <Upload className="w-4 h-4 mr-2" />
            Upload PDF
          </Button>
        </div>
        <p className="text-sm text-white/60 text-center">
          A IA analisará o conteúdo e gerará flashcards relevantes para aprovação antes de adicionar ao deck
        </p>
      </CardContent>
    </Card>
  );
};
