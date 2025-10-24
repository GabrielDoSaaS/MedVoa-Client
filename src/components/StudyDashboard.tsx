import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, Target, Award, Zap, FolderLock, Folder, FileText, Plus, Trash2, Home, Upload, ChevronRight, CornerDownLeft, AlertTriangle } from "lucide-react";
import { FaTiktok, FaInstagram, FaYoutube, FaTwitter } from "react-icons/fa";
import { User } from "@supabase/supabase-js";
// REMOVIDO: import { useStudyTime } from "@/hooks/useStudyTime";
import { PremiumCTA } from "@/components/ui/premium-cta";
// REMOVIDO: import { useSubscription } from "@/hooks/useSubscription"; // REMOVIDO
import axios from "axios"; 

// Componentes básicos de UI (simulados, devem ser importados do seu setup)
const Input = ({ placeholder, value, onChange, className }: any) => <input type="text" placeholder={placeholder} value={value} onChange={onChange} className={`p-2 border rounded-md w-full ${className}`} />;
const AlertDialog = ({ children, open, onOpenChange }: any) => (
    <div className={`fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 ${open ? 'block' : 'hidden'}`}>
        <div className="bg-card p-6 rounded-lg shadow-2xl max-w-sm w-full">
            {children}
            <div className="flex justify-end mt-4">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
            </div>
        </div>
    </div>
);
const AlertDialogTrigger = ({ children, onClick }: any) => <div onClick={onClick}>{children}</div>;
const AlertDialogContent = ({ children }: any) => <div>{children}</div>;
const AlertDialogHeader = ({ children }: any) => <div className="mb-4">{children}</div>;
const AlertDialogTitle = ({ children }: any) => <h3 className="text-lg font-bold">{children}</h3>;
const AlertDialogDescription = ({ children }: any) => <p className="text-sm text-muted-foreground">{children}</p>;
const AlertDialogFooter = ({ children }: any) => <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">{children}</div>; 

const API_BASE_URL = 'http://localhost:3000/api'; 

interface StudyDashboardProps {
  user: User | null;
  onUpgrade?: () => void;
  // ADIÇÃO: Recebe o tempo de estudo visível via props
  studyTime: number; 
  formattedTime: string;
  // NOVO PROP: Recebe o status Premium do componente pai (Index.tsx)
  isPremium: boolean;
}

// Interface estendida para o usuário retornado pela rota /get-users
interface BackendUser {
    name: string;
    insta: string;
    hours: number;
    email: string;
    prouves: number; 
}

// ----------------------------------------------------
// Interfaces para Gerenciador de Arquivos (Mantido)
// ----------------------------------------------------
interface FileSystemItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  parent_id: string;
  size: number; // Em bytes, 0 para pastas
  content?: FileSystemItem[]; // Conteúdo apenas para 'folder'
  created_at: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


// ----------------------------------------------------
// COMPONENTE: Gerenciador de Arquivos (Responsivo Corrigido)
// ----------------------------------------------------
interface FileManagerProps {
  userEmail: string;
}

