
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

interface Flashcard {
  id: number;
  question: string;
  answer: string;
  difficulty: string;
}

interface FlashcardFormProps {
  question: string;
  answer: string;
  onQuestionChange: (value: string) => void;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  editingCard?: Flashcard | null;
}

export const FlashcardForm = ({
  question,
  answer,
  onQuestionChange,
  onAnswerChange,
  onSubmit,
  onCancel,
  editingCard
}: FlashcardFormProps) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-white/80 mb-2 block">
          Pergunta
        </label>
        <Textarea
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder="Digite sua pergunta..."
          className="input-glass text-white placeholder:text-white/50"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-white/80 mb-2 block">
          Resposta
        </label>
        <Textarea
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Digite a resposta..."
          className="input-glass text-white placeholder:text-white/50 min-h-[100px]"
        />
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={onSubmit}
          className="flex-1 btn-glow text-white font-medium"
          disabled={!question.trim() || !answer.trim()}
        >
          <Plus className="w-4 h-4 mr-2" />
          {editingCard ? "Salvar Alterações" : "Adicionar Flashcard"}
        </Button>
        {editingCard && onCancel && (
          <Button 
            variant="outline"
            onClick={onCancel}
            className="btn-glass text-white border-primary/30 hover:border-primary/50"
          >
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
};
