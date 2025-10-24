
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Deck {
  id: number;
  name: string;
  subject: string;
  flashcards: any[];
  createdAt: string;
}

interface DeckCardProps {
  deck: Deck;
  onClick: () => void;
  isSelected?: boolean;
}

export const DeckCard = ({ deck, onClick, isSelected = false }: DeckCardProps) => {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 futuristic-card ${
        isSelected 
          ? 'border-primary/60 bg-primary/10 scale-[1.02]' 
          : 'border-primary/20 hover:border-primary/40'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <h4 className="font-semibold text-white">{deck.name}</h4>
          <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 rounded-xl">
            {deck.subject}
          </Badge>
          <p className="text-sm text-white/70">
            {deck.flashcards.length} flashcards
          </p>
          <p className="text-xs text-white/50">
            Criado em {new Date(deck.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
