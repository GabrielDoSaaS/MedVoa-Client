import { useState } from "react";
// Assumindo que você usa um router e um cliente supabase/auth
// import { useRouter } from 'next/router'; // Se estiver usando Next.js
// import { useSupabaseClient } from '@supabase/auth-helpers-react'; // Exemplo de hook Supabase
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Settings, Bell, Shield, Palette, Volume2, Trash2, AlertTriangle } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { TermsOfService } from "./TermsOfService";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { CookiePolicy } from "./CookiePolicy";

// O componente ChangePasswordPage precisa ser importado ou definido se o roteamento for mantido,
// mas como a opção foi removida, vou remover a importação e o roteamento dele.
// type SubPage = 'settings' | 'terms' | 'privacy' | 'cookies' | 'changePassword';
type SubPage = 'settings' | 'terms' | 'privacy' | 'cookies'; // Removendo 'changePassword'

interface SettingsPageProps {
  user: SupabaseUser | null;
  onBack: () => void;
  // A prop onLogoutSuccess foi removida.
}

export const SettingsPage = ({
  user,
  onBack,
  // onLogoutSuccess removida
}: SettingsPageProps) => {
  const { toast } = useToast();
  // const router = useRouter(); // Se estiver usando Next.js
  // const supabase = useSupabaseClient(); // Se estiver usando Supabase
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);
  const [darkMode, setDarkMode] = useState(true); // Modo escuro por padrão
  const [autoSave, setAutoSave] = useState(true);
  const [currentPage, setCurrentPage] = useState<SubPage>('settings'); // Usando o novo tipo SubPage
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false); // Novo estado para loading/desabilitar botão

  const handleSaveSettings = () => {
    toast({
      title: "Configurações salvas!",
      description: "Suas configurações foram salvas com sucesso.",
    });
    onBack();
  };

  const handleDeleteAccount = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (confirmDeleteText !== "EXCLUIR" || !user?.email) {
        return; // Garante que a confirmação foi digitada e que o email existe
    }

    setIsDeleting(true);

    try {
        const response = await fetch('http://localhost:3000/api/deleteAccount', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: user.email }),
        });

        // Variável de dados padrão para o caso de a resposta estar vazia
        let data: { message?: string; error?: string } = { message: "Conta deletada com sucesso. Redirecionando..." };
        
        // CORREÇÃO: Verifica se a resposta tem um corpo JSON válido
        const contentType = response.headers.get("content-type");
        
        // Se a resposta tiver um cabeçalho JSON, tenta ler o corpo
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } 
        
        if (response.ok) { // response.ok é TRUE para status 200-299
            toast({
                title: "Conta Excluída",
                description: data.message || "Sua conta foi permanentemente excluída.",
                variant: "destructive",
            });

            // 1. Recarrega a página para forçar o redirecionamento/logout.
            window.location.reload(); 
            // O código abaixo desta linha pode não ser executado se o reload for imediato.
            
        } else { // response.ok é FALSE para status 4xx ou 5xx
            // Falha na API (Usuário não encontrado, ou erro de servidor)
            toast({
                title: "Erro ao Excluir",
                // Usa a mensagem de erro do backend, ou um erro genérico
                description: data.error || "Ocorreu um erro ao tentar excluir sua conta. Tente novamente.",
                variant: "destructive",
            });
        }
    } catch (error) {
        console.error('Erro de rede/servidor ou ao processar JSON:', error);
        toast({
            title: "Erro de Conexão",
            description: "Não foi possível conectar com o servidor ou processar a resposta. Verifique a rede.",
            variant: "destructive",
        });
    } finally {
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        setConfirmDeleteText("");
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setConfirmDeleteText("");
  };

  // Renderização das sub-páginas
  if (currentPage === 'terms') {
    return <TermsOfService onBack={() => setCurrentPage('settings')} />;
  }

  if (currentPage === 'privacy') {
    return <PrivacyPolicy onBack={() => setCurrentPage('settings')} />;
  }

  if (currentPage === 'cookies') {
    return <CookiePolicy onBack={() => setCurrentPage('settings')} />;
  }

  // O bloco 'if (currentPage === 'changePassword')' foi removido.

  return <div className="main-background min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4 hover:bg-secondary/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-white text-center">Configurações</h1>
          <p className="text-white/80 mt-2 text-center">
            Personalize sua experiência na plataforma
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure como você deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="notifications">Notificações Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações em tempo real
                  </p>
                </div>
                <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="email-alerts">Alertas por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba resumos diários por email
                  </p>
                </div>
                <Switch id="email-alerts" checked={emailAlerts} onCheckedChange={setEmailAlerts} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Sons
              </CardTitle>
              <CardDescription>
                Personalize a interface da aplicação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="sound-effects">Efeitos Sonoros</Label>
                  <p className="text-sm text-muted-foreground">
                    Ative sons para interações
                  </p>
                </div>
                <Switch id="sound-effects" checked={soundEffects} onCheckedChange={setSoundEffects} />
              </div>
            </CardContent>
          </Card>


          <div className="grid md:grid-cols-2 gap-6">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Privacidade e Segurança
                </CardTitle>
                <CardDescription>
                  Gerencie suas configurações de privacidade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex flex-col items-center pt-8">
                {/* O botão "Alterar Senha" foi removido daqui */}
                
                {/* A linha de Separator também é removida para limpar o layout */}
                
                <Button 
                    variant="destructive" 
                    className="btn-glass w-48 hover-scale bg-red-600 hover:bg-red-700" 
                    size="sm" 
                    onClick={handleDeleteAccount}
                    disabled={!user?.email} // Desabilita se não tiver email para enviar
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Conta
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Documentos Legais
                </CardTitle>
                <CardDescription>
                  Acesse os documentos legais da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="btn-glass w-full justify-start" 
                  size="sm"
                  onClick={() => setCurrentPage('terms')}
                >
                  Termos de Uso
                </Button>
                
                <Button 
                  variant="outline" 
                  className="btn-glass w-full justify-start" 
                  size="sm"
                  onClick={() => setCurrentPage('privacy')}
                >
                  Privacidade da Conta
                </Button>
                
                <Button 
                  variant="outline" 
                  className="btn-glass w-full justify-start" 
                  size="sm"
                  onClick={() => setCurrentPage('cookies')}
                >
                  Cookies
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <Button onClick={handleSaveSettings} className="btn-glow">
              Salvar Configurações
            </Button>
          </div>
        </div>

        {/* Delete Account Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </div>
                Excluir Conta Permanentemente
              </DialogTitle>
              <DialogDescription className="space-y-2">
                <span className="block">Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente excluídos.</span>
                <span className="block text-destructive font-medium">Para confirmar, digite "EXCLUIR" no campo abaixo:</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confirm-delete">Confirmação</Label>
                <Input
                  id="confirm-delete"
                  placeholder="Digite EXCLUIR para confirmar"
                  value={confirmDeleteText}
                  onChange={(e) => setConfirmDeleteText(e.target.value)}
                  autoFocus
                  disabled={isDeleting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="secondary"
                onClick={handleDeleteCancel}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={confirmDeleteText !== "EXCLUIR" || isDeleting}
              >
                {isDeleting ? 'Excluindo...' : (
                    <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Conta
                    </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>;
};