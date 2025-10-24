import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Clock, Target, Trophy, RotateCcw, CheckCircle, XCircle, BookOpen, Brain, ArrowRight, FileText, Target as TargetIcon, Label, LogOut, Crown } from "lucide-react";
import { UsageBanner } from "@/components/ui/usage-banner";
import { FeatureBlocker } from "@/components/ui/feature-blocker";
import { useSubscription } from "@/hooks/useSubscription";
import axios from "axios";

// NOVO: Interface AppUser para compatibilidade com o objeto de usuário que vem do AuthPage/Index.tsx
export interface AppUser {
  email: string;
  user_metadata: {
    isPremium: boolean;
    [key: string]: any; 
  };
  [key: string]: any; 
}

const API_BASE_URL = 'http://localhost:3000/api';

// NOVO: Interface para os dados de uso salvos no localStorage
interface QuizUsageData {
  count: number;
  month: string; // Formato YYYY-MM
}

interface QuizInterfaceProps {
  user?: AppUser | null; 
  onUpgrade?: () => void;
  isPremium?: boolean; // NOVA PROP: recebe o status premium do componente pai
}

// Interface da questão
interface Question {
  id: number;
  question: string;
  options: string[]; // [texto da alternativa 1, texto da alternativa 2, ...]
  correct: number; // Índice da alternativa correta (0, 1, 2, 3)
  difficulty: "Fácil" | "Médio" | "Difícil";
  subject: string;
}

/**
 * Interface do retorno do backend, que agora deve ser o array de questões 
 * (ou um objeto contendo a chave `questions`).
 */
interface BackendQuestion {
    pergunta: string;
    alternativas: { texto: string; correta: boolean }[];
}

// --- NOVAS FUNÇÕES DE CONTROLE DE USO NO LOCALSTORAGE ---

/**
 * Obtém o mês atual no formato YYYY-MM
 */
const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Obtém o uso de provas do localStorage
 */
const getQuizUsageFromStorage = (): QuizUsageData => {
  const stored = localStorage.getItem('quiz_monthly_usage');
  if (stored) {
    const data: QuizUsageData = JSON.parse(stored);
    // Verifica se os dados são do mês atual
    if (data.month === getCurrentMonth()) {
      return data;
    }
  }
  // Retorna dados padrão se não houver dados ou se for de outro mês
  return { count: 0, month: getCurrentMonth() };
};

/**
 * Salva o uso de provas no localStorage
 */
const saveQuizUsageToStorage = (count: number): void => {
  const data: QuizUsageData = {
    count,
    month: getCurrentMonth()
  };
  localStorage.setItem('quiz_monthly_usage', JSON.stringify(data));
};

/**
 * Incrementa o contador de provas no localStorage
 */
const incrementQuizUsage = (): number => {
  const currentUsage = getQuizUsageFromStorage();
  const newCount = currentUsage.count + 1;
  saveQuizUsageToStorage(newCount);
  return newCount;
};

/**
 * Verifica se o usuário pode usar o recurso baseado no limite mensal
 */
const canUseQuiz = (isPremium: boolean): boolean => {
  if (isPremium) return true;
  const currentUsage = getQuizUsageFromStorage();
  return currentUsage.count < 3;
};

/**
 * Obtém o número de provas restantes
 */
const getRemainingQuizzes = (isPremium: boolean): number => {
  if (isPremium) return Infinity;
  const currentUsage = getQuizUsageFromStorage();
  return Math.max(0, 3 - currentUsage.count);
};

// Função de mapeamento do backend para o frontend
const mapBackendToFrontend = (backendQuestions: BackendQuestion[], subject: string, difficulty: string): Question[] => {
    return backendQuestions.map((q, index) => {
        const correctIndex = q.alternativas.findIndex((alt: any) => alt.correta === true);
        
        return {
            id: index,
            question: q.pergunta,
            options: q.alternativas.map((alt: any) => alt.texto),
            correct: correctIndex !== -1 ? correctIndex : 0, 
            difficulty: difficulty as any, 
            subject: subject, 
        };
    });
};

