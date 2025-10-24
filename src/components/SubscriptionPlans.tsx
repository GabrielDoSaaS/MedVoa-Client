import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, X, Brain, ArrowLeft, Sparkles, Shield, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
// REMOVIDO: import { useSubscription } from "@/hooks/useSubscription";
import { User } from "@supabase/supabase-js";
// NOVO IMPORT: Componente de Checkout Transparente
import { AsaasTransparentCheckout } from "./AsaasTransparentCheckout"; 

// Ajustando a tipagem para incluir o isPremium do modelo Mongoose, 
// assumindo que a prop user recebe esse objeto estendido após o login.
// O tipo User do supabase/supabase-js não tem isPremium, mas vamos simular.
interface CustomUser extends User {
    isPremium?: boolean; // Propriedade do modelo Mongoose
}

interface SubscriptionPlansProps {
  user: CustomUser | null; // Usando o tipo ajustado
  onBack: () => void;
}

// Interface para os dados do checkout transparente
interface CheckoutPlanData {
    cycle: 'MONTHLY' | 'YEARLY' | 'SEMIANNUAL';
    description: string;
}

export const SubscriptionPlans = ({
  user,
  onBack
}: SubscriptionPlansProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [yearlyPlan, setYearlyPlan] = useState<'semester' | 'annual'>('annual');
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // NOVO: Usar isPremium do objeto user como a fonte de verdade
  const isUserPremium = user?.isPremium === true;

  // NOVO ESTADO: Armazena os dados do plano selecionado para o checkout
  const [checkoutData, setCheckoutData] = useState<CheckoutPlanData | null>(null); 

  // --- DADOS COMPLETOS PARA TESTEMUNHOS E FEATURES ---
  const testimonials = [
    { stars: "⭐⭐⭐⭐⭐", text: "Consegui acelerar minhas aulas de fisiologia em minutos, algo que levaria dias no grupo da faculdade! O MedVoa é realmente especializado.", initials: "CS", name: "Carlos Silva", info: "3º ano Medicina - UFMG", date: "15 de março, 2025" },
    { stars: "⭐⭐⭐⭐⭐", text: "Os simulados personalizados me ajudaram a identificar exatamente onde precisava melhorar. Passei direto na prova de anatomia.", initials: "MS", name: "Marina Santos", info: "5º ano Medicina - UFU", date: "07 de março, 2025" },
    { stars: "⭐⭐⭐⭐⭐", text: "Desde que comecei a usar o MedVoa, minhas notas melhoraram 30%. A IA entende exatamente o que preciso estudar.", initials: "RS", name: "Rafael Souza", info: "4º ano Medicina - UFSC", date: "14 de abril, 2025" },
    { stars: "⭐⭐⭐⭐⭐", text: "Ótimo para revisar aulas! As anotações automáticas poupam horas e os resumos ficam organizados. Minha produtividade aumentou muito.", initials: "AC", name: "Ana Costa", info: "3º ano Medicina - USP", date: "28 de abril, 2025" },
    { stars: "⭐⭐⭐⭐⭐", text: "A função de casos clínicos é perfeita para treinar raciocínio. Me sinto muito mais confiante nas decisões médicas agora.", initials: "CR", name: "Camila Rodrigues", info: "4º ano Medicina - UFRGS", date: "03 de junho, 2025" },
    { stars: "⭐⭐⭐⭐⭐", text: "Os flashcards automáticos transformaram minha forma de estudar. Economizo horas criando materiais de revisão para farmacologia.", initials: "PB", name: "Pedro Rocha", info: "6º ano Medicina - UFMG", date: "15 de junho, 2025" },
    { stars: "⭐⭐⭐⭐⭐", text: "O MedVoa mudou minha rotina de estudos. Agora consigo focar no que realmente importa e minhas notas subiram significativamente.", initials: "LM", name: "Lucas Martins", info: "2º ano Medicina - UNICAMP", date: "22 de junho, 2025" },
    { stars: "⭐⭐⭐⭐⭐", text: "Incrível como a IA consegue personalizar o conteúdo. Sinto que tenho um tutor pessoal disponível 24h por dia.", initials: "BF", name: "Beatriz Ferreira", info: "4º ano Medicina - UFRJ", date: "05 de julho, 2025" },
    { stars: "⭐⭐⭐⭐⭐", text: "As provas geradas pela IA são muito próximas das reais. Me sinto muito mais preparada para os exames agora.", initials: "JL", name: "Júlia Lima", info: "5º ano Medicina - UFPE", date: "18 de julho, 2025" },
    { stars: "⭐⭐⭐⭐⭐", text: "O modo foco revolucionou meu tempo de estudo. Consigo me concentrar muito melhor e render mais em menos tempo.", initials: "TA", name: "Thiago Alves", info: "3º ano Medicina - PUC-SP", date: "30 de julho, 2025" },
    { stars: "⭐⭐⭐⭐⭐", text: "Fantástico para quem está no internato! Os casos clínicos me ajudam muito a pensar como um médico de verdade.", initials: "VS", name: "Vitória Silva", info: "6º ano Medicina - UFBA", date: "12 de agosto, 2025" },
    { stars: "⭐⭐⭐⭐⭐", text: "Não consigo mais estudar sem o MedVoa. É como ter acesso ao melhor material de estudo do mundo em um só lugar.", initials: "GM", name: "Gustavo Mendes", info: "4º ano Medicina - UFPR", date: "25 de agosto, 2025" }
  ];

  // NOVA FUNÇÃO: INICIA O CHECKOUT TRANSPARENTE (SEM VERIFICAR LOGIN)
  const handleSubscribe = (priceType: 'monthly' | 'semester' | 'annual') => {
    
    // VERIFICAÇÃO DE LOGIN ADICIONAL
    if (!user) {
        toast.error("Faça login para assinar.");
        return;
    }
    
    let cycleType: 'MONTHLY' | 'YEARLY' | 'SEMIANNUAL';
    let description: string;

    if (priceType === 'monthly') {
        cycleType = 'MONTHLY';
        description = 'Assinatura Mensal MedVoa Premium';
    } else if (priceType === 'semester') {
        cycleType = 'SEMIANNUAL';
        description = 'Assinatura Semestral MedVoa Premium (6 meses)';
    } else { // 'annual'
        cycleType = 'YEARLY';
        description = 'Assinatura Anual MedVoa Premium (12 meses)';
    }

    setCheckoutData({ cycle: cycleType, description });
  };
  
  // Função Original de Gerenciamento (MANTIDA)
  // Nota: Esta função só é relevante para quem usa um sistema de pagamento externo (Stripe, Asaas)
  // que fornece um portal de gerenciamento.
  const handleManageSubscription = async () => {
    if (!user) {
        toast.error("Faça login para gerenciar sua assinatura.");
        return;
    }
    setLoading('manage');
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Erro ao acessar portal:', error);
      toast.error("Erro ao acessar portal do cliente. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };
  
  // --- FEATURES COMPLETAS COM SUBSTITUIÇÕES ---
  const features = {
    free: [{
      text: "3 mensagens por dia no Doutor IA",
      included: true
    }, {
      text: "Criar até 3 provas por mês",
      included: true
    }, {
      text: "Criar até 3 casos por mês na Casoteca",
      included: true
    }, {
      text: "Organização de calendário com o MedCalendar (limitado)", // SUBSTITUIÇÃO DE JOGOS
      included: true
    }, {
      text: "Modo Foco liberado",
      included: true
    }, {
      text: "Gerar flashcards com IA",
      included: false
    }, {
      text: "Organização de calendário com o MedCalendar", // SUBSTITUIÇÃO DE MEDPLAY
      included: false
    }, {
      text: "Acesso ilimitado",
      included: false
    }, {
      text: "Suporte prioritário",
      included: false
    }],
    premium: [{
      text: "Mensagens ilimitadas no Doutor IA",
      included: true
    }, {
      text: "Provas ilimitadas",
      included: true
    }, {
      text: "Casos ilimitados na Casoteca",
      included: true
    }, {
      text: "Organização de calendário com o MedCalendar (ilimitado)", // SUBSTITUIÇÃO DE JOGOS
      included: true
    }, {
      text: "Modo Foco liberado",
      included: true
    }, {
      text: "Gerar flashcards com IA",
      included: true
    }, {
      text: "Organização de calendário com o MedCalendar", // SUBSTITUIÇÃO DE MEDPLAY
      included: true
    }, {
      text: "Acesso ilimitado a todas as funcionalidades",
      included: true
    }, {
      text: "Suporte prioritário",
      included: true
    }]
  };
  
  // RENDERIZAÇÃO CONDICIONAL PARA CHECKOUT TRANSPARENTE
  if (checkoutData) {
      return (
          <div className="main-background min-h-screen">
              <AsaasTransparentCheckout
                  userEmail={user?.email || ""}
                  selectedPlanCycle={checkoutData.cycle}
                  selectedPlanDescription={checkoutData.description}
                  onBack={() => setCheckoutData(null)}
              />
          </div>
      );
  }
  
  // Renderização padrão dos planos
  return <div className="main-background min-h-screen">
      {/* Transparent Header - Ajustado padding */}
      <header className="w-full h-24 flex items-center justify-start px-4 sm:px-8 md:px-12 relative z-50">
        <Button variant="glass" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </header>

      {/* Main Content - Adicionado max-w-7xl e padding responsivo */}
      <main className="container mx-auto px-4 sm:px-6 pb-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16 sm:mb-24">
          <div className="mb-6">
            <Badge className="bg-primary text-white border-primary mb-4 px-6 py-2 text-lg font-bold shadow-2xl relative before:absolute before:inset-0 before:bg-primary before:blur-xl before:-z-10 before:opacity-70">
              ✨ Oferta Especial
            </Badge>
          </div>
          {/* Título com tamanho responsivo */}
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 relative z-10 leading-tight" style={{
          color: '#ffffff'
        }}>
            Investimento inteligente para sua
            <br />
            <span className="text-white text-4xl md:text-5xl">carreira médica</span>
          </h2>
          {/* Descrição com tamanho responsivo */}
          <p className="text-foreground/80 mb-8 max-w-3xl mx-auto text-base sm:text-lg lg:text-xl">
            Compare nossos planos flexíveis: mensal para testes, semestral mais popular, ou anual 
            com máximo desconto. <strong className="text-primary">Teste 7 dias grátis</strong> sem compromissos!
          </p>
          {/* Ícones com flex-wrap para telas pequenas */}
          <div className="flex items-center justify-center flex-wrap gap-4 text-sm text-foreground/70 mb-8">
            <div className="flex items-center space-x-2 glass-card px-4 py-2 rounded-full">
              <span className="text-yellow-400">⭐</span>
              <span>5/5 estrelas</span>
            </div>
            <div className="flex items-center space-x-2 glass-card px-4 py-2 rounded-full">
              <span className="text-primary">👥</span>
              <span>+1.000 estudantes</span>
            </div>
            <div className="flex items-center space-x-2 glass-card px-4 py-2 rounded-full">
              <Shield className="w-4 h-4 text-green-400" />
              <span>100% Seguro</span>
            </div>
          </div>
        </div>

        {/* Current Plan Status (Mantido, layout já é fluido) */}
        {isUserPremium && <div className="mb-8 glass-card border-primary/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary">Plano Premium Ativo</h3>
                    <p className="text-sm text-foreground/70">
                       Acesso ilimitado garantido.
                    </p>
                  </div>
                </div>
                <Button onClick={handleManageSubscription} disabled={loading === 'manage'} className="btn-glass hover:bg-primary/20">
                  {loading === 'manage' ? 'Carregando...' : 'Gerenciar Assinatura'}
                </Button>
              </div>
            </div>
          </div>}

        {/* Plans Grid (O grid md:grid-cols-3 já garante que em mobile fique em coluna) */}
        <div id="plans-section">
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Free Plan (Mantido) */}
            <Card className="glass-card border-foreground/10 relative group hover:border-foreground/20 transition-all duration-300 opacity-75 scale-95">
              <div className="absolute top-4 right-4">
                <Badge variant="outline" className="bg-foreground/10 text-foreground/60 border-foreground/20 text-xs">
                  GRÁTIS
                </Badge>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
              <CardHeader className="text-center relative z-10">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-foreground/10 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-foreground/60" />
                </div>
                <CardTitle className="text-lg font-medium text-foreground/80">Sem Benefícios</CardTitle>
                <p className="text-xs text-foreground/50 mb-4">Experimente o MedVoa gratuitamente</p>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-foreground/60">Free</div>
                  
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-center text-foreground/80 font-medium mb-4">
                  Recursos limitados:
                </div>
                <div className="space-y-2 text-sm">
                  {features.free.map((feature, index) => <div key={index} className="flex items-center space-x-2">
                      {feature.included ? <Check className="w-4 h-4 text-yellow-400 flex-shrink-0" /> : <X className="w-4 h-4 text-red-400 flex-shrink-0" />}
                      <span className={feature.included ? "" : "text-foreground/50"}>{feature.text}</span>
                    </div>)}
                </div>
                
                <div className="pt-4">
                  <div className="flex items-center justify-center space-x-2 text-xs text-foreground/60 mb-4">
                    <Shield className="w-4 h-4" />
                    <span>Sem cartão de crédito</span>
                  </div>
                  {/* BOTÃO DO PLANO GRÁTIS */}
                  <Button variant="outline" className="w-full btn-glass" disabled={!user || !isUserPremium}>
                    {!user ? "Faça login para começar" : isUserPremium ? "Plano Premium Ativo" : "Plano Atual"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Yearly Plan with Toggle (Mantido) */}
            <Card className="glass-card border-yellow-500/50 relative scale-105 shadow-2xl group">
              <div className="absolute top-4 right-4 flex flex-col items-center">
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-xs">
                  {yearlyPlan === 'annual' ? '33% OFF' : '25% OFF'}
                </Badge>
                {/* Realistic Medal */}
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mt-2 shadow-2xl border-2 border-yellow-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/30 to-transparent rounded-full"></div>
                  <Crown className="w-5 h-5 text-yellow-800 relative z-10" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10" />
              
              {/* Toggle buttons (Mantido) */}
              <div className="absolute top-4 left-4 z-20">
                <div className="flex bg-black/50 border border-white/30 rounded-lg p-1 backdrop-blur-md shadow-lg">
                  <button type="button" onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Clicou em 6 meses');
                  setYearlyPlan('semester');
                }} className={`px-4 py-2 text-sm rounded-md transition-all font-medium cursor-pointer touch-manipulation select-none ${yearlyPlan === 'semester' ? 'bg-yellow-500 text-black shadow-lg transform scale-95' : 'text-white/90 hover:text-white hover:bg-white/20 active:bg-white/30'}`} style={{
                  minWidth: '70px',
                  zIndex: 21
                }}>
                    6 meses
                  </button>
                  <button type="button" onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Clicou em anual');
                  setYearlyPlan('annual');
                }} className={`px-4 py-2 text-sm rounded-md transition-all font-medium cursor-pointer touch-manipulation select-none ${yearlyPlan === 'annual' ? 'bg-yellow-500 text-black shadow-lg transform scale-95' : 'text-white/90 hover:text-white hover:bg-white/20 active:bg-white/30'}`} style={{
                  minWidth: '70px',
                  zIndex: 21
                }}>
                    Anual
                  </button>
                </div>
              </div>

              <CardHeader className="text-center relative z-10">
                <div className="h-20 mb-4"></div>
                <CardTitle className="text-xl font-semibold text-white">
                  {yearlyPlan === 'annual' ? 'Anual' : '6 Meses'}
                </CardTitle>
                <p className="text-sm text-foreground/60 mb-4">
                  {yearlyPlan === 'annual' ? 'Melhor custo-benefício' : 'Ótima economia'}
                </p>
                <div className="space-y-1">
                  <div className="text-4xl font-bold text-yellow-500">
                    R$ {yearlyPlan === 'annual' ? '49,90' : '59,90'}
                  </div>
                  <div className="text-sm text-foreground/60">/mês</div>
                  <div className="text-xs text-foreground/50 line-through">
                    Normal: R$ {yearlyPlan === 'annual' ? '69,90' : '69,90'}
                  </div>
                  <div className="text-xs text-yellow-500 font-medium">
                    Economia de {yearlyPlan === 'annual' ? '28%' : '14%'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-center text-foreground/80 font-medium mb-4">
                  Todos os recursos ilimitados:
                </div>
                <div className="space-y-2 text-sm">
                  {features.premium.slice(0, 5).map((feature, index) => <div key={index} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      <span>{feature.text}</span>
                    </div>)}
                </div>
                
                <div className="pt-4">
                  <div className="flex items-center justify-center space-x-2 text-xs text-foreground/60 mb-4">
                    <Sparkles className="w-4 h-4" />
                    <span>Acesso Imediato</span>
                  </div>
                   {/* BOTÃO DO PLANO ANUAL/SEMESTRAL */}
                   {!isUserPremium ? <Button onClick={() => handleSubscribe(yearlyPlan)} disabled={loading === yearlyPlan || !user} variant="ghost" className="w-full !bg-yellow-500 !hover:bg-yellow-600 text-white relative text-lg py-3 font-semibold shadow-lg border border-yellow-500">
                      {!user ? "Faça login para assinar" : loading === yearlyPlan ? <>
                          <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </> : <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Melhor Oferta →
                        </>}
                    </Button> : <Button variant="outline" className="w-full btn-glass" disabled>
                      ✓ Plano Atual
                    </Button>}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Plan (Mantido) */}
            <Card className="glass-card border-green-500/50 relative scale-95 group">
              <div className="absolute top-4 right-4">
                <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">
                  20% OFF
                </Badge>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
              <CardHeader className="text-center relative z-10">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/30 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-green-500" />
                </div>
                <CardTitle className="text-lg font-medium text-white">Mensal</CardTitle>
                <p className="text-xs text-foreground/60 mb-4">Ideal para testar a plataforma</p>
                 <div className="space-y-1">
                   <div className="text-2xl font-bold text-green-500">R$ 69,90</div>
                   <div className="text-sm text-foreground/60">/mês</div>
                   <div className="text-xs text-foreground/50 line-through">Normal: R$ 79,90</div>
                   <div className="text-xs text-green-500 font-medium">Economia de 13%</div>
                 </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-center text-foreground/80 font-medium mb-4">
                  Todos os recursos ilimitados:
                </div>
                <div className="space-y-2 text-sm">
                  {features.premium.slice(0, 5).map((feature, index) => <div key={index} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span>{feature.text}</span>
                    </div>)}
                </div>
                
                <div className="pt-4">
                  <div className="flex items-center justify-center space-x-2 text-xs text-foreground/60 mb-4">
                    <Zap className="w-4 h-4" />
                    <span>Acesso Imediato</span>
                  </div>
                  {/* BOTÃO DO PLANO MENSAL */}
                   {!isUserPremium ? <Button onClick={() => handleSubscribe('monthly')} disabled={loading === 'monthly' || !user} variant="ghost" className="w-full !bg-green-600 !hover:bg-green-700 text-white relative text-lg py-3 font-semibold shadow-lg border border-green-500">
                       {!user ? "Faça login para assinar" : loading === 'monthly' ? <>
                           <Zap className="w-5 h-5 mr-2 animate-spin" />
                           Processando...
                         </> : <>
                           <Zap className="w-5 h-5 mr-2" />
                           Escolher Plano →
                         </>}
                     </Button> : <Button variant="outline" className="w-full btn-glass" disabled>
                       ✓ Plano Atual
                     </Button>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Investment Statistics Section - Ajustado padding e margin */}
        <div className="mt-16 sm:mt-24 mb-16 sm:mb-24">
          <div className="text-center mb-8 sm:mb-12">
            {/* Título com tamanho responsivo */}
            <h3 className="font-bold text-white mb-4 text-4xl sm:text-5xl relative z-10 leading-tight" style={{
            color: '#ffffff'
          }}>
              Investimento que <span className="text-primary">melhora suas notas</span>
            </h3>
            <p className="text-foreground/80 max-w-2xl mx-auto text-base sm:text-xl">
              Compare o custo-benefício da Docora com métodos tradicionais de estudo
            </p>
          </div>
          
          {/* O grid md:grid-cols-3 já garante que em mobile fique em coluna */}
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Statistic 1 */}
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="text-2xl">📈</div>
              </div>
              <div className="text-4xl font-bold text-primary mb-2">80%</div>
              <div className="text-sm text-foreground/80 font-medium">
                Melhora média nas notas
              </div>
            </div>
            
            {/* Statistic 2 */}
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="text-2xl">⏱️</div>
              </div>
              <div className="text-4xl font-bold text-primary mb-2">6x</div>
              <div className="text-sm text-foreground/80 font-medium">
                Menos tempo estudando
              </div>
            </div>
            
            {/* Statistic 3 */}
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="text-2xl">⚡</div>
              </div>
              <div className="text-4xl font-bold text-primary mb-2">15x</div>
              <div className="text-sm text-foreground/80 font-medium rounded-3xl bg-transparent">
                Retorno do investimento
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Section - Ajustado margin */}
        <div className="mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="bg-primary text-white border-primary mb-8 px-6 py-2 text-lg font-bold shadow-2xl relative before:absolute before:inset-0 before:bg-primary before:blur-xl before:-z-10 before:opacity-70">
              Opiniões
            </Badge>
            {/* Título com tamanho responsivo */}
            <h3 className="font-bold text-white mb-4 text-4xl sm:text-5xl relative z-10 leading-tight" style={{
            color: '#ffffff'
          }}>
              Mais de <span className="text-primary">9.300 estudantes</span> já<br />
              melhoraram suas notas com MedVoa
            </h3>
            <p className="text-foreground/80 max-w-2xl mx-auto text-base sm:text-lg">
              Veja como estudantes de medicina, enfermagem e ciências da saúde estão revolucionando seus estudos com IA
            </p>
          </div>
          
          {/* Testimonials Carousel - Ajustado padding externo e padding interno dos cards */}
          <div className="relative">
            {/* Ajuste de padding horizontal para mobile */}
            <div className="overflow-hidden px-4 sm:px-8 lg:px-16">
              <div 
                className="flex animate-marquee"
                style={{ 
                  // A largura precisa ser fixa para a animação de marquee
                  width: `${testimonials.length * 2 * 350}px`
                }}
              >
                {/* Duplicate testimonials for seamless loop */}
                {[...testimonials, ...testimonials].map((testimonial, index) => (
                  <div 
                    key={index}
                    className="flex-shrink-0 px-3"
                    style={{ width: '350px' }} // Mantido para a lógica de animação
                  >
                    {/* Padding interno responsivo */}
                    <div className="glass-card p-4 sm:p-6 h-full">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex text-yellow-400">
                          <span>{testimonial.stars}</span>
                        </div>
                      </div>
                      {/* Fonte responsiva */}
                      <p className="text-xs sm:text-sm text-foreground/80 mb-4">
                        "{testimonial.text}"
                      </p>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs sm:text-sm font-medium text-primary">{testimonial.initials}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{testimonial.name}</div>
                          <div className="text-xs text-foreground/60">{testimonial.info}</div>
                          <div className="text-xs text-foreground/50">{testimonial.date}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Join CTA - Ajustado margin e tamanho do botão */}
          <div className="text-center mt-12 sm:mt-16">
            <Button className="btn-glow px-8 sm:px-12 py-5 sm:py-7 text-lg sm:text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300" onClick={() => {
              const plansSection = document.getElementById('plans-section');
              plansSection?.scrollIntoView({ behavior: 'smooth' });
            }}>
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 mr-3" />
              Juntar-se a 9.300+ estudantes →
            </Button>
          </div>
        </div>

        {/* FAQ Section - Ajustado padding e margin */}
        <div className="mt-16 sm:mt-20 mb-8 sm:mb-12">
          <div className="text-center mb-10 sm:mb-16">
            {/* Título com tamanho responsivo */}
            <h3 className="text-4xl md:text-5xl font-bold mb-6 relative z-50 leading-tight" style={{ color: '#ffffff !important' }}>
              Perguntas <span className="text-primary">frequentes</span>
            </h3>
            <p className="text-foreground/70 max-w-2xl mx-auto text-base sm:text-lg">
              Tudo o que você precisa saber sobre nossos planos e preços
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <Accordion type="single" collapsible className="space-y-4 sm:space-y-6">
              {/* AccordionItem - Ajustado padding e border-radius */}
              <AccordionItem value="item-1" className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl px-4 py-4 sm:px-8 sm:py-6 hover:bg-white/10 transition-all duration-300">
                <AccordionTrigger className="text-base sm:text-lg font-medium text-white hover:no-underline py-0 [&[data-state=open]>svg]:rotate-180">
                  Quais são as formas de pagamento aceitas?
                </AccordionTrigger>
                <AccordionContent className="text-foreground/70 pt-3 sm:pt-4 pb-0 text-sm sm:text-base">
                  Aceitamos todas as formas de pagamento através da Asaas: cartões de crédito (Visa, Mastercard, American Express), 
                  PIX, boleto bancário e cartões de débito. Todos os pagamentos são processados de forma segura.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl px-4 py-4 sm:px-8 sm:py-6 hover:bg-white/10 transition-all duration-300">
                <AccordionTrigger className="text-base sm:text-lg font-medium text-white hover:no-underline py-0 [&[data-state=open]>svg]:rotate-180">
                  O que está incluso no plano premium?
                </AccordionTrigger>
                <AccordionContent className="text-foreground/70 pt-3 sm:pt-4 pb-0 text-sm sm:text-base">
                  O plano premium inclui: mensagens ilimitadas no Doutor IA, criação ilimitada de provas e casos clínicos, 
                  Organização de calendário com o MedCalendar, geração de flashcards com IA, e suporte prioritário 24/7.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl px-4 py-4 sm:px-8 sm:py-6 hover:bg-white/10 transition-all duration-300">
                <AccordionTrigger className="text-base sm:text-lg font-medium text-white hover:no-underline py-0 [&[data-state=open]>svg]:rotate-180">
                  Qual a diferença entre o plano gratuito e premium?
                </AccordionTrigger>
                <AccordionContent className="text-foreground/70 pt-3 sm:pt-4 pb-0 text-sm sm:text-base">
                  O plano gratuito oferece acesso limitado: 3 mensagens por dia no Doutor IA, 3 provas por mês, 
                  3 casos por mês na Casoteca e Organização de calendário com o MedCalendar (limitado). O premium remove todos os limites e adiciona recursos exclusivos 
                  como flashcards com IA e Organização de calendário com o MedCalendar.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl px-4 py-4 sm:px-8 sm:py-6 hover:bg-white/10 transition-all duration-300">
                <AccordionTrigger className="text-base sm:text-lg font-medium text-white hover:no-underline py-0 [&[data-state=open]>svg]:rotate-180">
                  Quais são os limites de uso do plano gratuito?
                </AccordionTrigger>
                <AccordionContent className="text-foreground/70 pt-3 sm:pt-4 pb-0 text-sm sm:text-base">
                  No plano gratuito você pode usar: 3 mensagens por dia no Doutor IA, criar até 3 provas por mês, 
                  3 casos clínicos por mês na Casoteca, Organização de calendário com o MedCalendar (limitado), e acesso ao Modo Foco. 
                  Os limites são renovados mensalmente.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl px-4 py-4 sm:px-8 sm:py-6 hover:bg-white/10 transition-all duration-300">
                <AccordionTrigger className="text-base sm:text-lg font-medium text-white hover:no-underline py-0 [&[data-state=open]>svg]:rotate-180">
                  Posso cancelar minha assinatura quando quiser?
                </AccordionTrigger>
                <AccordionContent className="text-foreground/70 pt-3 sm:pt-4 pb-0 text-sm sm:text-base">
                  Sim! Você pode cancelar sua assinatura a qualquer momento através do portal do cliente. 
                  Não há taxas de cancelamento e você manterá acesso até o final do período pago.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl px-4 py-4 sm:px-8 sm:py-6 hover:bg-white/10 transition-all duration-300">
                <AccordionTrigger className="text-base sm:text-lg font-medium text-white hover:no-underline py-0 [&[data-state=open]>svg]:rotate-180">
                  Os pagamentos são seguros?
                </AccordionTrigger>
                <AccordionContent className="text-foreground/70 pt-3 sm:pt-4 pb-0 text-sm sm:text-base">
                  Sim! Utilizamos a Asaas, uma das plataformas de pagamento mais seguras do mundo. 
                  Seus dados são criptografados e nunca armazenamos informações de cartão de crédito.
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Contact Support Section - Ajustado margin e padding */}
            <div className="text-center mt-12 pt-6 sm:mt-16 sm:pt-8 border-t border-white/10">
              <p className="text-foreground/70 text-base sm:text-lg mb-4 sm:mb-6">
                Ainda tem dúvidas sobre nossos planos?
              </p>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white px-6 sm:px-8 py-3 rounded-xl font-medium text-base sm:text-lg"
                onClick={() => window.open('https://wa.me/5514981899898?text=Olá%2C%20estou%20com%20uma%20dúvida%20para%20comprar%20o%20MedVoa%20Premium%21', '_blank')}
              >
                🎧 Falar com Suporte
              </Button>
            </div>
          </div>
        </div>

        {/* Final CTA Section - Ajustado padding e margin */}
        <div className="mt-16 sm:mt-20 mb-8 sm:mb-12">
          <div className="max-w-4xl mx-auto">
            <Card className="glass-card border-primary/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
              <CardContent className="relative z-10 text-center py-10 sm:py-16 px-4 sm:px-8">
                {/* Título com tamanho responsivo */}
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                  Pronto para melhorar suas notas?
                </h3>
                <p className="text-foreground/80 text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Junte-se a mais de <span className="text-primary font-semibold">9.300 estudantes</span> que já transformaram seus estudos. 
                  <span className="text-primary font-semibold"> Conheça nossa história</span> e veja todas as <span className="text-primary font-semibold">funcionalidades disponíveis</span>.
                </p>
                
                {/* Botão com tamanho responsivo */}
                <Button 
                  className="btn-glow px-8 sm:px-12 py-5 sm:py-6 text-lg sm:text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 mb-6 sm:mb-8"
                  onClick={() => {
                    const plansSection = document.getElementById('plans-section');
                    plansSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Crown className="w-5 h-5 sm:w-6 sm:h-6 mr-3" />
                  Começar 7 Dias Grátis
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-3" />
                </Button>

                {/* Lista de benefícios com flex-wrap para mobile */}
                <div className="flex items-center justify-center flex-wrap gap-4 text-sm text-foreground/70">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span>Sem compromisso</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span>Cancele quando quiser</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span>Suporte 24/7</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>;
};