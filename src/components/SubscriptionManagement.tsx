import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Crown, Calendar, CreditCard, HelpCircle, CheckCircle, Star } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import axios from "axios"; // NOVO: Importar axios
import { // NOVO: Importar AlertDialog para o modal de sucesso
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SubscriptionManagementProps {
  user: User | null;
  userEmail: string; // NOVO: Email do usuário
  onBack: () => void;
}

const API_BASE_URL = 'http://localhost:3000/api'; // NOVO: URL base da API

export const SubscriptionManagement = ({
  user,
  userEmail, // Desestruturar o novo prop
  onBack
}: SubscriptionManagementProps) => {
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // NOVO: Estado para o modal de sucesso
  
  const handleManageSubscription = async () => {
    if (!user) {
      toast.error("Usuário não encontrado");
      return;
    }
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        toast.error("Erro ao abrir portal de gerenciamento");
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error("Erro ao abrir portal de gerenciamento");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!userEmail) {
      toast.error("Email do usuário não encontrado para o cancelamento.");
      return;
    }

    if (!confirm("Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos benefícios Premium.")) {
      return;
    }

    setLoading(true);
    try {
      // NOVA LÓGICA: Requisição para a rota de cancelamento
      const response = await axios.post(
        `${API_BASE_URL}/cancel-plan`,
        { email: userEmail },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200 || response.status === 204) {
        // Se a requisição for bem-sucedida, exibe o modal de sucesso
        setShowSuccessModal(true);
      } else {
        toast.error(`Falha ao cancelar: ${response.data.message || 'Erro desconhecido.'}`);
      }
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error(`Erro ao cancelar assinatura: ${error.response?.data?.message || error.message || 'Tente novamente.'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // NOVO: Handler para fechar o modal e recarregar
  const handleSuccessModalConfirm = () => {
    setShowSuccessModal(false);
    // Recarrega a página conforme solicitado
    window.location.reload(); 
  };

  const handleStartChat = () => {
    // Simular início do chat de suporte
    toast.success("Chat de suporte iniciado! Nossa equipe entrará em contato em breve.");
    // Aqui você pode integrar com seu sistema de chat (Intercom, Zendesk, etc.)
  };
  const handleSendEmail = () => {
    const supportEmail = "suporte@medvoa.com";
    const subject = encodeURIComponent("Suporte Premium - Solicitação de Ajuda");
    const body = encodeURIComponent(`Olá equipe MedVoa,

Preciso de ajuda com minha assinatura Premium.

Dados da conta:
- Email: ${user?.email}
- ID: ${user?.id}

Descreva sua dúvida aqui...

Atenciosamente,
${user?.user_metadata?.full_name || 'Usuário Premium'}`);
    window.open(`mailto:${supportEmail}?subject=${subject}&body=${body}`, '_blank');
    toast.success("Email de suporte aberto!");
  };
  const handleViewAllInvoices = async () => {
    if (!user) {
      toast.error("Usuário não encontrado");
      return;
    }
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success("Redirecionando para histórico de faturas...");
      } else {
        toast.error("Erro ao abrir histórico de faturas");
      }
    } catch (error) {
      console.error('Error opening invoices:', error);
      toast.error("Erro ao abrir histórico de faturas");
    } finally {
      setLoading(false);
    }
  };
  const subscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Mock: 30 dias

  // Benefícios ajustados: "Jogos sem limite" e "Upload em Med Play" removidos
  const premiumFeatures = ["Doutor IA ilimitado", "Provas ilimitadas", "Casoteca completa", "Flashcards com IA", "Suporte prioritário", "Sem anúncios"];
  return <div className="main-background min-h-screen">
      {/* Header */}
      <header className="py-8">
        <div className="container mx-auto px-8 sm:px-12">
          <div className="flex justify-center items-center mb-8 relative">
            <Button variant="ghost" size="lg" onClick={onBack} className="absolute left-0 top-8 text-foreground/70 hover:text-foreground border border-foreground/20 hover:border-foreground/40">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
          <div className="flex flex-col items-center text-center">
            <Crown className="w-16 h-16 text-yellow-500 mb-6" />
            <h1 className="text-5xl font-bold text-white mb-3">Gerenciar Assinatura</h1>
            <p className="text-xl text-foreground/70">Controle total da sua conta Premium</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Status da Assinatura */}
          <Card className="glass-card border-yellow-400/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  <div>
                    <CardTitle className="text-xl text-yellow-300">Premium Ativo</CardTitle>
                    <CardDescription>Sua assinatura está ativa e funcionando</CardDescription>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ativo
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* BLOCO DE PRÓXIMA RENOVAÇÃO OMITIDO CONFORME SOLICITAÇÃO */}
              {/*
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-400/20">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="font-medium">Próxima Renovação</p>
                    <p className="text-sm text-foreground/70">{subscriptionEnd.toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">R$ 79,99</p>
                  <p className="text-xs text-foreground/70">por mês</p>
                </div>
              </div>
              */}

              {/* BOTÃO GERENCIAR PAGAMENTO OMITIDO CONFORME SOLICITAÇÃO. APENAS CANCELAR É MANTIDO. */}
              <Button variant="outline" className="w-full btn-glass border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/10" onClick={handleCancelSubscription} disabled={loading}>
                Cancelar Plano
              </Button>
              {/*
              <div className="flex gap-3">
                <Button onClick={handleManageSubscription} disabled={loading} className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white">
                  <CreditCard className="w-4 h-4 mr-2" />
                  {loading ? "Carregando..." : "Gerenciar Pagamento"}
                </Button>
                <Button variant="outline" className="btn-glass border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/10" onClick={handleCancelSubscription} disabled={loading}>
                  Cancelar Plano
                </Button>
              </div>
              */}
            </CardContent>
          </Card>

          {/* Benefícios Premium */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span>Seus Benefícios Premium</span>
              </CardTitle>
              <CardDescription>
                Aproveite todas as funcionalidades exclusivas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* A lista de benefícios agora usa o array 'premiumFeatures' filtrado */}
                {premiumFeatures.map((feature, index) => <div key={index} className="flex items-center space-x-2 p-2 rounded-lg bg-primary/5">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>)}
              </div>
            </CardContent>
          </Card>

          {/* Suporte Premium */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <span>Suporte Premium</span>
              </CardTitle>
              <CardDescription>
                Precisa de ajuda? Nossa equipe está aqui para você
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <h4 className="font-medium mb-2">Atendimento via WhatsApp</h4>
                  <p className="text-sm text-foreground/70 mb-3">Suporte imediato via WhatsApp</p>
                  <Button size="sm" className="w-full" onClick={() => window.open('https://wa.me/5514981899898?text=Olá%2C%20sou%20um%20estudante%20Premium%20da%20MedVoa%20e%20preciso%20de%20ajuda%21', '_blank')}>
                    Abrir WhatsApp
                  </Button>
                </div>
                <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <h4 className="font-medium mb-2">Email Direto</h4>
                  <p className="text-sm text-foreground/70 mb-3">Resposta em até 2 horas</p>
                  <p className="font-mono text-center p-2 bg-background/50 rounded border text-base">
                    contatomedvoa@gmail.com
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Pagamentos OMITIDO CONFORME SOLICITAÇÃO */}
        </div>
      </main>

      {/* NOVO: Modal de Sucesso */}
      <AlertDialog open={showSuccessModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-green-500">
              <CheckCircle className="w-5 h-5 mr-2" />
              Cancelamento Concluído!
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sua assinatura Premium foi cancelada com sucesso. Você perderá o acesso aos benefícios Premium ao final do seu ciclo de cobrança. Ao confirmar, a página será recarregada para atualizar seu status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSuccessModalConfirm}>
              Confirmar e Recarregar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};