/**
 * Função para criar a evidência no backend e AGORA RECEBER AS QUESTÕES DIRETAMENTE.
 */
const createQuestions = async (data: any, isPdf: boolean, userEmail: string): Promise<BackendQuestion[]> => {
  const email = userEmail; // Usa o email dinâmico
  
  try {
    let createEvidenceResponse;
    
    if (isPdf) {
        // Rota de PDF (Form Data)
        createEvidenceResponse = await axios.post(
            `${API_BASE_URL}/create-evidence-pdf`, 
            data, 
            {
                headers: { "Content-Type": "multipart/form-data" } 
            }
        );
    } else {
        // Rota de Texto (JSON)
        createEvidenceResponse = await axios.post(
            `${API_BASE_URL}/create-evidence`, 
            JSON.stringify({
                subject: data.subject,
                level: data.level,
                email 
            }), 
            {
                headers: { "Content-Type": "application/json" }
            }
        );
    }

    // ALTERAÇÃO CRUCIAL: Retorna o array de questões diretamente da resposta da API de criação.
    if (createEvidenceResponse.data.questions && Array.isArray(createEvidenceResponse.data.questions)) {
        return createEvidenceResponse.data.questions;
    }
    
    // Se o backend retornar apenas o array na raiz:
    if (Array.isArray(createEvidenceResponse.data)) {
        return createEvidenceResponse.data as BackendQuestion[];
    }
    
    // Retorno de segurança se o formato for desconhecido
    console.warn("Resposta da API de criação de questões não está no formato esperado (questions[] ou questions: []).", createEvidenceResponse.data);
    return [];

  } catch (error) {
    console.error("Erro ao criar questões:", error);
    alert("Ocorreu um erro ao conectar com o backend ou gerar as questões. Verifique o console para mais detalhes.");
    return [];
  }
}

/**
 * Função para incrementar o contador de provas do usuário no backend. (Não alterada)
 */
