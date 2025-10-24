
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ArrowLeft, Edit, Trash2, FileText } from "lucide-react";
import { FlashcardForm } from "./FlashcardForm";
import { DeckList } from "./DeckList";

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

interface CreateViewProps {
  selectedDeck: Deck | null;
  onSelectDeck: (deck: Deck | null) => void;
  decks: Deck[];
  newDeckName: string;
  setNewDeckName: (name: string) => void;
  newDeckSubject: string;
  setNewDeckSubject: (subject: string) => void;
  onCreateDeck: () => void;
  newCardQuestion: string;
  setNewCardQuestion: (question: string) => void;
  newCardAnswer: string;
  setNewCardAnswer: (answer: string) => void;
  onAddCard: () => void;
  editingCard: Flashcard | null;
  onEditCard: (card: Flashcard) => void;
  onSaveEditCard: () => void;
  onCancelEdit: () => void;
  onDeleteCard: (cardId: number) => void;
}

export const CreateView = ({
  selectedDeck,
  onSelectDeck,
  decks,
  newDeckName,
  setNewDeckName,
  newDeckSubject,
  setNewDeckSubject,
  onCreateDeck,
  newCardQuestion,
  setNewCardQuestion,
  newCardAnswer,
  setNewCardAnswer,
  onAddCard,
  editingCard,
  onEditCard,
  onSaveEditCard,
  onCancelEdit,
  onDeleteCard
}: CreateViewProps) => {
  if (!selectedDeck) {
    return (
      <div className="space-y-6">
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <span>Criar Novo Deck</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">
                Nome do Deck
              </label>
              <Input
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                placeholder="Ex: Cardiologia Básica"
                className="input-glass text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">
                Matéria/Assunto
              </label>
              <Input
                value={newDeckSubject}
                onChange={(e) => setNewDeckSubject(e.target.value)}
                placeholder="Ex: Cardiologia"
                className="input-glass text-white placeholder:text-white/50"
              />
            </div>
            <Button 
              onClick={onCreateDeck}
              className="w-full btn-glow text-white font-medium"
              disabled={!newDeckName.trim() || !newDeckSubject.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Deck
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-white">Decks Existentes</CardTitle>
          </CardHeader>
          <CardContent>
            <DeckList
              decks={decks}
              onSelectDeck={onSelectDeck}
              selectedDeck={selectedDeck}
              title=""
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          onClick={() => onSelectDeck(null)}
          className="btn-glass text-white border-primary/30 hover:border-primary/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Escolher Outro Deck
        </Button>
        <div>
          <h3 className="text-lg font-semibold text-white">Gerenciar: {selectedDeck.name}</h3>
        </div>
      </div>

      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <span>{editingCard ? "Editar Flashcard" : "Adicionar Flashcard"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FlashcardForm
            question={newCardQuestion}
            answer={newCardAnswer}
            onQuestionChange={setNewCardQuestion}
            onAnswerChange={setNewCardAnswer}
            onSubmit={editingCard ? onSaveEditCard : onAddCard}
            onCancel={editingCard ? onCancelEdit : undefined}
            editingCard={editingCard}
          />
        </CardContent>
      </Card>

      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-white">Flashcards no Deck ({selectedDeck.flashcards.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDeck.flashcards.length > 0 ? (
            <div className="space-y-3">
              {selectedDeck.flashcards.map((card) => (
                <div key={card.id} className="glass-card border-primary/10 p-4 hover:border-primary/30 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-white mb-2">{card.question}</p>
                      <p className="text-sm text-white/70">{card.answer}</p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditCard(card)}
                        className="btn-glass text-primary border-primary/30 hover:border-primary/50 hover:bg-primary/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeleteCard(card.id)}
                        className="btn-glass text-destructive border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-white/40 mx-auto mb-3" />
              <p className="text-white/60">Nenhum flashcard ainda. Adicione o primeiro acima!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