const FileManager = ({ userEmail }: FileManagerProps) => {
    // ... (Lógica do FileManager mantida)
    const [fileStructure, setFileStructure] = useState<FileSystemItem[]>([]);
    const [currentPath, setCurrentPath] = useState<{ id: string, name: string }[]>([{ id: 'root', name: 'Início' }]);
    const [loading, setLoading] = useState(true);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [isUploadAlertOpen, setIsUploadAlertOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentFolderId = currentPath[currentPath.length - 1].id;
    
    const fetchFileStructure = useCallback(async () => {
        if (!userEmail) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/files/get-files`, {
                email: userEmail
            });
            setFileStructure(res.data);
        } catch (err) {
            console.error("Erro ao carregar estrutura de arquivos:", err);
        } finally {
            setLoading(false);
        }
    }, [userEmail]);

    useEffect(() => {
        fetchFileStructure();
    }, [fetchFileStructure]);

    const currentContent = useMemo(() => {
        return fileStructure
            .filter(item => item.parent_id === currentFolderId)
            .sort((a, b) => {
                if (a.type === 'folder' && b.type !== 'folder') return -1;
                if (a.type !== 'folder' && b.type === 'folder') return 1;
                return a.name.localeCompare(b.name); 
            });

    }, [fileStructure, currentFolderId]);
    
    const handleCreateFolder = async () => {
        if (!folderName) return;
        
        try {
            const res = await axios.post(`${API_BASE_URL}/files/create-folder`, { 
                folderName, 
                parentId: currentFolderId,
                email: userEmail 
            });
            setFileStructure(res.data.fileStructure);
            setFolderName('');
            setIsAlertOpen(false);
        } catch (error) {
            console.error("Falha ao criar pasta:", error);
            alert("Erro ao criar pasta. Verifique o console.");
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!window.confirm("Tem certeza que deseja deletar este item? Esta ação é irreversível.")) return;
        
        try {
            const res = await axios.post(`${API_BASE_URL}/files/delete-item`, { 
                itemId, 
                email: userEmail 
            });
            setFileStructure(res.data.fileStructure);
        } catch (error) {
            console.error("Falha ao deletar item:", error);
            alert("Erro ao deletar item. Verifique o console.");
        }
    };

    const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement> | null, file?: File) => {
        const uploadedFile = file || event?.target?.files?.[0];
        if (!uploadedFile) return;

        try {
            const res = await axios.post(`${API_BASE_URL}/files/upload-file`, { 
                fileName: uploadedFile.name,
                fileSize: uploadedFile.size,
                parentId: currentFolderId,
                email: userEmail 
            });
            setFileStructure(res.data.fileStructure);
            setIsUploadAlertOpen(false); 
            if (fileInputRef.current) fileInputRef.current.value = ""; 
        } catch (error) {
            console.error("Falha ao fazer upload do arquivo:", error);
            alert("Erro ao fazer upload do arquivo (simulado).");
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUploadFile(null, e.dataTransfer.files[0]);
        }
    };


    const navigateTo = (item: FileSystemItem | { id: string, name: string, type: 'folder' }) => {
        if (item.type === 'folder') {
            const newPathIndex = currentPath.findIndex(p => p.id === item.id);
            if (newPathIndex !== -1) {
                setCurrentPath(currentPath.slice(0, newPathIndex + 1));
            } else {
                setCurrentPath([...currentPath, { id: item.id, name: item.name }]);
            }
        }
    };

    const navigateUp = () => {
        if (currentPath.length > 1) {
            setCurrentPath(currentPath.slice(0, -1));
        }
    };

    const isRoot = currentPath.length === 1;

    return (
        <div 
            className="file-manager-container p-4 border border-border/40 rounded-xl shadow-lg backdrop-blur-sm min-h-[400px]"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Header/Breadcrumb - Estrutura responsiva mantida: Coluna em mobile, Linha em sm+ */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-3 border-b border-border/20">
                
                {/* Contêiner do Breadcrumb com scroll horizontal para caminhos longos */}
                <div className="flex items-center space-x-1 sm:space-x-2 mb-2 sm:mb-0 overflow-x-auto whitespace-nowrap max-w-full">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigateTo({ id: 'root', name: 'Início', type: 'folder' })}
                        disabled={isRoot}
                        className="text-primary hover:bg-primary/10 flex-shrink-0"
                    >
                        <Home className="w-5 h-5" />
                    </Button>
                    {!isRoot && (
                        <Button variant="ghost" size="icon" onClick={navigateUp} className="hover:bg-primary/10 flex-shrink-0">
                            <CornerDownLeft className="w-5 h-5" />
                        </Button>
                    )}
                    {currentPath.map((item, index) => (
                        <div key={item.id} className="flex items-center text-sm text-foreground/80 flex-shrink-0">
                            {index > 0 && <ChevronRight className="w-4 h-4 mx-1 text-muted-foreground/50" />}
                            <span 
                                className={`cursor-pointer hover:text-primary transition-colors ${index === currentPath.length - 1 ? 'font-semibold text-primary' : 'text-muted-foreground'}`}
                                onClick={() => navigateTo({ id: item.id, name: item.name, type: 'folder' })}
                            >
                                {item.name}
                            </span>
                        </div>
                    ))}
                </div>
                
                {/* INÍCIO DA CORREÇÃO DE RESPONSIVIDADE DOS BOTÕES */}
                {/* Agora: Empilha (coluna) em mobile, fica lado a lado (linha) em sm+ */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 flex-shrink-0 w-full sm:w-auto justify-end">
                    <AlertDialogTrigger onClick={() => setIsUploadAlertOpen(true)}>
                        <Button variant="outline" className="text-primary hover:bg-primary/10 w-full sm:w-auto">
                            <Upload className="w-4 h-4 mr-2" /> Adicionar Arquivo
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogTrigger onClick={() => setIsAlertOpen(true)}>
                        <Button variant="default" className="w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" /> Adicionar Pasta
                        </Button>
                    </AlertDialogTrigger>
                </div>
                {/* FIM DA CORREÇÃO DE RESPONSIVIDADE DOS BOTÕES */}
            </div>

            {loading ? (
                <p className="text-center text-muted-foreground py-10">Carregando arquivos...</p>
            ) : !userEmail ? (
                <div className="text-center text-muted-foreground py-10 border border-dashed border-border/50 rounded-lg">
                <p>Faça login para gerenciar seus arquivos.</p>
                </div>
            ) : currentContent.length === 0 ? (
                <div className="text-center text-muted-foreground py-10 border border-dashed border-border/50 rounded-lg">
                <p>Esta pasta está vazia. Arraste arquivos ou use o botão 'Arquivo'.</p>
                </div>
            ) : (
                <div className="space-y-2">
                {currentContent.map(item => (
                    <div
                    key={item.id}
                    // Item da Lista: Flex-col em mobile, Flex-row em sm+
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-border/20 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
                    onClick={() => item.type === 'folder' && navigateTo(item)}
                    >
                    {/* Nome e Ícone */}
                    <div className="flex items-center space-x-3 truncate w-full sm:w-auto">
                        {item.type === 'folder' ? (
                        <Folder className="w-5 h-5 text-primary flex-shrink-0" />
                        ) : (
                        <FileText className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                        <span className="font-medium truncate">{item.name}</span>
                    </div>
                    
                    {/* Detalhes e Ações */}
                    <div className="flex items-center space-x-4 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
                        <span className="text-sm text-muted-foreground flex-grow text-right">
                        {item.type === 'file' ? formatFileSize(item.size) : `${item.content?.length || 0} itens`}
                        </span>
                        <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                        className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                        >
                        <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                    </div>
                ))}
                </div>
            )}
            
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Criar Nova Pasta</AlertDialogTitle>
                    <AlertDialogDescription>
                    Digite o nome da pasta a ser criada em "{currentPath[currentPath.length - 1].name}".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Input 
                    placeholder="Nome da Pasta (ex: Semiologia)" 
                    value={folderName} 
                    onChange={(e: any) => setFolderName(e.target.value)}
                    className="text-black" 
                />
                <AlertDialogFooter>
                    <Button variant="outline" onClick={() => setIsAlertOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreateFolder} disabled={!folderName}>Criar Pasta</Button>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isUploadAlertOpen} onOpenChange={setIsUploadAlertOpen}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Adicionar Arquivo</AlertDialogTitle>
                    <AlertDialogDescription>
                    Selecione um arquivo do seu computador ou arraste-o para a área de arquivos.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="p-4 border border-dashed border-border/50 rounded-lg text-center cursor-pointer hover:bg-primary/5 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); handleDrop(e); setIsUploadAlertOpen(false); }}
                >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Clique para selecionar ou arraste e solte aqui</p>
                    <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleUploadFile} 
                    className="hidden" 
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    />
                </div>
                <AlertDialogFooter>
                    <Button variant="outline" onClick={() => setIsUploadAlertOpen(false)}>Cancelar</Button>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

// ----------------------------------------------------
// NOVO COMPONENTE: Wrapper para Gerenciador de Arquivos
// ----------------------------------------------------
interface FileManagerAccessWrapperProps {
    isPremium: boolean;
    userEmail: string;
    onUpgrade?: () => void;
}

const FileManagerAccessWrapper = ({ isPremium, userEmail, onUpgrade }: FileManagerAccessWrapperProps) => {
    if (isPremium) {
        return <FileManager userEmail={userEmail} />;
    }

    // Aviso Amarelo para usuários Não-Premium
    return (
        <div className="file-manager-container p-4 border-2 border-yellow-500 bg-yellow-500/10 rounded-xl shadow-inner min-h-[400px] flex flex-col items-center justify-center text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-yellow-500" />
            <h3 className="text-xl font-bold text-yellow-500">Recurso Premium</h3>
            <p className="text-foreground/80 max-w-sm">
                O **Gerenciador de Arquivos** é um recurso exclusivo para assinantes Premium. Faça upgrade para organizar, armazenar e gerenciar seus documentos de estudo ilimitadamente.
            </p>
            <Button 
                variant="default" 
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold"
                onClick={onUpgrade}
            >
                Ativar Premium Agora
            </Button>
        </div>
    );
};


// ----------------------------------------------------
// COMPONENTE PRINCIPAL: StudyDashboard (Atualizado)
// ----------------------------------------------------

export const StudyDashboard = ({ user, onUpgrade, studyTime, formattedTime, isPremium }: StudyDashboardProps) => {
  // REMOVIDO: const { subscription } = useSubscription(user); // REMOVIDO

  const [ranking, setRanking] = useState<BackendUser[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(true);
  const [prouvesCount, setProuvesCount] = useState<number>(0); 

  const userEmail = user?.email;

  // EFEITO 1: Busca de Ranking e Contador de Provas (Mantido)
  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/get-users`); 
        const data: BackendUser[] = await res.json();
        
        if (Array.isArray(data)) {
          if (userEmail) {
            const testUser = data.find(u => u.email === userEmail);
            if (testUser) {
                setProuvesCount(testUser.prouves);
            }
          }
          
          const sorted = [...data].sort((a, b) => b.hours - a.hours);
          setRanking(sorted);
        }
      } catch (err) {
        console.error("Erro ao carregar ranking ou contador de provas:", err);
      } finally {
        setLoadingRanking(false);
      }
    };
    fetchRanking();
  }, [studyTime, userEmail]); 

  const fullName = user?.user_metadata?.full_name || "Estudante";
  const gender = user?.user_metadata?.gender || "masculino";
  const firstName = fullName.split(" ")[0];

  const dailySequence = (user?.user_metadata as any)?.sequence || 0;

  const getWelcomeMessage = () => {
    if (gender === "feminino") return `Bem-vinda, Doutora ${firstName}!`;
    if (gender === "masculino") return `Bem-vindo, Doutor ${firstName}!`;
    return `Bem-vindo(a), Dr(a) ${firstName}!`;
  };

  const currentMonthHours = studyTime; 
  const hoursComparison = 0; 

  const allTied =
    ranking.length > 0 && ranking.every((u) => u.hours === ranking[0].hours);
    
  // CORRIGIDO: Agora isPremium vem via prop do componente pai (Index.tsx)
  // const isPremium = subscription.subscription_tier !== "free"; // LINHA REMOVIDA

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Welcome Section (Mantido) */}
      <div className="text-center py-8 sm:py-12 space-y-4 sm:space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 blur-3xl"></div>
          <div className="relative">
            <h1 className="text-4xl sm:text-5xl font-bold mb-2 sm:mb-4 text-white">{getWelcomeMessage()}</h1>
            <p className="text-lg sm:text-xl text-foreground/70">Painel de Estudos Médicos</p>
          </div>
        </div>
        <div className="w-24 sm:w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto rounded-full opacity-60"></div>
      </div>

      {/* Premium CTA (Mantido - usando a nova prop) */}
      {!isPremium && (
        <PremiumCTA
          variant="banner"
          message="Maximize seus estudos com recursos Premium!"
          onUpgrade={onUpgrade}
        />
      )}

      {/* Stats Overview - Grid responsiva */}
      <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="stats-card group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="stats-label text-sm text-muted-foreground mb-2">Horas de Estudo</p>
              <p className="stats-number text-2xl sm:text-3xl font-bold glow-text mb-1">
                {formattedTime || "0m"}
              </p>
              <p className="text-xs text-muted-foreground/70">Tempo ativo na plataforma</p>
            </div>
            <div className="stats-icon glow-icon w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
              <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
            </div>
          </div>
        </div>

        <div className="stats-card group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="stats-label text-sm text-muted-foreground mb-2">Provas Feitas</p>
              <p className="stats-number text-2xl sm:text-3xl font-bold glow-text mb-1">{prouvesCount}</p>
              <p className="text-xs text-muted-foreground/70">Total acumulado</p>
            </div>
            <div className="stats-icon glow-icon w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
              <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
            </div>
          </div>
        </div>

        <div className="stats-card group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="stats-label text-sm text-muted-foreground mb-2">Sequência Atual</p>
              <p className="stats-number text-2xl sm:text-3xl font-bold glow-text mb-1">
                {dailySequence} {dailySequence === 1 ? "dia" : "dias"}
              </p>
              <p className="text-xs text-muted-foreground/70">Mantenha a consistência</p>
            </div>
            <div className="stats-icon glow-icon w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
              <Target className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
            </div>
          </div>
        </div>

        <div className="stats-card group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="stats-label text-sm text-muted-foreground mb-2">Comparação Mensal</p>
              <div className="flex items-center space-x-2 mb-1">
                <TrendingUp
                  className={`w-5 h-5 ${hoursComparison >= 0 ? "text-primary" : "text-destructive"}`}
                />
                <span
                  className={`stats-number text-xl sm:text-2xl font-bold ${
                    hoursComparison >= 0 ? "glow-text" : "text-destructive"
                  }`}
                >
                  {hoursComparison >= 0 ? "+" : ""}
                  {hoursComparison.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground/70">vs. mês passado</p>
            </div>
            <div className="stats-icon glow-icon w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
              <Award className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Ranking + Gerenciador de Arquivos - Grid responsiva */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border border-border/40 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" /> Ranking de Estudos
            </CardTitle>
            <CardDescription>
              {allTied ? "Todos estão empatados!" : "Veja quem mais estudou"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRanking ? (
              <p className="text-muted-foreground text-center">Carregando ranking...</p>
            ) : ranking.length === 0 ? (
              <p className="text-muted-foreground text-center">Nenhum usuário encontrado.</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <div className="grid grid-cols-12 text-sm font-semibold text-muted-foreground border-b border-border/30 pb-2 mb-2 min-w-[300px]">
                  <div className="col-span-2 text-center">Posição</div>
                  <div className="col-span-5">Instagram / Nome</div>
                  <div className="col-span-5 text-right pr-2">Horas de Estudo</div>
                </div>

                <div className="divide-y divide-border/20">
                  {ranking.map((u, index) => (
                    <div
                      key={u.name}
                      className="grid grid-cols-12 items-center py-3 px-2 hover:bg-primary/5 rounded-lg transition-colors min-w-[300px]"
                    >
                      <div className="col-span-2 text-center">
                        {!allTied ? (
                          <span className="font-bold text-primary">{index + 1}º</span>
                        ) : (
                          <span className="text-muted-foreground">=</span>
                        )}
                      </div>

                      <div className="col-span-5 flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 truncate">
                        <p className="font-medium text-foreground truncate">@{u.insta}</p>
                        <span className="text-foreground/90 font-semibold text-xs sm:text-sm">({u.name})</span>
                      </div>

                      <div className="col-span-5 text-right font-medium text-foreground pr-2">
                        {u.hours}h
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/40 shadow-lg backdrop-blur-sm relative overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2 relative z-10">
              <FolderLock className="w-5 h-5 text-primary" /> Gerenciador de Arquivos
            </CardTitle>
            <CardDescription className="relative z-10">
              Organize, gerencie e armazene seus arquivos médicos com segurança.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 p-2 pt-0">
             {/* CHAMADA ATUALIZADA */}
             <FileManagerAccessWrapper 
                isPremium={isPremium} 
                userEmail={userEmail || ''} 
                onUpgrade={onUpgrade}
             />
          </CardContent>
        </Card>
      </div>

      {/* Footer (Mantido) */}
      <footer className="border-t border-border/20 pt-6 sm:pt-8 mt-8 sm:mt-12">
        <div className="flex flex-col items-center space-y-4 sm:space-y-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Button
              variant="glass"
              size="icon"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full hover:scale-110 transition-transform duration-300"
              onClick={() =>
                window.open("https://www.tiktok.com/@medvoa?_t=ZM-8yW9WluOyyk&_r=1", "_blank")
              }
            >
              <FaTiktok className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
            </Button>
            <Button
              variant="glass"
              size="icon"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full hover:scale-110 transition-transform duration-300"
              onClick={() =>
                window.open(
                  "https://www.instagram.com/medvoa.ia?igsh=MXVuaXB4cnkwaXV1cA%3D%3D&utm_source=qr",
                  "_blank"
                )
              }
            >
              <FaInstagram className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
            </Button>
            <Button
              variant="glass"
              size="icon"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full hover:scale-110 transition-transform duration-300"
              onClick={() => window.open("https://youtube.com/@medvoa?si=ucEj7tFmDIjTBJWJ", "_blank")}
            >
              <FaYoutube className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
            </Button>
            <Button
              variant="glass"
              size="icon"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full hover:scale-110 transition-transform duration-300"
              onClick={() => window.open("https://x.com/medvoa_?s=21", "_blank")}
            >
              <FaTwitter className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground/60 text-center">
            © 2025 MedVoa. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};