const incrementProuveCount = async (userEmail: string) => {
  const email = userEmail; 
  try {
    await axios.post(
      `${API_BASE_URL}/done-prouve`, 
      { email }, 
      {
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Erro ao incrementar o contador de provas:", error);
  }
}

export const QuizInterface = ({
  user,
  onUpgrade,
  isPremium = false // NOVO: Valor padrão false
}: QuizInterfaceProps = {}) => {
  // O hook useSubscription utiliza o objeto 'user' dinâmico, garantindo o status premium correto
  const {
    canUseFeature,
    getRemainingUsage,
    incrementUsage,
    subscription
  } = useSubscription(user);
  
  const [customSubject, setCustomSubject] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState("");
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0); // Tempo crescente
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answerSubmitted, setAnswerSubmitted] = useState(false); 
  const [finalTime, setFinalTime] = useState(0);
  const [quizUsage, setQuizUsage] = useState<QuizUsageData>({ count: 0, month: getCurrentMonth() }); // NOVO: Estado para uso

  // NOVO: Carrega o uso de provas do localStorage na inicialização
  useEffect(() => {
    const usage = getQuizUsageFromStorage();
    setQuizUsage(usage);
  }, []);

  const startQuiz = async () => {
    // 1. Validação de Email
    const userEmail = user?.email;
    if (!userEmail) {
        alert("Erro: É necessário estar logado para iniciar uma prova. O email do usuário não foi encontrado.");
        return;
    }
    
    // 2. Outras validações
    if (!difficulty) {
        alert("Por favor, selecione a dificuldade.");
        return;
    }
    if (!customSubject && !pdfFile) {
        alert("Por favor, digite um assunto ou faça o upload de um PDF.");
        return;
    }

    // NOVO: Verificação de uso usando localStorage
    if (!isPremium && !canUseQuiz(isPremium)) {
        alert("Você atingiu o limite de 3 provas por mês. Faça upgrade para Premium para provas ilimitadas!");
        return;
    }
    
    // Variável que irá receber as questões diretamente da API
    let fetchedBackendQuestions: BackendQuestion[] = [];
    
    // Lógica condicional de chamada de API
    if (pdfFile) {
        const formData = new FormData();
        formData.append('pdfFile', pdfFile); 
        formData.append('email', userEmail); 
        formData.append('level', difficulty);
        
        // Chamada à API que agora retorna o array de questões
        fetchedBackendQuestions = await createQuestions(formData, true, userEmail); 
    } else if (customSubject) {
        const jsonData = { subject: customSubject, level: difficulty };
        // Chamada à API que agora retorna o array de questões
        fetchedBackendQuestions = await createQuestions(jsonData, false, userEmail); 
    }
    
    // Processamento das questões
    if (fetchedBackendQuestions.length > 0) {
        const subject = customSubject || (pdfFile ? pdfFile.name : "Assunto Personalizado");
        
        // Mapeamento das questões recebidas diretamente
        const newQuestions = mapBackendToFrontend(fetchedBackendQuestions, subject, difficulty);
        
        setQuestions(newQuestions);
        setIsQuizActive(true);
        setCurrentQuestion(0);
        setScore(0);
        setSelectedAnswer(null);
        setAnswerSubmitted(false);
        setQuizCompleted(false);
        setTimeElapsed(0); 
        
        // NOVO: Só incrementa o uso se não for premium
        if (!isPremium) {
          const newCount = incrementQuizUsage();
          setQuizUsage({ count: newCount, month: getCurrentMonth() });
        }
    } else {
        console.log("Não foi possível gerar questões. Quiz não iniciado.");
    }
  };
  
  // Lógica do Timer (Cronômetro crescente)
  useEffect(() => {
    let timer: number;
    if (isQuizActive) {
      timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000) as unknown as number;
    } 
    return () => clearInterval(timer);
  }, [isQuizActive]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      // Limpa o assunto personalizado se um PDF for carregado
      setCustomSubject(""); 
    } else {
      setPdfFile(null);
    }
  };
  
  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSubject(e.target.value);
    // Limpa o PDF se o usuário começar a digitar um assunto
    if (e.target.value) {
        setPdfFile(null);
    }
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (answerSubmitted) return; 
    setSelectedAnswer(answerIndex);
  };
  
  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    if (selectedAnswer === questions[currentQuestion].correct) {
      setScore(score + 1);
    }
    setAnswerSubmitted(true);
  };
  
  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setAnswerSubmitted(false);
    } else {
      // **Lógica de Finalização do Quiz**
      setQuizCompleted(true);
      setIsQuizActive(false);
      setFinalTime(timeElapsed);
      
      // Chama o incremento de provas com o email do usuário logado
      const userEmail = user?.email;
      if (userEmail) {
        incrementProuveCount(userEmail); 
      }
    }
  };
  
  const resetQuiz = () => {
    setIsQuizActive(false);
    setQuizCompleted(false);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setQuestions([]);
    setTimeElapsed(0); 
    setFinalTime(0);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // NOVO: Obtém o número de provas restantes
  const remainingQuizzes = getRemainingQuizzes(isPremium);
  
  // Renderização de Quiz Concluído... 
  if (quizCompleted) {
    const percentage = Math.round(score / questions.length * 100);
     return <div className="text-foreground">
        {/* Header - MODIFICADO AQUI: alterado de 'rounded-t-lg' para 'rounded-lg' */}
        <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-card-foreground">Quiz Concluído</h1>
              <p className="text-sm text-muted-foreground">Resultados da sua prova</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card p-8 text-center rounded-lg shadow-xl">
              <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-foreground mb-2">Quiz Concluído!</h1>
              <p className="text-muted-foreground mb-6">Veja seu desempenho abaixo</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-secondary/50 p-4 border-l-4 border-primary rounded-lg">
                  <p className="text-sm text-primary">Pontuação</p>
                  <p className="text-2xl font-bold text-foreground">{score}/{questions.length}</p>
                </div>
                <div className="bg-secondary/50 p-4 border-l-4 border-secondary rounded-lg">
                  <p className="text-sm text-secondary-foreground">Porcentagem</p>
                  <p className="text-2xl font-bold text-foreground">{percentage}%</p>
                </div>
                <div className="bg-secondary/50 p-4 border-l-4 border-accent rounded-lg">
                  <p className="text-sm text-accent-foreground">Assunto</p>
                  <p className="text-lg font-semibold text-foreground">{customSubject || pdfFile?.name || "Personalizado"}</p>
                </div>
                <div className="bg-secondary/50 p-4 border-l-4 border-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Tempo</p>
                  <p className="text-lg font-semibold text-foreground">{formatTime(finalTime)}</p>
                </div>
              </div>
              
              <Button onClick={resetQuiz} className="btn-glow">
                <RotateCcw className="w-4 h-4 mr-2" />
                Nova Prova
              </Button>
            </div>
          </div>
        </div>
      </div>;
  }
  
  // Renderização de Configuração do Quiz
  if (!isQuizActive) {
    const remaining = getRemainingQuizzes(isPremium);
    const canUse = canUseQuiz(isPremium);
    const content = <div className="">
      {/* Usage Banner - Só exibe se não for premium */}
      {!isPremium && (
        <UsageBanner 
          featureType="provas" 
          remaining={remaining} 
          total={3} 
          resetPeriod="mensalmente" 
          onUpgrade={() => onUpgrade?.()} 
          isPremium={isPremium} 
        />
      )}
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">

        {/* Título principal */}
        <div className="text-center mb-6 mt-4">
          <h1 className="font-bold mb-2 text-white text-4xl">Sistema de Provas</h1>
          <p className="text-foreground/70 text-lg mb-8">Configure sua prova personalizada</p>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto rounded-full mt-6"></div>
        </div>

        {/* Configuração da Prova */}
        <div className="bg-card p-6 mb-6 rounded-lg shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="glow-icon w-12 h-12 flex items-center justify-center">
              <TargetIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Comece sua consulta</h2>
              <p className="text-sm text-foreground/70">Escolha uma das opções abaixo ou crie seu próprio assunto</p>
            </div>
          </div>
          
          <div className="space-y-6 mb-6">
            <div>
              <Input 
                value={customSubject} 
                onChange={handleSubjectChange} 
                placeholder="Digite o assunto ou tema da prova" 
                className="input-glass" 
                disabled={!!pdfFile} 
              />
            </div>

            <div className="text-center text-foreground/60 font-medium">OU</div>

            <div>
              <div className={`bg-secondary/50 rounded-lg p-6 text-center hover:border-primary/50 transition-colors border ${pdfFile ? 'border-primary/50 border-solid bg-primary/10' : 'border-dashed border-primary/30'}`}>
                <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="pdf-upload" />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <BookOpen className="w-12 h-12 text-primary mx-auto mb-3" />
                  <p className="text-foreground/70">{pdfFile ? 'Arquivo Carregado' : 'Clique para fazer upload de um PDF'}</p>
                  {pdfFile && <p className="text-primary mt-2 font-medium">{pdfFile.name}</p>}
                </label>
              </div>
            </div>
            
            <div>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="input-glass">
                  <SelectValue placeholder="Selecione a dificuldade" />
                </SelectTrigger>
                <SelectContent className="bg-card shadow-lg">
                  <SelectItem value="Fácil">Fácil</SelectItem>
                  <SelectItem value="Médio">Médio</SelectItem>
                  <SelectItem value="Difícil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-center pt-4">
              <Button 
                onClick={startQuiz} 
                disabled={(!customSubject && !pdfFile) || !difficulty || (!isPremium && !canUse)} 
                className="btn-glow px-8 py-3 text-lg"
              >
                <TargetIcon className="w-5 h-5 mr-2" />
                {isPremium ? "Gerar Prova" : `Gerar Prova (${remaining} restantes)`}
              </Button>
            </div>
          </div>
        </div>

        {/* Cards de opções */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Tempo Controlado */}
          <div className="bg-card rounded-lg shadow-md border border-border">
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="glow-icon w-12 h-12 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Tempo Controlado</h3>
                  <p className="text-foreground/70 text-sm leading-relaxed">
                    Simule condições reais de prova com cronômetro
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo Personalizado */}
          <div className="bg-card rounded-lg shadow-md border border-border">
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="glow-icon w-12 h-12 flex items-center justify-center">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Conteúdo Personalizado</h3>
                  <p className="text-foreground/70 text-sm leading-relaxed">
                    Use seu próprio material de estudo em PDF ou texto
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Resultados Detalhados */}
          <div className="bg-card rounded-lg shadow-md border border-border">
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="glow-icon w-12 h-12 flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Resultados Detalhados</h3>
                  <p className="text-foreground/70 text-sm leading-relaxed">
                    Análise completa do seu desempenho na prova
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          
        </div>
      </div>
    </div>;
    
    // FeatureBlocker para quando atingir o limite mensal
    if (!isPremium && !canUse) {
      return (
        <FeatureBlocker 
          title="Limite Mensal Atingido" 
          description="Você atingiu o limite de 3 provas por mês no plano grátis. Assine o Premium para provas ilimitadas!" 
          onUpgrade={() => onUpgrade?.()}
        >
          {content}
        </FeatureBlocker>
      );
    }
    return content;
  }

  // Quiz ativo
  const question = questions[currentQuestion];
  
  return <>
      {/* Header Fixo do Quiz */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
            <TargetIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-card-foreground">Prova em Andamento</h1>
            <p className="text-sm text-muted-foreground">Questão {currentQuestion + 1} de {questions.length}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {formatTime(timeElapsed)}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Progress */}
          <div className="bg-card p-4 rounded-lg shadow-sm">
            <Progress value={(currentQuestion + 1) / questions.length * 100} className="h-3" />
          </div>

          {/* Questão */}
          <div className="bg-card p-8 rounded-lg shadow-xl">
            <h3 className="text-2xl font-semibold text-foreground mb-6">{question.question}</h3>
            
            <div className="space-y-3 mb-6">
              {question.options.map((option, index) => {
                  const isCorrect = index === question.correct;
                  const isSelected = selectedAnswer === index;
                  
                  let borderColor = "border-border hover:border-primary/50 hover:bg-primary/5";
                  let checkIcon = null;

                  if (answerSubmitted) {
                      if (isSelected && isCorrect) {
                          borderColor = "border-green-500 bg-green-500/10";
                          checkIcon = <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />;
                      } else if (isSelected && !isCorrect) {
                          borderColor = "border-red-500 bg-red-500/10";
                          checkIcon = <XCircle className="w-5 h-5 text-destructive ml-auto" />;
                      } else if (isCorrect) {
                          borderColor = "border-green-500/50 bg-green-500/5"; 
                      }
                  } else if (isSelected) {
                      borderColor = "border-primary bg-primary/10";
                  }

                  return (
                    <button 
                      key={index} 
                      onClick={() => handleAnswerSelect(index)} 
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${borderColor}`} 
                      disabled={answerSubmitted} 
                    >
                      <div className="flex items-center">
                        <span className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center mr-3 text-sm font-semibold">
                          {String.fromCharCode(65 + index)}
                        </span>
                        {option}
                        {checkIcon}
                      </div>
                    </button>
                  );
              })}
            </div>

            <div className="flex justify-center">
              {!answerSubmitted ? (
                <Button onClick={handleSubmitAnswer} disabled={selectedAnswer === null} className="btn-glow">
                  Confirmar Resposta
                </Button>
              ) : (
                <Button onClick={handleNextQuestion} className="btn-glow">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {currentQuestion < questions.length - 1 ? "Próxima Questão" : "Finalizar Prova"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>;
};