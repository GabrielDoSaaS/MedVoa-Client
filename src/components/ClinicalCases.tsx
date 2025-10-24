import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Stethoscope, Play, BookOpen, Brain, Target, Zap, Check, ChevronsUpDown } from "lucide-react";
import { PatientChatInterface } from "./PatientChatInterface";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { UsageBanner } from "@/components/ui/usage-banner";
import { FeatureBlocker } from "@/components/ui/feature-blocker";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Input } from "@/components/ui/input"; 

// NOVO: Interface para os dados de uso salvos no localStorage
interface CasesUsageData {
  count: number;
  month: string; // Formato YYYY-MM
}

/**
 * Função para gerar um código aleatório (simulando um UUID ou string única)
 * @returns string
 */
const generateRandomCode = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// --- NOVAS FUNÇÕES DE CONTROLE DE USO NO LOCALSTORAGE ---

/**
 * Obtém o mês atual no formato YYYY-MM
 */
const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Obtém o uso de casos do localStorage
 */
const getCasesUsageFromStorage = (): CasesUsageData => {
  const stored = localStorage.getItem('clinical_cases_monthly_usage');
  if (stored) {
    const data: CasesUsageData = JSON.parse(stored);
    // Verifica se os dados são do mês atual
    if (data.month === getCurrentMonth()) {
      return data;
    }
  }
  // Retorna dados padrão se não houver dados ou se for de outro mês
  return { count: 0, month: getCurrentMonth() };
};

/**
 * Salva o uso de casos no localStorage
 */
const saveCasesUsageToStorage = (count: number): void => {
  const data: CasesUsageData = {
    count,
    month: getCurrentMonth()
  };
  localStorage.setItem('clinical_cases_monthly_usage', JSON.stringify(data));
};

/**
 * Incrementa o contador de casos no localStorage
 */
const incrementCasesUsage = (): number => {
  const currentUsage = getCasesUsageFromStorage();
  const newCount = currentUsage.count + 1;
  saveCasesUsageToStorage(newCount);
  return newCount;
};

/**
 * Verifica se o usuário pode usar o recurso baseado no limite mensal
 */
const canUseCases = (isPremium: boolean): boolean => {
  if (isPremium) return true;
  const currentUsage = getCasesUsageFromStorage();
  return currentUsage.count < 3;
};

/**
 * Obtém o número de casos restantes
 */
const getRemainingCases = (isPremium: boolean): number => {
  if (isPremium) return Infinity;
  const currentUsage = getCasesUsageFromStorage();
  return Math.max(0, 3 - currentUsage.count);
};

interface ClinicalCasesProps {
  user: SupabaseUser | null;
  onUpgrade?: () => void;
  isPremium?: boolean; // NOVA PROP: recebe o status premium do componente pai
}

