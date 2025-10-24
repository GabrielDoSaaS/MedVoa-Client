import { useState, useCallback, FormEvent, useEffect } from "react";
import { CreditCard, DollarSign, Calendar, Lock, User, Mail, Zap, X, Loader2, CheckCircle, Package, ArrowLeft, Phone, MapPin } from "lucide-react";
// Assumindo que '@/components/ui/*' são componentes shadcn/ui
import { Button } from "@/components/ui/button"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";

// ---------------------------------------------------------------------
// TIPOS E CONSTANTES
// ---------------------------------------------------------------------

interface Plan {
    cycle: 'MONTHLY' | 'YEARLY' | 'SEMIANNUAL';
    name: string;
    description: string;
    value: number;
    billingText: string;
}

const PLANS: Plan[] = [
    { cycle: 'MONTHLY', name: 'Plano Mensal', description: 'Acesso completo, pague por mês.', value: 69.90, billingText: 'por mês' },
    { cycle: 'SEMIANNUAL', name: 'Plano Semestral', description: 'Economize 15% pagando a cada 6 meses.', value: 359.40, billingText: 'a cada 6 meses (R$ 59.90/mês)' },
    { cycle: 'YEARLY', name: 'Plano Anual', description: 'O melhor custo-benefício: 2 meses grátis.', value: 598.80, billingText: 'por ano (R$ 49.90/mês)' },
];

interface AsaasCheckoutProps {
    userEmail: string; 
    selectedPlanCycle: 'MONTHLY' | 'YEARLY' | 'SEMIANNUAL';
    selectedPlanDescription: string;
    onBack: () => void; 
    // Propriedade opcional para o endpoint, se for diferente de '/payment'
    apiEndpoint?: string; 
}

// ---------------------------------------------------------------------
// FUNÇÕES AUXILIARES (Máscaras de Input)
// ---------------------------------------------------------------------

// Função utilitária para formatar o valor de entrada
const formatInput = (value: string, pattern: string) => {
    let clean = value.replace(/\D/g, ''); // Remove todos os não-dígitos
    let formatted = '';
    let patternIndex = 0;
    
    for (let i = 0; i < clean.length && patternIndex < pattern.length; patternIndex++) {
        if (pattern[patternIndex] === '#') {
            formatted += clean[i];
            i++;
        } else {
            formatted += pattern[patternIndex];
        }
    }
    return formatted;
};

// Handler genérico para atualização de estado com formatação
const useInputHandler = (
    key: keyof typeof initialCardData, 
    pattern: string | null = null, 
    setCardData: React.Dispatch<React.SetStateAction<typeof initialCardData>>
) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value;
    if (pattern) {
        value = formatInput(value, pattern);
    }
    setCardData(prev => ({ ...prev, [key]: value }));
};


// ---------------------------------------------------------------------
// ESTADO INICIAL COMPLETO
// ---------------------------------------------------------------------
const initialCardData = {
    // Dados do Cliente (Necessários para AsaasController)
    name: '',
    email: '', // Preenchido por prop
    cpfCnpj: '',
    phone: '', // NOVO CAMPO
    postalCode: '', // NOVO CAMPO
    address: '', // NOVO CAMPO (Rua/Avenida)
    addressNumber: '', // NOVO CAMPO (Número)
    
    // Dados do Cartão (Necessários para AsaasController)
    cardHolderName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
};


// ---------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------

