import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Type } from "lucide-react";

interface GameSetupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (content: string) => void;
  gameTitle: string;
}

export const GameSetupDialog = ({ isOpen, onClose, onStart, gameTitle }: GameSetupDialogProps) => {
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState("medium");

  const handleStart = () => {
    const difficultyText = difficulty === "easy" ? "Fácil" : difficulty === "medium" ? "Médio" : "Difícil";
    if (textContent.trim()) {
      onStart(`[Dificuldade: ${difficultyText}] ${textContent}`);
    } else if (file) {
      // For simplicity, we'll use the filename as content for now
      // In a real implementation, you'd read the file content
      onStart(`[Dificuldade: ${difficultyText}] Conteúdo do arquivo: ${file.name}`);
    }
  };

  const isValid = textContent.trim() || file;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-primary/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="gradient-text text-xl">{gameTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-foreground/70">
            Para começar, forneça o conteúdo de estudo:
          </p>
          
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text" className="flex items-center space-x-2">
                <Type className="w-4 h-4" />
                <span>Texto</span>
              </TabsTrigger>
              <TabsTrigger value="file" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Arquivo</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="space-y-3">
              <Label htmlFor="content">Digite o conteúdo da matéria:</Label>
              <Textarea
                id="content"
                placeholder="Ex: A mitocôndria é responsável pela produção de energia na célula..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="min-h-[100px] glass-input"
              />
            </TabsContent>
            
            <TabsContent value="file" className="space-y-3">
              <Label htmlFor="file">Selecione um arquivo:</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="glass-input"
              />
              {file && (
                <p className="text-sm text-foreground/70">
                  Arquivo selecionado: {file.name}
                </p>
              )}
            </TabsContent>
          </Tabs>
          
          <div className="space-y-3">
            <Label htmlFor="difficulty">Nível de dificuldade:</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="Selecione a dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Fácil</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="hard">Difícil</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStart}
              disabled={!isValid}
              className="flex-1 btn-primary"
            >
              Começar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};