export const ClinicalCases = ({
  user,
  onUpgrade,
  isPremium = false
}: ClinicalCasesProps) => {
  const {
    canUseFeature,
    getRemainingUsage,
    incrementUsage,
    subscription
  } = useSubscription(user);
  
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCase, setCurrentCase] = useState<any>(null);
  const [caseStep, setCaseStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState<any>({});
  const [codeChat, setCodeChat] = useState<string>(""); 
  const [casesUsage, setCasesUsage] = useState<CasesUsageData>({ count: 0, month: getCurrentMonth() }); // NOVO: Estado para uso

  // NOVO: Carrega o uso de casos do localStorage na inicialização
  useEffect(() => {
    const usage = getCasesUsageFromStorage();
    setCasesUsage(usage);
  }, []);

  const levels = [{
    value: "student_1_2",
    label: "Estudante de Medicina 1º e 2º Ano"
  }, {
    value: "student_3_4", 
    label: "Estudante de Medicina 3º e 4º Ano"
  }, {
    value: "student_5_6",
    label: "Estudante de Medicina 5º e 6º Ano"
  }, {
    value: "resident",
    label: "Residente"
  }, {
    value: "specialist",
    label: "Especialista"
  }];
  
  const specialties = [
    "Acupuntura",
    "Alergia e Imunologia", 
    "Anatomia Patológica",
    "Anestesiologia",
    "Angioradiologia",
    "Cardiologia",
    "Cardiologia Pediátrica",
    "Cirurgia Cardiovascular",
    "Cirurgia de Cabeça e Pescoço",
    "Cirurgia Geral",
    "Cirurgia Pediátrica",
    "Cirurgia Plástica",
    "Cirurgia Torácica",
    "Cirurgia Vascular",
    "Clínica Médica",
    "Coloproctologia",
    "Densitometria Óssea",
    "Dermatologia",
    "Ecocardiografia",
    "Eletrofisiologia",
    "Endocrinologia",
    "Gastroenterologia",
    "Genética Médica",
    "Geriatria",
    "Ginecologia e Obstetrícia",
    "Hematologia",
    "Hemodinâmica",
    "Hepatologia",
    "Homeopatia",
    "Imunologia",
    "Infectologia",
    "Mastologia",
    "Medicina de Emergência",
    "Medicina de Família",
    "Medicina do Trabalho",
    "Medicina Esportiva",
    "Medicina Fetal",
    "Medicina Física e Reabilitação",
    "Medicina Intensiva",
    "Medicina Legal",
    "Medicina Nuclear",
    "Medicina Preventiva",
    "Nefrologia",
    "Neonatologia",
    "Neurocirurgia",
    "Neurologia",
    "Neurologia Pediátrica",
    "Nutrologia",
    "Oftalmologia",
    "Oncologia",
    "Ortopedia e Traumatologia",
    "Otorrinolaringologia",
    "Patologia",
    "Pediatria",
    "Pneumologia",
    "Psiquiatria",
    "Psiquiatria da Infância",
    "Radiologia",
    "Radioterapia",
    "Reprodução Humana",
    "Reumatologia",
    "Toxicologia",
    "Urologia"
  ];

  // Função initChat ajustada para receber o codeChat
  const initChat = async (levelKnowledge: string, medicalSpecialty: string, codeChat: string) => {
    const email = user?.email; 

    try {
        await axios.post('http://localhost:3000/api/create-chat', JSON.stringify({
          email, 
          levelKnowledge, 
          medicalSpecialty,
          codeChat
        }), 
        {
          headers: {"Content-Type": "application/json"}
        });
        console.log("Chat iniciado com sucesso. Code:", codeChat);
    } catch (error) {
        console.error("Erro ao iniciar o chat:", error);
    }
  }

  const generateClinicalCase = (specialty: string, level: string) => {
    const caseTemplates = {
      "Cardiologia": {
        "student_1_2": {
          title: "Dor Torácica em Adulto Jovem",
          patient: {
            name: "João Silva",
            age: 28,
            gender: "Masculino",
            complaint: "Sinto dor no peito há algumas horas"
          },
          symptoms: "A dor começou depois que eu corri muito hoje cedo. É como se alguém estivesse apertando meu peito.",
          history: "Não tenho histórico de doenças graves. Minha família tem alguns problemas do coração.",
          medications: "Não tomo nada regularmente, doutor.",
          familyHistory: "Meu pai teve infarto aos 50 anos.",
          diagnosis: "dor muscular"
        },
        "student_3_4": {
          title: "Síndrome Coronariana em Paciente de Risco",
          patient: {
            name: "Maria Santos",
            age: 55,
            gender: "Feminino", 
            complaint: "Estou com dor forte no peito há 1 hora"
          },
          symptoms: "A dor é muito forte, parece que algo está esmagando meu peito. Estou suando muito e com náusea.",
          history: "Sou diabética há 10 anos e tenho pressão alta. Fumo um maço por dia há 30 anos.",
          medications: "Tomo metformina e losartana.",
          familyHistory: "Minha mãe morreu de infarto.",
          diagnosis: "infarto"
        },
        "resident": {
          title: "IAM com Complicações",
          patient: {
            name: "Carlos Oliveira",
            age: 65,
            gender: "Masculino",
            complaint: "Dor no peito muito forte há 2 horas"
          },
          symptoms: "Dor retroesternal em aperto, irradiando para braço esquerdo e mandíbula. Sudorese fria profusa.",
          history: "Diabético, hipertenso, dislipidêmico. IAM prévio há 3 anos. Bypass há 2 anos.",
          medications: "AAS, atorvastatina, metoprolol, enalapril.",
          familyHistory: "Família com múltiplos eventos cardiovasculares.",
          diagnosis: "reinfarto"
        }
      },
      "Neurologia": {
        "student_1_2": {
          title: "Cefaleia em Universitária",
          patient: {
            name: "Ana Paula",
            age: 22,
            gender: "Feminino",
            complaint: "Estou com dor de cabeça há 2 dias"
          },
          symptoms: "A dor é pulsante, só do lado esquerdo. Tenho enjoo e a luz me incomoda muito.",
          history: "Isso acontece todo mês, geralmente antes da menstruação. Não tenho outras doenças.",
          medications: "Só tomo anticoncepcional.",
          familyHistory: "Minha mãe também tem muita dor de cabeça.",
          diagnosis: "enxaqueca"
        }
      }
    };

    const levelMap = {
      "student_1_2": "student_1_2",
      "student_3_4": "student_3_4", 
      "student_5_6": "resident",
      "resident": "resident",
      "specialist": "resident"
    };

    const mappedLevel = levelMap[level as keyof typeof levelMap] || "student_1_2";
    const specialtyData = caseTemplates[specialty as keyof typeof caseTemplates];
    
    if (!specialtyData) {
      return {
        title: `Caso Clínico - ${specialty}`,
        patient: {
          name: "Paciente",
          age: 45,
          gender: "Masculino",
          complaint: "Procurei ajuda médica"
        },
        symptoms: "Tenho alguns sintomas que me preocupam.",
        history: "Não tenho histórico significativo de doenças.",
        medications: "Não tomo medicações regularmente.",
        familyHistory: "Sem histórico familiar relevante.",
        diagnosis: "consulta de rotina"
      };
    }
    
    return specialtyData[mappedLevel as keyof typeof specialtyData] || specialtyData.student_1_2;
  };

  // Função handleGenerateCase modificada para usar o sistema de localStorage
  const handleGenerateCase = async () => {
    if (!selectedLevel || !selectedSpecialty) return;
    
    // NOVO: Verificação de uso usando localStorage
    if (!isPremium && !canUseCases(isPremium)) {
      alert("Você atingiu o limite de 3 casos clínicos por mês. Faça upgrade para Premium para casos ilimitados!");
      return;
    }

    setIsGenerating(true);

    // Gerar e armazenar o código único para o chat
    const newCodeChat = generateRandomCode();
    setCodeChat(newCodeChat);

    // 1. Chamar a função initChat para registrar o início do caso no backend
    await initChat(selectedLevel, selectedSpecialty, newCodeChat);

    // Simular tempo de geração
    setTimeout(() => {
      const newCase = generateClinicalCase(selectedSpecialty, selectedLevel); 
      if (newCase) {
        setCurrentCase(newCase);
        setCaseStep(1);
        setUserAnswers({});
        
        // NOVO: Só incrementa o uso se não for premium
        if (!isPremium) {
          const newCount = incrementCasesUsage();
          setCasesUsage({ count: newCount, month: getCurrentMonth() });
        }
      }
      setIsGenerating(false);
    }, 2000);
  };

  const handleAnswer = (questionIndex: number, answerIndex: number) => {
    setUserAnswers({
      ...userAnswers,
      [questionIndex]: answerIndex
    });
  };

  const resetCase = () => {
    setCurrentCase(null);
    setCaseStep(0);
    setUserAnswers({});
  };

  if (currentCase && caseStep > 0) {
    return (
      <PatientChatInterface
        caseData={currentCase}
        selectedLevel={levels.find(l => l.value === selectedLevel)?.label || selectedLevel}
        selectedSpecialty={selectedSpecialty}
        codeChat={codeChat}
        onBack={resetCase}
      />
    );
  }

  // NOVO: Obtém o número de casos restantes
  const remainingCases = getRemainingCases(isPremium);
  const canUse = canUseCases(isPremium);
  
  const content = <div className="min-h-screen relative">
      {/* Usage Banner - Só exibe se não for premium */}
      {!isPremium && (
        <UsageBanner 
          featureType="casos" 
          remaining={remainingCases} 
          total={3} 
          resetPeriod="mensalmente" 
          onUpgrade={() => onUpgrade?.()} 
          isPremium={isPremium} 
        />
      )}
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">

        {/* Título principal */}
        <div className="text-center mb-6 mt-4">
          <h1 className="font-bold text-white mb-2 text-4xl">Casoteca</h1>
          <p className="text-foreground/70 text-lg mb-8">Estude casos clínicos reais</p>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto rounded-full mt-6"></div>
        </div>

        {/* Case Generator */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 flex items-center justify-center">
              <Brain className="w-10 h-10 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Gerar Caso Clínico</h2>
              <p className="text-foreground/70 text-sm">Selecione seu nível e especialidade para gerar um caso personalizado</p>
            </div>
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium mb-3 block text-foreground">Nível de Conhecimento *</label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="input-glass w-full justify-between h-11 text-foreground border-border-glass bg-background/60 backdrop-blur-sm hover:bg-background/80 focus:ring-2 focus:ring-primary/50 transition-all duration-200">
                    <SelectValue placeholder="Selecione seu nível" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    {levels.map(level => <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block text-foreground">Especialidade Médica *</label>
                <Input
                  value={selectedSpecialty}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedSpecialty(e.target.value)}
                  placeholder="Digite a especialidade (ex: Cardiologia)"
                  className="input-glass w-full h-11 text-foreground border-border-glass bg-background/60 backdrop-blur-sm hover:bg-background/80 focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                />
              </div>
            </div>

            <div className="glass-card p-6 mt-6 mb-6">
              <h4 className="font-semibold text-foreground mb-3 flex items-center">
                <Target className="w-5 h-5 mr-2 text-primary" />
                Como Funciona a Simulação de Paciente:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-foreground/80">
                <div className="space-y-2">
                  <p>• <strong>Chat Interativo:</strong> Converse com um paciente virtual</p>
                  <p>• <strong>Anamnese Livre:</strong> Faça as perguntas que desejar</p>
                  <p>• <strong>Caso Realista:</strong> Baseado no nível e especialidade</p>
                </div>
                <div className="space-y-2">
                  <p>• <strong>Diagnóstico:</strong> Tente descobrir o que o paciente tem</p>
                  <p>• <strong>Feedback:</strong> Avaliação do seu desempenho</p>
                  <p>• <strong>Pontuação:</strong> Score baseado nas perguntas e acerto</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleGenerateCase} 
              disabled={!selectedLevel || !selectedSpecialty || isGenerating || (!isPremium && !canUse)} 
              variant="glow" 
              className="w-full h-12"
            >
              {isGenerating ? <>
                  <Zap className="w-5 h-5 mr-2 animate-spin" />
                  Gerando caso clínico...
                </> : <>
                  <Play className="w-5 h-5 mr-2" />
                  {isPremium ? "Gerar Caso Clínico" : `Gerar Caso Clínico (${remainingCases} restantes)`}
                </>}
            </Button>

            {!selectedLevel || !selectedSpecialty && <p className="text-center text-sm text-gray-500 mt-3">
                Selecione seu nível e especialidade para gerar um caso personalizado
              </p>}
        </div>
      </div>
    </div>;

  // FeatureBlocker para quando atingir o limite mensal
  if (!isPremium && !canUse) {
    return (
      <FeatureBlocker 
        title="Limite Mensal Atingido" 
        description="Você atingiu o limite de 3 casos clínicos por mês no plano grátis. Assine o Premium para casos ilimitados!" 
        onUpgrade={() => onUpgrade?.()}
      >
        {content}
      </FeatureBlocker>
    );
  }

  return content;
};