export const AsaasTransparentCheckout = ({ 
    userEmail = "", 
    selectedPlanCycle,
    selectedPlanDescription,
    onBack,
    apiEndpoint = "http://localhost:3000/api/payment" // Endpoint padrão ajustado para a rota fornecida
}: AsaasCheckoutProps) => {
    
    // --- Dados do Plano e Loading ---
    const initialPlan = PLANS.find(p => p.cycle === selectedPlanCycle) || PLANS[0];
    const [selectedPlan, setSelectedPlan] = useState<Plan>(initialPlan); 
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Dados do Cliente/Cartão (Tokenização Conceitual) ---
    const [cardData, setCardData] = useState({
        ...initialCardData,
        email: userEmail, // Garante que o email do usuário logado é o inicial
    });

    // Efeito para garantir que o plano inicial e o email sejam aplicados
    useEffect(() => {
        const plan = PLANS.find(p => p.cycle === selectedPlanCycle);
        if (plan) {
            setSelectedPlan(plan);
        }
        if (userEmail) {
            setCardData(prev => ({ ...prev, email: userEmail }));
        }
    }, [selectedPlanCycle, userEmail]);

    // --- Handlers com Máscara ---
    const handleCpfCnpjInput = useInputHandler('cpfCnpj', '##.###.###/####-##', setCardData); // Suporta o formato mais longo
    const handlePhoneInput = useInputHandler('phone', '(##) #####-####', setCardData);
    const handlePostalCodeInput = useInputHandler('postalCode', '#####-###', setCardData);
    const handleCardNumberInput = useInputHandler('cardNumber', '#### #### #### ####', setCardData);
    const handleExpiryMonthInput = useInputHandler('expiryMonth', '##', setCardData);
    const handleExpiryYearInput = useInputHandler('expiryYear', '####', setCardData);
    const handleCcvInput = useInputHandler('ccv', '####', setCardData);


    // Função que agora chama a rota /payment com o payload correto
    const handleSubmit = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        // Função para remover máscaras e obter o valor limpo
        const getCleanValue = (key: keyof typeof cardData) => cardData[key].replace(/\D/g, '');

        // 🚨 Estruturar o payload EXATAMENTE como o AsaasController espera
        const payload = {
            // 1. DADOS DO CLIENTE (customer)
            customer: {
                name: cardData.name,
                email: cardData.email,
                cpfCnpj: getCleanValue('cpfCnpj'),
                phone: getCleanValue('phone'),
                postalCode: getCleanValue('postalCode'),
                address: cardData.address,
                addressNumber: cardData.addressNumber,
            },
            
            // 2. DADOS DO CARTÃO (creditCard)
            creditCard: {
                holderName: cardData.cardHolderName,
                number: cardData.cardNumber.replace(/\s/g, ''), // Remover apenas espaços
                expiryMonth: cardData.expiryMonth,
                expiryYear: cardData.expiryYear,
                ccv: cardData.ccv,
            },

            // 3. INFORMAÇÕES DO TITULAR (creditCardHolderInfo) - Replicando os dados do cliente
            creditCardHolderInfo: {
                name: cardData.name,
                email: cardData.email,
                cpfCnpj: getCleanValue('cpfCnpj'),
                postalCode: getCleanValue('postalCode'),
                addressNumber: cardData.addressNumber,
                address: cardData.address,
                phone: getCleanValue('phone'),
            },

            // 4. DADOS DO PLANO (plan)
            plan: {
                cycle: selectedPlan.cycle,
                value: selectedPlan.value,
                description: selectedPlan.description,
            },
        };

        try {
            // =================================================================
            // ALTERAÇÃO CRUCIAL: Mudar o endpoint para a rota de pagamento
            // =================================================================
            const response = await axios.post(apiEndpoint, payload, {
                headers: { 'Content-Type': 'application/json' },
            });
            // =================================================================

            if (response.status === 200) {
                setIsSuccess(true);
            }

        } catch (err: any) {
            console.error('Erro no checkout transparente:', err);
            let detail = 'Verifique seus dados de pagamento e tente novamente.';
            
            // Tenta extrair a mensagem de erro da Asaas (vem do Controller)
            const asaasError = err.response?.data?.error?.errors?.[0]?.description;
            if (asaasError) {
                detail = asaasError;
            } else if (err.response?.data?.error) {
                detail = JSON.stringify(err.response.data.error);
            } else if (err.message === 'Network Error') {
                detail = 'Erro de conexão com o servidor. Tente novamente mais tarde.';
            }

            setError(`Pagamento falhou. ${detail}.`);
        } finally {
            setIsLoading(false);
        }
    }, [cardData, selectedPlan, apiEndpoint]);

    // Lógica para formatar e limitar o ano
    const currentYear = new Date().getFullYear();
    // Exibe os próximos 10 anos
    const years = Array.from({ length: 10 }, (_, i) => String(currentYear + i));

    // Exibe o conteúdo de sucesso
    if (isSuccess) {
        return (
            <div className="glass-card p-8 text-center max-w-lg mx-auto border-4 border-green-500/50 rounded-xl shadow-2xl">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6 animate-pulse" />
                <CardTitle className="text-2xl font-bold mb-3">Parabéns! Sua Assinatura foi Ativada.</CardTitle>
                <CardDescription className="text-foreground/70 mb-6">
                    O pagamento foi processado com sucesso para o **{selectedPlan.name}**. O período de teste de 7 dias será aplicado.
                </CardDescription>
                <Button onClick={onBack} className="btn-glow bg-green-600 hover:bg-green-700">
                    Ir para o Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl relative">
            
            {/* BOTÃO DE VOLTAR */}
            <Button variant="ghost" onClick={onBack} className="absolute top-8 left-8 btn-glass hover:bg-primary/20 text-white/80">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Planos
            </Button>
            
            <div className="text-center mb-10 mt-16">
                <h1 className="text-4xl font-extrabold text-foreground mb-4 flex items-center justify-center space-x-3">
                    <CreditCard className="w-8 h-8 text-primary" />
                    <span>Checkout Asaas</span>
                </h1>
                <p className="text-lg text-foreground/70 max-w-xl mx-auto">
                    Finalize a assinatura do **{selectedPlan.name}** com **7 dias de teste grátis**!
                </p>
                <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto rounded-full mt-4"></div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
                
                {/* 1. SELEÇÃO DE PLANO / RESUMO DO PEDIDO */}
                <Card className="lg:w-1/3 glass-card p-6 h-fit border-l-4 border-l-primary/70 shadow-xl">
                    <CardHeader className="p-0 mb-4">
                        <CardTitle className="text-xl flex items-center space-x-2 text-primary">
                            <Package className="w-5 h-5" />
                            <span>Seu Pedido</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Ciclo de Cobrança</label>
                            <Select 
                                value={selectedPlan.cycle}
                                onValueChange={(value) => {
                                    const plan = PLANS.find(p => p.cycle === value);
                                    if (plan) setSelectedPlan(plan);
                                }}
                            >
                                <SelectTrigger className="bg-background/40 border-primary/30 focus:ring-primary">
                                    <SelectValue placeholder="Selecione o plano" />
                                </SelectTrigger>
                                <SelectContent className="glass-card">
                                    {PLANS.map(plan => (
                                        <SelectItem key={plan.cycle} value={plan.cycle}>
                                            {plan.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="border-t border-primary/20 pt-4 space-y-2">
                            <p className="text-sm text-yellow-400 font-semibold flex items-center space-x-1">
                                <Zap className="w-4 h-4" />
                                <span>Período de Teste: 7 dias grátis!</span>
                            </p>
                            <div className="flex justify-between text-lg font-semibold text-foreground">
                                <span>Total a Pagar Agora:</span>
                                <span className="text-primary">R$ 0,00</span>
                            </div>
                            <p className="text-xs text-foreground/60">
                                Após 7 dias, será cobrado R$ {selectedPlan.value.toFixed(2).replace('.', ',')} {selectedPlan.billingText}.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. DADOS DO CLIENTE, ENDEREÇO E DO CARTÃO (MAIOR PARTE) */}
                <Card className="lg:w-2/3 glass-card p-6 border-l-4 border-l-accent/70 shadow-xl">
                    <CardHeader className="p-0 mb-6">
                        <CardTitle className="text-xl flex items-center space-x-2 text-white"> 
                            <User className="w-5 h-5" />
                            <span>Informações do Assinante</span>
                        </CardTitle>
                        <CardDescription className="text-sm text-foreground/70">
                            Estes dados serão usados para criar seu cadastro de cliente na Asaas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 space-y-6">
                        
                        {/* Dados Pessoais */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium text-foreground">Nome Completo *</label>
                                <div className="relative">
                                    <Input 
                                        id="name"
                                        type="text" 
                                        required
                                        value={cardData.name} 
                                        onChange={(e) => setCardData({...cardData, name: e.target.value})} 
                                        placeholder="Seu nome"
                                        className="bg-background/40 border-accent/30 focus-visible:ring-accent pl-10"
                                    />
                                    <User className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-foreground">E-mail *</label>
                                <div className="relative">
                                    <Input 
                                        id="email"
                                        type="email" 
                                        required
                                        value={cardData.email} 
                                        onChange={(e) => setCardData({...cardData, email: e.target.value})} 
                                        placeholder="seu.email@exemplo.com"
                                        className="bg-background/40 border-accent/30 focus-visible:ring-accent pl-10"
                                        disabled={!!userEmail} // Desabilita se o email for passado por prop
                                    />
                                    <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50" />
                                </div>
                            </div>
                            <div className="space-y-2 col-span-1 sm:col-span-2">
                                <label htmlFor="cpfCnpj" className="text-sm font-medium text-foreground">CPF/CNPJ *</label>
                                <div className="relative">
                                    <Input 
                                        id="cpfCnpj"
                                        type="text" 
                                        required
                                        maxLength={18} // 14 para CPF, 18 para CNPJ
                                        value={cardData.cpfCnpj} 
                                        onChange={handleCpfCnpjInput} 
                                        placeholder="00.000.000/0000-00"
                                        className="bg-background/40 border-accent/30 focus-visible:ring-accent pl-10"
                                    />
                                    <Zap className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50" />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-accent/20 my-4" />

                        {/* NOVO: Dados de Contato e Endereço */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                                <MapPin className="w-4 h-4" />
                                <span>Endereço e Contato</span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                
                                {/* Telefone */}
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-medium text-foreground">Telefone *</label>
                                    <div className="relative">
                                        <Input 
                                            id="phone"
                                            type="tel" 
                                            required
                                            maxLength={15} // (99) 99999-9999
                                            value={cardData.phone} 
                                            onChange={handlePhoneInput}
                                            placeholder="(00) 90000-0000"
                                            className="bg-background/40 border-accent/30 focus-visible:ring-accent pl-10"
                                        />
                                        <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50" />
                                    </div>
                                </div>

                                {/* CEP */}
                                <div className="space-y-2">
                                    <label htmlFor="postalCode" className="text-sm font-medium text-foreground">CEP *</label>
                                    <Input 
                                        id="postalCode"
                                        type="text" 
                                        required
                                        maxLength={9} // 00000-000
                                        value={cardData.postalCode} 
                                        onChange={handlePostalCodeInput}
                                        placeholder="00000-000"
                                        className="bg-background/40 border-accent/30 focus-visible:ring-accent"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                                {/* Endereço/Rua */}
                                <div className="space-y-2 col-span-2">
                                    <label htmlFor="address" className="text-sm font-medium text-foreground">Endereço (Rua/Avenida) *</label>
                                    <Input 
                                        id="address"
                                        type="text" 
                                        required
                                        value={cardData.address} 
                                        onChange={(e) => setCardData({...cardData, address: e.target.value})} 
                                        placeholder="Rua Exemplo"
                                        className="bg-background/40 border-accent/30 focus-visible:ring-accent"
                                    />
                                </div>
                                
                                {/* Número */}
                                <div className="space-y-2 col-span-1">
                                    <label htmlFor="addressNumber" className="text-sm font-medium text-foreground">Número *</label>
                                    <Input 
                                        id="addressNumber"
                                        type="text" 
                                        required
                                        value={cardData.addressNumber} 
                                        onChange={(e) => setCardData({...cardData, addressNumber: e.target.value})} 
                                        placeholder="123"
                                        className="bg-background/40 border-accent/30 focus-visible:ring-accent"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-accent/20 my-4" />

                        {/* Dados do Cartão */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                                <CreditCard className="w-4 h-4" />
                                <span>Dados do Cartão</span>
                            </h3>

                            <div className="space-y-2">
                                <label htmlFor="cardHolderName" className="text-sm font-medium text-foreground">Nome Impresso no Cartão *</label>
                                <Input 
                                    id="cardHolderName"
                                    type="text" 
                                    required
                                    value={cardData.cardHolderName} 
                                    onChange={(e) => setCardData({...cardData, cardHolderName: e.target.value})} 
                                    placeholder="Ex: JOAO M. SILVA"
                                    className="bg-background/40 border-accent/30 focus-visible:ring-accent"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="cardNumber" className="text-sm font-medium text-foreground">Número do Cartão *</label>
                                <Input 
                                    id="cardNumber"
                                    type="text" 
                                    required
                                    maxLength={19}
                                    value={cardData.cardNumber} 
                                    onChange={handleCardNumberInput} 
                                    placeholder="XXXX XXXX XXXX XXXX"
                                    className="bg-background/40 border-accent/30 focus-visible:ring-accent"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="expiryMonth" className="text-sm font-medium text-foreground">Mês Venc. *</label>
                                    <Input 
                                        id="expiryMonth"
                                        type="text" 
                                        required
                                        maxLength={2}
                                        value={cardData.expiryMonth} 
                                        onChange={handleExpiryMonthInput} 
                                        placeholder="MM"
                                        className="bg-background/40 border-accent/30 focus-visible:ring-accent"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="expiryYear" className="text-sm font-medium text-foreground">Ano Venc. *</label>
                                    <Select 
                                        value={cardData.expiryYear}
                                        onValueChange={(value) => setCardData(prev => ({...prev, expiryYear: value}))}
                                    >
                                        <SelectTrigger className="bg-background/40 border-accent/30 focus:ring-accent">
                                            <SelectValue placeholder="AAAA" />
                                        </SelectTrigger>
                                        <SelectContent className="glass-card">
                                            {years.map(year => (
                                                <SelectItem key={year} value={year}>{year}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="ccv" className="text-sm font-medium text-foreground">CCV *</label>
                                    <div className="relative">
                                        <Input 
                                            id="ccv"
                                            type="text" 
                                            required
                                            maxLength={4}
                                            value={cardData.ccv} 
                                            onChange={handleCcvInput} 
                                            placeholder="123"
                                            className="bg-background/40 border-accent/30 focus-visible:ring-accent pl-10"
                                        />
                                        <Lock className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50" />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                    
                    {/* Botão de Pagamento e Feedback */}
                    <div className="mt-8">
                        {error && (
                            <div className="p-3 bg-red-500/20 text-red-300 rounded-xl flex items-start space-x-2 mb-4 border border-red-500/50 shadow-md">
                                <X className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}
                        
                        <Button 
                            type="submit" 
                            className="w-full btn-glow bg-primary hover:bg-primary/90 text-lg py-6 flex items-center justify-center space-x-3 transition duration-200"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Criando Assinatura...</span>
                                </>
                            ) : (
                                <>
                                    <span>Assinar {selectedPlan.name} Agora</span>
                                    <DollarSign className="w-5 h-5 ml-1" />
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-center text-foreground/50 mt-2">
                            Seu pagamento é processado pela Asaas. Nenhum valor será cobrado hoje devido ao período de teste.
                        </p>
                    </div>
                </Card>
            </form>
        </div>
    );
};
