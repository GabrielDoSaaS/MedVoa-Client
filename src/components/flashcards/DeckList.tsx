
import { DeckCard } from "./DeckCard";

interface Deck {
  id: number;
  name: string;
  subject: string;
  flashcards: any[];
  createdAt: string;
}

interface DeckListProps {
  decks: Deck[];
  onSelectDeck: (deck: Deck) => void;
  selectedDeck?: Deck | null;
  title: string;
}

export const DeckList = ({ decks, onSelectDeck, selectedDeck, title }: DeckListProps) => {
  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {decks.map((deck) => (
          <DeckCard
            key={deck.id}
            deck={deck}
            onClick={() => onSelectDeck(deck)}
            isSelected={selectedDeck?.id === deck.id}
          />
        ))}
      </div>
    </div>
  );
};
