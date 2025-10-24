
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gamepad2, Plus, Users, Play, Clock, Trophy, Upload, FileText } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GameHubProps {
  user: User;
}

interface GameSession {
  id: string;
  game_type: string;
  content_type: string;
  content: string;
  status: string;
  max_players: number;
  created_at: string;
  participant_count?: number;
  creator?: {
    username: string;
  };
}

export const GameHub = ({ user }: GameHubProps) => {
  const [games, setGames] = useState<GameSession[]>([]);
  const [myGames, setMyGames] = useState<GameSession[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [gameType, setGameType] = useState("");
  const [contentType, setContentType] = useState("");
  const [content, setContent] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [maxPlayers, setMaxPlayers] = useState("2");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const gameTypes = [
    { value: "quiz_normal", label: "Quiz Clássico" },
    { value: "forca", label: "Forca Médica" },
    { value: "jogo_da_velha", label: "Jogo da Velha" },
    { value: "jogo_da_memoria", label: "Jogo da Memória" }
  ];

  useEffect(() => {
    loadGames();
    loadMyGames();
  }, [user.id]);

  const loadGames = async () => {
    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .select(`
          id,
          game_type,
          content_type,
          content,
          status,
          max_players,
          created_at,
          created_by,
          profiles:created_by(username),
          game_participants(count)
        `)
        .eq("status", "waiting")
        .neq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const gamesWithCounts = data?.map(game => ({
        ...game,
        participant_count: game.game_participants?.[0]?.count || 0,
        creator: game.profiles
      })) || [];

      setGames(gamesWithCounts);
    } catch (error) {
      console.error("Erro ao carregar jogos:", error);
    }
  };

  const loadMyGames = async () => {
    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .select(`
          id,
          game_type,
          content_type,
          content,
          status,
          max_players,
          created_at,
          game_participants(count)
        `)
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const myGamesWithCounts = data?.map(game => ({
        ...game,
        participant_count: game.game_participants?.[0]?.count || 0
      })) || [];

      setMyGames(myGamesWithCounts);
    } catch (error) {
      console.error("Erro ao carregar meus jogos:", error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      toast({
        title: "PDF carregado!",
        description: `Arquivo ${file.name} selecionado com sucesso.`,
      });
    } else {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo PDF válido.",
        variant: "destructive",
      });
    }
  };

  const createGame = async () => {
    if (!gameType || !contentType) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de jogo e tipo de conteúdo.",
        variant: "destructive",
      });
      return;
    }

    if (contentType === "text" && !content.trim()) {
      toast({
        title: "Erro", 
        description: "Adicione o conteúdo de texto.",
        variant: "destructive",
      });
      return;
    }

    if (contentType === "pdf" && !pdfFile) {
      toast({
        title: "Erro",
        description: "Faça upload de um arquivo PDF.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let finalContent = content;
      
      // Se for PDF, simular extração de texto
      if (contentType === "pdf" && pdfFile) {
        finalContent = `Conteúdo extraído do PDF: ${pdfFile.name}. [Simulação: Em uma implementação real, o texto seria extraído do PDF aqui]`;
      }

      // Simular geração de perguntas baseadas no conteúdo
      const mockQuestions = [
        {
          question: "Pergunta baseada no conteúdo fornecido?",
          options: ["Opção A", "Opção B", "Opção C", "Opção D"],
          correct: 0
        }
      ];

      const { data: game, error } = await supabase
        .from("game_sessions")
        .insert({
          created_by: user.id,
          game_type: gameType,
          content_type: contentType,
          content: finalContent,
          questions: mockQuestions,
          max_players: parseInt(maxPlayers),
          status: "waiting"
        })
        .select()
        .single();

      if (error) throw error;

      // Adicionar o criador como participante
      const { error: participantError } = await supabase
        .from("game_participants")
        .insert({
          game_id: game.id,
          user_id: user.id
        });

      if (participantError) throw participantError;

      toast({
        title: "Jogo criado!",
        description: "Seu jogo foi criado e está aguardando outros jogadores",
      });

      setGameType("");
      setContentType("");
      setContent("");
      setPdfFile(null);
      setMaxPlayers("2");
      setShowCreateDialog(false);
      loadGames();
      loadMyGames();
    } catch (error) {
      console.error("Erro ao criar jogo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o jogo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async (gameId: string) => {
    try {
      const { error } = await supabase
        .from("game_participants")
        .insert({
          game_id: gameId,
          user_id: user.id
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Aviso",
            description: "Você já está participando deste jogo",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Você entrou no jogo! Aguarde o início da partida.",
      });

      loadGames();
    } catch (error) {
      console.error("Erro ao entrar no jogo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível entrar no jogo",
        variant: "destructive",
      });
    }
  };

  const getGameTypeLabel = (type: string) => {
    return gameTypes.find(gt => gt.value === type)?.label || type;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      waiting: { label: "Aguardando", className: "bg-yellow-50 text-yellow-700" },
      active: { label: "Em Andamento", className: "bg-green-50 text-green-700" },
      finished: { label: "Finalizado", className: "bg-gray-50 text-gray-700" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.waiting;
    
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Criar Jogo */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Criar Jogo de Estudo</span>
            </CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Jogo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Jogo de Estudo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Tipo de Jogo</Label>
                      <Select value={gameType} onValueChange={setGameType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha o tipo de jogo" />
                        </SelectTrigger>
                        <SelectContent>
                          {gameTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Tipo de Conteúdo</Label>
                      <Select value={contentType} onValueChange={setContentType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo de conteúdo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texto</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {contentType === "text" && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Conteúdo de Estudo</Label>
                      <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Cole o conteúdo ou material de estudo aqui..."
                        className="min-h-[120px]"
                      />
                    </div>
                  )}

                  {contentType === "pdf" && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Upload de PDF</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          {pdfFile ? `Arquivo selecionado: ${pdfFile.name}` : 'Clique para selecionar um arquivo PDF'}
                        </p>
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="pdf-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('pdf-upload')?.click()}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Selecionar PDF
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Máximo de Jogadores</Label>
                    <Select value={maxPlayers} onValueChange={setMaxPlayers}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 jogadores</SelectItem>
                        <SelectItem value="3">3 jogadores</SelectItem>
                        <SelectItem value="4">4 jogadores</SelectItem>
                        <SelectItem value="6">6 jogadores</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button onClick={createGame} disabled={loading} className="w-full">
                    {loading ? "Criando..." : "Criar Jogo"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Meus Jogos */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Meus Jogos ({myGames.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {myGames.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Você ainda não criou nenhum jogo
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myGames.map((game) => (
                <div key={game.id} className="p-4 bg-white rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{getGameTypeLabel(game.game_type)}</h3>
                      <p className="text-sm text-gray-600">
                        {game.participant_count}/{game.max_players} jogadores
                      </p>
                    </div>
                    {getStatusBadge(game.status)}
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    {game.content.substring(0, 100)}...
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(game.created_at).toLocaleDateString()}</span>
                    </div>
                    <Button size="sm" disabled={game.status !== "waiting"}>
                      <Play className="w-4 h-4 mr-2" />
                      {game.status === "waiting" ? "Iniciar" : "Ver"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Jogos Disponíveis */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Jogos Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          {games.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhum jogo disponível no momento
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {games.map((game) => (
                <div key={game.id} className="p-4 bg-white rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{getGameTypeLabel(game.game_type)}</h3>
                      <p className="text-sm text-gray-600">
                        por @{game.creator?.username}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(game.status)}
                      <p className="text-sm text-gray-600 mt-1">
                        {game.participant_count}/{game.max_players} jogadores
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    {game.content.substring(0, 100)}...
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(game.created_at).toLocaleDateString()}</span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => joinGame(game.id)}
                      disabled={game.participant_count >= game.max_players}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {game.participant_count >= game.max_players ? "Lotado" : "Entrar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
